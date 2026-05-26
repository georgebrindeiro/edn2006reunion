"use client";

import { useState } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
  useMapContext,
} from "react-simple-maps";
import { Plus, Minus } from "lucide-react";

const GEO_URL =
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

export interface ClassmatePoint {
  id: string;
  fullName: string | null;
  photoNow: string | null;
  city: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
}

interface Cluster {
  key: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  members: ClassmatePoint[];
}

// Geographic clustering threshold in degrees — decreases as zoom increases
// At zoom 1: ~8°, at zoom 16: ~0.5° (São Paulo/Santos ~0.5° apart → separate at max zoom)
function clusterThresholdDeg(zoom: number): number {
  return 8 / zoom;
}

function geoDist(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLat = lat1 - lat2;
  const dLon = lon1 - lon2;
  return Math.sqrt(dLat * dLat + dLon * dLon);
}

function buildClusters(classmates: ClassmatePoint[], zoom: number): Cluster[] {
  const threshold = clusterThresholdDeg(zoom);
  const clusters: Cluster[] = [];

  for (const c of classmates) {
    if (c.latitude == null || c.longitude == null) continue;

    // Find nearest existing cluster within threshold
    let best: Cluster | null = null;
    let bestDist = Infinity;
    for (const cl of clusters) {
      const d = geoDist(c.latitude, c.longitude, cl.latitude, cl.longitude);
      if (d < threshold && d < bestDist) {
        bestDist = d;
        best = cl;
      }
    }

    if (best) {
      best.members.push(c);
      // Update centroid (average)
      const n = best.members.length;
      best.latitude  = best.members.reduce((s, m) => s + m.latitude!,  0) / n;
      best.longitude = best.members.reduce((s, m) => s + m.longitude!, 0) / n;
    } else {
      clusters.push({
        key:       `${c.latitude},${c.longitude}`,
        city:      c.city    ?? "Desconhecida",
        country:   c.country ?? "",
        latitude:  c.latitude,
        longitude: c.longitude,
        members:   [c],
      });
    }
  }

  return clusters;
}

function clusterLocationKey(cluster: Cluster): string {
  return cluster.members.map((m) => m.id).sort().join("|");
}

