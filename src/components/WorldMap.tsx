"use client";

import { useRef, useState, useCallback } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
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

function memberLocationKey(c: ClassmatePoint): string {
  return [c.city, c.country].filter(Boolean).join(", ");
}

interface Cluster {
  key: string;
  latitude: number;
  longitude: number;
  locationKeys: string[];
  members: ClassmatePoint[];
}

// At base scale 148 the threshold is BASE_DEG; shrinks linearly as we zoom in.
const BASE_DEG = 4;

function clusterThresholdDeg(scale: number): number {
  return (148 / scale) * BASE_DEG;
}

function geoDist(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLat = lat1 - lat2, dLon = lon1 - lon2;
  return Math.sqrt(dLat * dLat + dLon * dLon);
}

function buildClusters(classmates: ClassmatePoint[], scale: number): Cluster[] {
  const threshold = clusterThresholdDeg(scale);
  const clusters: Cluster[] = [];
  for (const c of classmates) {
    if (c.latitude == null || c.longitude == null) continue;
    let best: Cluster | null = null;
    let bestDist = Infinity;
    for (const cl of clusters) {
      const d = geoDist(c.latitude, c.longitude, cl.latitude, cl.longitude);
      if (d < threshold && d < bestDist) { bestDist = d; best = cl; }
    }
    if (best) {
      best.members.push(c);
      const locKey = memberLocationKey(c);
      if (locKey && !best.locationKeys.includes(locKey)) best.locationKeys.push(locKey);
      const n = best.members.length;
      best.latitude  = best.members.reduce((s, m) => s + m.latitude!,  0) / n;
      best.longitude = best.members.reduce((s, m) => s + m.longitude!, 0) / n;
    } else {
      clusters.push({
        key: `${c.latitude},${c.longitude}`,
        latitude: c.latitude, longitude: c.longitude,
        locationKeys: memberLocationKey(c) ? [memberLocationKey(c)] : [],
        members: [c],
      });
    }
  }
  return clusters;
}

