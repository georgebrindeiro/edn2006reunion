"use client";

import { useState } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  useMapContext,
} from "react-simple-maps";
import { X } from "lucide-react";

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

// Round to 1 decimal place (~11 km) so slight Nominatim variation still clusters
function roundCoord(v: number) {
  return Math.round(v * 10) / 10;
}

function buildClusters(classmates: ClassmatePoint[]): Cluster[] {
  const map = new Map<string, Cluster>();
  for (const c of classmates) {
    if (c.latitude == null || c.longitude == null) continue;
    const key = `${roundCoord(c.latitude)},${roundCoord(c.longitude)}`;
    if (!map.has(key)) {
      map.set(key, {
        key,
        city:      c.city    ?? "Desconhecida",
        country:   c.country ?? "",
        latitude:  c.latitude,
        longitude: c.longitude,
        members:   [],
      });
    }
    map.get(key)!.members.push(c);
  }
  return Array.from(map.values());
}

function getInitials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const AVATAR_R = 14;
const RINGS = [50, 85, 120, 160, 200].map((r) => ({
  r,
  capacity: Math.floor((2 * Math.PI * r) / (2 * AVATAR_R + 5)),
}));

function getAvatarPositions(count: number): { x: number; y: number }[] {
  const positions: { x: number; y: number }[] = [];
  let remaining = count;
  for (const ring of RINGS) {
    if (remaining <= 0) break;
    const inRing = Math.min(remaining, ring.capacity);
    for (let i = 0; i < inRing; i++) {
      const angle = (i / inRing) * 2 * Math.PI - Math.PI / 2;
      positions.push({
        x: Math.cos(angle) * ring.r,
        y: Math.sin(angle) * ring.r,
      });
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

// Renders inside the ComposableMap SVG; positions itself using the map projection
function ConcentricOverlay({ cluster }: { cluster: Cluster }) {
  const { projection } = useMapContext();
  const coords = projection([cluster.longitude, cluster.latitude]);
  if (!coords) return null;
  const [cx, cy] = coords;

  const count     = cluster.members.length;
  const positions = getAvatarPositions(count);
  const usedRings = getUsedRings(count);
  const outerR    = (usedRings[usedRings.length - 1] ?? 30) + AVATAR_R + 6;

  return (
    <g transform={`translate(${cx}, ${cy})`} style={{ pointerEvents: "none" }}>
      {/* Frosted background disc */}
      <circle cx={0} cy={0} r={outerR} fill="rgba(255,255,255,0.72)" />

      {/* Dashed ring guides */}
      {usedRings.map((r) => (
        <circle
          key={r}
          cx={0} cy={0} r={r}
          fill="none"
          stroke="#c8d8e8"
          strokeWidth={1}
          strokeDasharray="4 4"
        />
      ))}

      {/* Avatar circles */}
      {cluster.members.map((c, i) => {
        if (i >= positions.length) return null;
        const { x, y } = positions[i];
        return (
          <g key={c.id} transform={`translate(${x},${y})`} style={{ pointerEvents: "all", cursor: "default" }}>
            <title>{c.fullName ?? "?"}</title>
            <defs>
              <clipPath id={`wm-clip-${c.id}`}>
                <circle cx={0} cy={0} r={AVATAR_R} />
              </clipPath>
            </defs>
            {c.photoNow ? (
              <>
                <image
                  href={c.photoNow}
                  x={-AVATAR_R} y={-AVATAR_R}
                  width={AVATAR_R * 2} height={AVATAR_R * 2}
                  clipPath={`url(#wm-clip-${c.id})`}
                  preserveAspectRatio="xMidYMid slice"
                />
                <circle cx={0} cy={0} r={AVATAR_R} fill="none" stroke="white" strokeWidth={1.5} />
              </>
            ) : (
              <>
                <circle cx={0} cy={0} r={AVATAR_R} fill="#8aa0b8" />
                <circle cx={0} cy={0} r={AVATAR_R} fill="none" stroke="white" strokeWidth={1.5} />
                <text
                  textAnchor="middle"
                  dominantBaseline="middle"
                  style={{
                    fontSize: "8px",
                    fill: "white",
                    fontWeight: "600",
                    fontFamily: "sans-serif",
                  }}
                >
                  {getInitials(c.fullName)}
                </text>
              </>
            )}
          </g>
        );
      })}

      {/* Pin re-rendered on top of the overlay */}
      <circle
        r={count === 1 ? 6 : 9}
        fill="#2a3d6a"
        stroke="white"
        strokeWidth={1.5}
      />
      {count > 1 && (
        <text
          textAnchor="middle"
          dominantBaseline="middle"
          style={{
            fontSize: count >= 10 ? "5px" : "6px",
            fill: "white",
            fontWeight: "700",
            fontFamily: "sans-serif",
          }}
        >
          {count}
        </text>
      )}
    </g>
  );
}

export function WorldMap({
  classmates,
  total,
}: {
  classmates: ClassmatePoint[];
  total: number;
}) {
  const [active, setActive] = useState<Cluster | null>(null);
  const clusters    = buildClusters(classmates);
  const withLocation = classmates.filter((c) => c.latitude != null).length;

  function toggleCluster(cluster: Cluster) {
    setActive((prev) => (prev?.key === cluster.key ? null : cluster));
  }

  return (
    <div className="space-y-3">
      {/* Map — no overflow-hidden so concentric overlay can extend past edges */}
      <div className="bg-white rounded-2xl shadow-sm" style={{ overflow: "visible" }}>
        <ComposableMap
          width={800}
          height={430}
          projectionConfig={{ scale: 148, center: [15, 5] }}
          style={{ width: "100%", height: "auto", overflow: "visible" } as React.CSSProperties}
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
                    default:  { outline: "none" },
                    hover:    { outline: "none", fill: "#dbeaf5" },
                    pressed:  { outline: "none" },
                  }}
                />
              ))
            }
          </Geographies>

          {/* Inactive pins */}
          {clusters.map((cluster) => {
            if (active?.key === cluster.key) return null;
            const count = cluster.members.length;
            return (
              <Marker
                key={cluster.key}
                coordinates={[cluster.longitude, cluster.latitude]}
                onClick={() => toggleCluster(cluster)}
              >
                <circle
                  r={count === 1 ? 6 : 9}
                  fill="#1a2744"
                  stroke="white"
                  strokeWidth={1.5}
                  className="cursor-pointer"
                />
                {count > 1 && (
                  <text
                    textAnchor="middle"
                    dominantBaseline="middle"
                    style={{
                      fontSize: count >= 10 ? "5px" : "6px",
                      fill: "white",
                      fontWeight: "700",
                      fontFamily: "sans-serif",
                      pointerEvents: "none",
                    }}
                  >
                    {count}
                  </text>
                )}
              </Marker>
            );
          })}

          {/* Active cluster — concentric overlay rendered last so it sits on top */}
          {active && <ConcentricOverlay cluster={active} />}

          {/* Invisible clickable area on the active pin so tapping it again closes */}
          {active && (
            <Marker
              coordinates={[active.longitude, active.latitude]}
              onClick={() => setActive(null)}
            >
              <circle
                r={active.members.length === 1 ? 10 : 12}
                fill="transparent"
                className="cursor-pointer"
              />
            </Marker>
          )}
        </ComposableMap>

        {withLocation < total && (
          <p className="text-center text-edn-gray text-xs font-body pb-2 px-4">
            {withLocation} de {total} colegas têm localização no mapa ·{" "}
            <span className="text-edn-steel">
              Atualize seu perfil para aparecer
            </span>
          </p>
        )}
      </div>

      {/* Names panel shown below map when a cluster is active */}
      {active && (
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-body font-semibold text-edn-navy text-sm">
                {active.city}
                {active.country ? `, ${active.country}` : ""}
              </h3>
              <p className="text-edn-gray text-xs font-body mt-0.5">
                {active.members.length} colega
                {active.members.length !== 1 ? "s" : ""} aqui
              </p>
            </div>
            <button
              onClick={() => setActive(null)}
              className="p-1 text-edn-gray hover:text-edn-navy rounded-lg transition-colors shrink-0"
            >
              <X size={16} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
            {active.members.map((c) => (
              <p
                key={c.id}
                className="text-xs font-body text-edn-navy leading-5"
                style={{ wordBreak: "break-word" }}
              >
                {c.fullName}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
