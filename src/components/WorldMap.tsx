"use client";

import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  useMapContext,
} from "react-simple-maps";

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
  return name.split(" ").filter(Boolean).map((n) => n[0]).slice(0, 2).join("").toUpperCase();
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
      <circle cx={0} cy={0} r={outerR} fill="rgba(255,255,255,0.72)" />

      {usedRings.map((r) => (
        <circle key={r} cx={0} cy={0} r={r} fill="none" stroke="#c8d8e8" strokeWidth={1} strokeDasharray="4 4" />
      ))}

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
                <image href={c.photoNow} x={-AVATAR_R} y={-AVATAR_R} width={AVATAR_R * 2} height={AVATAR_R * 2} clipPath={`url(#wm-clip-${c.id})`} preserveAspectRatio="xMidYMid slice" />
                <circle cx={0} cy={0} r={AVATAR_R} fill="none" stroke="white" strokeWidth={1.5} />
              </>
            ) : (
              <>
                <circle cx={0} cy={0} r={AVATAR_R} fill="#8aa0b8" />
                <circle cx={0} cy={0} r={AVATAR_R} fill="none" stroke="white" strokeWidth={1.5} />
                <text textAnchor="middle" dominantBaseline="middle" style={{ fontSize: "8px", fill: "white", fontWeight: "600", fontFamily: "sans-serif" }}>
                  {getInitials(c.fullName)}
                </text>
              </>
            )}
          </g>
        );
      })}

      {/* Pin re-rendered on top */}
      <circle r={count === 1 ? 6 : 9} fill="#2a3d6a" stroke="white" strokeWidth={1.5} />
      {count > 1 && (
        <text textAnchor="middle" dominantBaseline="middle" style={{ fontSize: count >= 10 ? "5px" : "6px", fill: "white", fontWeight: "700", fontFamily: "sans-serif" }}>
          {count}
        </text>
      )}
    </g>
  );
}

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
  // Always cluster ALL classmates so all pins are visible regardless of filters
  const clusters    = buildClusters(classmates);
  const withLocation = classmates.filter((c) => c.latitude != null).length;

  return (
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
                  default: { outline: "none" },
                  hover:   { outline: "none", fill: "#dbeaf5" },
                  pressed: { outline: "none" },
                }}
              />
            ))
          }
        </Geographies>

        {clusters.map((cluster) => {
          const isActive = activeCities.has(cluster.city);
          const count    = cluster.members.length;
          return (
            <Marker
              key={cluster.key}
              coordinates={[cluster.longitude, cluster.latitude]}
              onClick={() => onCityToggle(cluster.city)}
            >
              {!isActive && (
                <>
                  <circle
                    r={count === 1 ? 6 : 9}
                    fill="#1a2744"
                    stroke="white"
                    strokeWidth={1.5}
                    className="cursor-pointer"
                  />
                  {count > 1 && (
                    <text textAnchor="middle" dominantBaseline="middle" style={{ fontSize: count >= 10 ? "5px" : "6px", fill: "white", fontWeight: "700", fontFamily: "sans-serif", pointerEvents: "none" }}>
                      {count}
                    </text>
                  )}
                </>
              )}
              {/* Invisible hit area for active pins (rings have pointerEvents none) */}
              {isActive && (
                <circle r={count === 1 ? 10 : 14} fill="transparent" className="cursor-pointer" />
              )}
            </Marker>
          );
        })}

        {/* Active overlays rendered last (on top) */}
        {clusters
          .filter((c) => activeCities.has(c.city))
          .map((cluster) => (
            <ConcentricOverlay key={`overlay-${cluster.key}`} cluster={cluster} />
          ))}
      </ComposableMap>

      {withLocation < total && (
        <p className="text-center text-edn-gray text-xs font-body pb-2 px-4">
          {withLocation} de {total} com localização ·{" "}
          <span className="text-edn-steel">Atualize seu perfil para aparecer</span>
        </p>
      )}
    </div>
  );
}