function getInitials(name: string | null): string {
  if (!name) return "?";
  return name.split(" ").filter(Boolean).map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

const BASE_AVATAR_R = 14;
const RINGS = [50, 85, 120, 160, 200].map((r) => ({
  r,
  capacity: Math.floor((2 * Math.PI * r) / (2 * BASE_AVATAR_R + 5)),
}));

function getAvatarPositions(count: number): { x: number; y: number }[] {
  const positions: { x: number; y: number }[] = [];
  let remaining = count;
  for (const ring of RINGS) {
    if (remaining <= 0) break;
    const inRing = Math.min(remaining, ring.capacity);
    for (let i = 0; i < inRing; i++) {
      const angle = (i / inRing) * 2 * Math.PI - Math.PI / 2;
      positions.push({ x: Math.cos(angle) * ring.r, y: Math.sin(angle) * ring.r });
    }
    remaining -= inRing;
  }
  return positions;
}

function getUsedRings(count: number): number[] {
  const used: number[] = [];
  let rem = count;
  for (const ring of RINGS) {
    if (rem <= 0) break;
    used.push(ring.r);
    rem -= ring.capacity;
  }
  return used;
}

function ConcentricOverlay({ cluster, zoom }: { cluster: Cluster; zoom: number }) {
  const { projection } = useMapContext();
  const coords = projection([cluster.longitude, cluster.latitude]);
  if (!coords) return null;
  const [cx, cy] = coords;

  // Scale avatar sizes inversely with zoom so they stay a consistent screen size
  const avatarR   = BASE_AVATAR_R / zoom;
  const ringScale = 1 / zoom;

  const count     = cluster.members.length;
  const positions = getAvatarPositions(count).map((p) => ({ x: p.x * ringScale, y: p.y * ringScale }));
  const usedRings = getUsedRings(count).map((r) => r * ringScale);
  const outerR    = (usedRings[usedRings.length - 1] ?? 30 * ringScale) + avatarR + 6 / zoom;

  return (
    <g transform={`translate(${cx}, ${cy})`} style={{ pointerEvents: "none" }}>
      <circle cx={0} cy={0} r={outerR} fill="rgba(255,255,255,0.72)" />

      {usedRings.map((r, i) => (
        <circle key={i} cx={0} cy={0} r={r} fill="none" stroke="#c8d8e8" strokeWidth={1 / zoom} strokeDasharray={`${4 / zoom} ${4 / zoom}`} />
      ))}

      {cluster.members.map((c, i) => {
        if (i >= positions.length) return null;
        const { x, y } = positions[i];
        return (
          <g key={c.id} transform={`translate(${x},${y})`} style={{ pointerEvents: "all", cursor: "default" }}>
            <title>{c.fullName ?? "?"}</title>
            <defs>
              <clipPath id={`wm-clip-${c.id}`}>
                <circle cx={0} cy={0} r={avatarR} />
              </clipPath>
            </defs>
            {c.photoNow ? (
              <>
                <image href={c.photoNow} x={-avatarR} y={-avatarR} width={avatarR * 2} height={avatarR * 2} clipPath={`url(#wm-clip-${c.id})`} preserveAspectRatio="xMidYMid slice" />
                <circle cx={0} cy={0} r={avatarR} fill="none" stroke="white" strokeWidth={1.5 / zoom} />
              </>
            ) : (
              <>
                <circle cx={0} cy={0} r={avatarR} fill="#8aa0b8" />
                <circle cx={0} cy={0} r={avatarR} fill="none" stroke="white" strokeWidth={1.5 / zoom} />
                <text textAnchor="middle" dominantBaseline="middle" style={{ fontSize: `${8 / zoom}px`, fill: "white", fontWeight: "600", fontFamily: "sans-serif" }}>
                  {getInitials(c.fullName)}
                </text>
              </>
            )}
          </g>
        );
      })}

      {/* Center pin */}
      <circle r={count === 1 ? 6 / zoom : 9 / zoom} fill="#2a3d6a" stroke="white" strokeWidth={1.5 / zoom} />
      {count > 1 && (
        <text textAnchor="middle" dominantBaseline="middle"
          style={{ fontSize: count >= 10 ? `${5 / zoom}px` : `${6 / zoom}px`, fill: "white", fontWeight: "700", fontFamily: "sans-serif" }}>
          {count}
        </text>
      )}
    </g>
  );
}

const ZOOM_STEPS = [1, 2, 4, 8, 16];
const DEFAULT_ZOOM_IDX = 0;

export function WorldMap({
  classmates,
  total,
  activeCities,
  onCityToggle,
}: {
  classmates: ClassmatePoint[];
  total: number;
  activeCities: Set<string>;
  onCityToggle: (city: string) => void;
}) {
  const [zoomIdx,  setZoomIdx]  = useState(DEFAULT_ZOOM_IDX);
  const [center,   setCenter]   = useState<[number, number]>([15, 5]);

  const zoom     = ZOOM_STEPS[zoomIdx];
  const clusters = buildClusters(classmates, zoom);
  const withLocation = classmates.filter((c) => c.latitude != null).length;

  return (
    <div className="bg-white rounded-2xl shadow-sm relative" style={{ overflow: "visible" }}>
      <ComposableMap
        width={800}
        height={430}
        projectionConfig={{ scale: 148, center: [15, 5] }}
        style={{ width: "100%", height: "auto", overflow: "visible" } as React.CSSProperties}
      >
        <ZoomableGroup
          zoom={zoom}
          center={center}
          onMoveEnd={({ coordinates }) => setCenter(coordinates as [number, number])}
          minZoom={1}
          maxZoom={16}
        >
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill="#e8f0f8"
                  stroke="#c8d8e8"
                  strokeWidth={0.5}
                  style={{
                    default: { outline: "none" },
                    hover:   { outline: "none", fill: "#dbeaf5" },
                    pressed: { outline: "none" },
                  }}
                />
              ))
            }
          </Geographies>

          {clusters.map((cluster) => {
            const locKey   = clusterLocationKey(cluster);
            const isActive = activeCities.has(locKey);
            const count    = cluster.members.length;
            const pinR     = (count === 1 ? 6 : 9) / zoom;
            const hitR     = (count === 1 ? 10 : 14) / zoom;
            return (
              <Marker
                key={cluster.key}
                coordinates={[cluster.longitude, cluster.latitude]}
                onClick={() => onCityToggle(locKey)}
              >
                {!isActive && (
                  <>
                    <circle
                      r={pinR}
                      fill="#1a2744"
                      stroke="white"
                      strokeWidth={1.5 / zoom}
                      className="cursor-pointer"
                    />
                    {count > 1 && (
                      <text textAnchor="middle" dominantBaseline="middle"
                        style={{ fontSize: count >= 10 ? `${5 / zoom}px` : `${6 / zoom}px`, fill: "white", fontWeight: "700", fontFamily: "sans-serif", pointerEvents: "none" }}>
                        {count}
                      </text>
                    )}
                  </>
                )}
                {isActive && (
                  <circle r={hitR} fill="transparent" className="cursor-pointer" />
                )}
              </Marker>
            );
          })}

          {clusters
            .filter((c) => activeCities.has(clusterLocationKey(c)))
            .map((cluster) => (
              <ConcentricOverlay key={`overlay-${cluster.key}`} cluster={cluster} zoom={zoom} />
            ))}
        </ZoomableGroup>
      </ComposableMap>

      {/* Zoom controls — bottom right */}
      <div className="absolute bottom-3 right-3 flex flex-col gap-1">
        <button
          onClick={() => setZoomIdx((i) => Math.min(i + 1, ZOOM_STEPS.length - 1))}
          disabled={zoomIdx === ZOOM_STEPS.length - 1}
          className="w-8 h-8 bg-white border border-edn-mist rounded-lg shadow-sm flex items-center justify-center text-edn-navy hover:bg-edn-cloud disabled:opacity-40 transition-colors"
          aria-label="Zoom in"
        >
          <Plus size={14} />
        </button>
        <button
          onClick={() => setZoomIdx((i) => Math.max(i - 1, 0))}
          disabled={zoomIdx === 0}
          className="w-8 h-8 bg-white border border-edn-mist rounded-lg shadow-sm flex items-center justify-center text-edn-navy hover:bg-edn-cloud disabled:opacity-40 transition-colors"
          aria-label="Zoom out"
        >
          <Minus size={14} />
        </button>
      </div>

      {withLocation < total && (
        <p className="text-center text-edn-gray text-xs font-body pb-2 px-4">
          {withLocation} de {total} com localização ·{" "}
          <span className="text-edn-steel">Atualize seu perfil para aparecer</span>
        </p>
      )}
    </div>
  );
}