function getInitials(name: string | null): string {
  if (!name) return "?";
  return name.split(" ").filter(Boolean).map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

const AVATAR_R = 14;
const RINGS = [50, 85, 120, 160, 200].map((r) => ({
  r, capacity: Math.floor((2 * Math.PI * r) / (2 * AVATAR_R + 5)),
}));

function getAvatarPositions(count: number) {
  const positions: { x: number; y: number }[] = [];
  let rem = count;
  for (const ring of RINGS) {
    if (rem <= 0) break;
    const inRing = Math.min(rem, ring.capacity);
    for (let i = 0; i < inRing; i++) {
      const angle = (i / inRing) * 2 * Math.PI - Math.PI / 2;
      positions.push({ x: Math.cos(angle) * ring.r, y: Math.sin(angle) * ring.r });
    }
    rem -= inRing;
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

function ConcentricOverlay({ cluster, onClick }: {
  cluster: Cluster; onClick: () => void;
}) {
  const { projection } = useMapContext();
  const coords = projection([cluster.longitude, cluster.latitude]);
  if (!coords) return null;
  const [cx, cy] = coords;

  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const count     = cluster.members.length;
  const isSingle  = count === 1;
  const positions = isSingle ? [{ x: 0, y: 0 }] : getAvatarPositions(count);
  const usedRings = isSingle ? [] : getUsedRings(count);
  const outerR    = isSingle
    ? AVATAR_R + 4
    : (usedRings[usedRings.length - 1] ?? 30) + AVATAR_R + 6;

  const locationLines = cluster.locationKeys;
  const locY = outerR + 8;

  return (
    <g transform={`translate(${cx}, ${cy})`} onClick={onClick} style={{ cursor: "pointer" }}>
      {/* Transparent hit-area rendered first (behind everything) so clicks on the
          background and center dot — which have pointerEvents:none — still reach
          this <g> and fire onClick. Avatars rendered later sit on top and keep
          their own hover events. */}
      <circle r={outerR + 4} fill="transparent" />

      {/* Background + dashed rings — multi only */}
      {!isSingle && (
        <>
          <circle cx={0} cy={0} r={outerR} fill="rgba(255,255,255,0.72)"
            style={{ pointerEvents: "none" }} />
          {usedRings.map((r, i) => (
            <circle key={i} cx={0} cy={0} r={r} fill="none" stroke="#c8d8e8" strokeWidth={1}
              strokeDasharray="4 4" style={{ pointerEvents: "none" }} />
          ))}
        </>
      )}

      {/* Avatar bubbles */}
      {cluster.members.map((c, i) => {
        if (i >= positions.length) return null;
        const { x, y } = positions[i];
        const isHovered = hoveredId === c.id;
        const firstName = c.fullName?.split(" ")[0] ?? "?";
        const nameW     = Math.max(36, firstName.length * 5 + 12);

        return (
          <g key={c.id} transform={`translate(${x},${y})`}
            onMouseEnter={() => setHoveredId(c.id)}
            onMouseLeave={() => setHoveredId(null)}>
            <defs>
              <clipPath id={`wm-clip-${c.id}`}><circle cx={0} cy={0} r={AVATAR_R} /></clipPath>
            </defs>
            {c.photoNow ? (
              <>
                <image href={c.photoNow} x={-AVATAR_R} y={-AVATAR_R} width={AVATAR_R * 2} height={AVATAR_R * 2}
                  clipPath={`url(#wm-clip-${c.id})`} preserveAspectRatio="xMidYMid slice" />
                <circle cx={0} cy={0} r={AVATAR_R} fill="none" stroke="white" strokeWidth={1.5} />
              </>
            ) : (
              <>
                <circle cx={0} cy={0} r={AVATAR_R} fill="#8aa0b8" />
                <circle cx={0} cy={0} r={AVATAR_R} fill="none" stroke="white" strokeWidth={1.5} />
                <text textAnchor="middle" dominantBaseline="middle"
                  style={{ fontSize: "8px", fill: "white", fontWeight: "600",
                    fontFamily: "sans-serif", pointerEvents: "none" }}>
                  {getInitials(c.fullName)}
                </text>
              </>
            )}
            {/* Name pill — hover only */}
            {isHovered && (
              <g style={{ pointerEvents: "none" }}>
                <rect x={-nameW / 2} y={-(AVATAR_R + 18)} width={nameW} height={13} rx={3}
                  fill="rgba(26,39,68,0.88)" />
                <text textAnchor="middle" dominantBaseline="middle" y={-(AVATAR_R + 12)}
                  style={{ fontSize: "7px", fill: "white", fontWeight: "700", fontFamily: "sans-serif" }}>
                  {firstName}
                </text>
              </g>
            )}
          </g>
        );
      })}

      {/* Center count dot — multi only */}
      {!isSingle && (
        <>
          <circle r={9} fill="#2a3d6a" stroke="white" strokeWidth={1.5}
            style={{ pointerEvents: "none" }} />
          <text textAnchor="middle" dominantBaseline="middle"
            style={{ fontSize: count >= 10 ? "5px" : "6px", fill: "white", fontWeight: "700",
              fontFamily: "sans-serif", pointerEvents: "none" }}>
            {count}
          </text>
        </>
      )}

      {/* Location labels — all locations, stacked, always visible when expanded */}
      {locationLines.map((loc, i) => {
        const lw = Math.max(44, loc.length * 4.5 + 14);
        const ly = locY + i * 14;
        return (
          <g key={i} style={{ pointerEvents: "none" }}>
            <rect x={-lw / 2} y={ly} width={lw} height={12} rx={3}
              fill="rgba(255,255,255,0.92)" stroke="#c8d8e8" strokeWidth={0.5} />
            <text textAnchor="middle" dominantBaseline="middle" y={ly + 6}
              style={{ fontSize: "6.5px", fill: "#2a3d6a", fontWeight: "600", fontFamily: "sans-serif" }}>
              {loc}
            </text>
          </g>
        );
      })}
    </g>
  );
}

const ZOOM_STEPS: number[] = [148, 220, 330, 500, 750, 1100, 1650, 2500];
const DEFAULT_CENTER: [number, number] = [15, 5];

// Correct degrees-per-SVG-unit for D3 Mercator: full 360° = 2π × scale SVG units
function degPerSvgUnit(scale: number) {
  return 360 / (2 * Math.PI * scale);
}

export function WorldMap({
  classmates,
  total,
  activeCities,
  onCitiesToggle,
}: {
  classmates: ClassmatePoint[];
  total: number;
  activeCities: Set<string>;
  onCitiesToggle: (keys: string[]) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoomIdx,   setZoomIdx]   = useState(0);
  const [center,    setCenter]    = useState<[number, number]>(DEFAULT_CENTER);
  const [dragStart, setDragStart] = useState<{ x: number; y: number; center: [number, number] } | null>(null);
  const [didDrag,   setDidDrag]   = useState(false);

  const scale    = ZOOM_STEPS[zoomIdx];
  const clusters = buildClusters(classmates, scale);
  const withLocation = classmates.filter((c) => c.latitude != null).length;

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setDidDrag(false);
    setDragStart({ x: e.clientX, y: e.clientY, center: [...center] as [number, number] });
  }, [center]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragStart) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) setDidDrag(true);

    // Convert CSS pixels → degrees using the correct formula
    // SVG viewBox is 800 units wide; container's CSS clientWidth gives the scaling factor
    const cssWidth  = containerRef.current?.clientWidth ?? 800;
    const degPerPx  = degPerSvgUnit(scale) * (800 / cssWidth);
    const lonDelta  = -dx * degPerPx;
    const latDelta  =  dy * degPerPx;
    setCenter([
      dragStart.center[0] + lonDelta,
      Math.max(-75, Math.min(75, dragStart.center[1] + latDelta)),
    ]);
  }, [dragStart, scale]);

  const handleMouseUp = useCallback(() => {
    setDragStart(null);
    setTimeout(() => setDidDrag(false), 50);
  }, []);

  function handleClusterClick(cluster: Cluster) {
    if (didDrag) return;
    const anyActive = cluster.locationKeys.some((k) => activeCities.has(k));
    if (anyActive) {
      onCitiesToggle(cluster.locationKeys.map((k) => `-${k}`));
    } else {
      onCitiesToggle(cluster.locationKeys);
    }
  }

  return (
    <div
      ref={containerRef}
      className="bg-white rounded-2xl shadow-sm relative select-none"
      style={{ overflow: "hidden", cursor: dragStart ? "grabbing" : "grab" }}
      onMouseDown={handleMouseDown}
      onMouseMove={dragStart ? handleMouseMove : undefined}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <ComposableMap
        width={800}
        height={430}
        projectionConfig={{ scale, center }}
        style={{ width: "100%", height: "auto" } as React.CSSProperties}
      >
        <Geographies geography={GEO_URL}>
          {({ geographies }) =>
            geographies.map((geo) => (
              <Geography key={geo.rsmKey} geography={geo}
                fill="#e8f0f8" stroke="#c8d8e8" strokeWidth={0.5}
                style={{
                  default: { outline: "none" },
                  hover:   { outline: "none", fill: "#dbeaf5" },
                  pressed: { outline: "none" },
                }}
              />
            ))
          }
        </Geographies>

        {/* Collapsed pins */}
        {clusters.map((cluster) => {
          const isActive = cluster.locationKeys.some((k) => activeCities.has(k));
          const count    = cluster.members.length;
          if (isActive) return null;
          return (
            <Marker key={cluster.key} coordinates={[cluster.longitude, cluster.latitude]}
              onClick={() => handleClusterClick(cluster)}>
              <circle r={count === 1 ? 6 : 9} fill="#1a2744" stroke="white" strokeWidth={1.5}
                className="cursor-pointer" />
              {count > 1 && (
                <text textAnchor="middle" dominantBaseline="middle"
                  style={{ fontSize: count >= 10 ? "5px" : "6px", fill: "white",
                    fontWeight: "700", fontFamily: "sans-serif", pointerEvents: "none" }}>
                  {count}
                </text>
              )}
            </Marker>
          );
        })}

        {/* Expanded overlays */}
        {clusters
          .filter((c) => c.locationKeys.some((k) => activeCities.has(k)))
          .map((cluster) => (
            <ConcentricOverlay key={`overlay-${cluster.key}`} cluster={cluster}
              onClick={() => handleClusterClick(cluster)} />
          ))}
      </ComposableMap>

      {/* Zoom controls */}
      <div className="absolute bottom-3 right-3 flex flex-col gap-1 z-10">
        <button onClick={() => setZoomIdx((i) => Math.min(i + 1, ZOOM_STEPS.length - 1))}
          disabled={zoomIdx === ZOOM_STEPS.length - 1}
          className="w-8 h-8 bg-white border border-edn-mist rounded-lg shadow-sm flex items-center justify-center text-edn-navy hover:bg-edn-cloud disabled:opacity-40 transition-colors"
          onMouseDown={(e) => e.stopPropagation()}>
          <Plus size={14} />
        </button>
        <button onClick={() => setZoomIdx((i) => Math.max(i - 1, 0))}
          disabled={zoomIdx === 0}
          className="w-8 h-8 bg-white border border-edn-mist rounded-lg shadow-sm flex items-center justify-center text-edn-navy hover:bg-edn-cloud disabled:opacity-40 transition-colors"
          onMouseDown={(e) => e.stopPropagation()}>
          <Minus size={14} />
        </button>
      </div>

      {withLocation < total && (
        <p className="text-center text-edn-gray text-xs font-body py-2 px-4">
          {withLocation} de {total} com localização ·{" "}
          <span className="text-edn-steel">Atualize seu perfil para aparecer</span>
        </p>
      )}
    </div>
  );
}
