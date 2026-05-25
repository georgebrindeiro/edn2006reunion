"use client";

import { useState } from "react";
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";
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

function buildClusters(classmates: ClassmatePoint[]): Cluster[] {
  const map = new Map<string, Cluster>();
  for (const c of classmates) {
    if (c.latitude == null || c.longitude == null) continue;
    const key = `${c.city}|${c.country}`;
    if (!map.has(key)) {
      map.set(key, {
        key,
        city: c.city ?? "Desconhecida",
        country: c.country ?? "",
        latitude: c.latitude,
        longitude: c.longitude,
        members: [],
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
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

// Place avatars in concentric rings. Ring sizes are computed from circumference / avatar footprint.
const AVATAR_R = 12; // radius of each avatar circle in px
const AVATAR_SPACING = 4; // extra gap between avatars

const RINGS = [40, 70, 100, 130, 160].map((r) => ({
  r,
  capacity: Math.floor((2 * Math.PI * r) / (2 * AVATAR_R + AVATAR_SPACING)),
}));

function getAvatarPositions(count: number) {
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

function outerRingUsed(count: number): number {
  let remaining = count;
  let last = 0;
  for (const ring of RINGS) {
    if (remaining <= 0) break;
    remaining -= ring.capacity;
    last = ring.r;
  }
  return last;
}

function ConcentricView({ members }: { members: ClassmatePoint[] }) {
  const positions = getAvatarPositions(members.length);
  const maxR = outerRingUsed(members.length) || 40;
  const pad = AVATAR_R + 6;
  const half = maxR + pad;
  const size = half * 2;

  // Show ring guidelines only for rings that are actually used
  const usedRings: number[] = [];
  let rem = members.length;
  for (const ring of RINGS) {
    if (rem <= 0) break;
    usedRings.push(ring.r);
    rem -= ring.capacity;
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <svg
        width={size}
        height={size}
        viewBox={`${-half} ${-half} ${size} ${size}`}
        className="overflow-visible"
      >
        {/* Dashed ring guides */}
        {usedRings.map((r) => (
          <circle
            key={r}
            cx={0}
            cy={0}
            r={r}
            fill="none"
            stroke="#d5e4f0"
            strokeWidth={1}
            strokeDasharray="3 3"
          />
        ))}

        {/* Centre pin */}
        <circle cx={0} cy={0} r={7} fill="#1a2744" />
        <circle cx={0} cy={0} r={7} fill="none" stroke="white" strokeWidth={1.5} />

        {/* Avatar circles */}
        {members.map((c, i) => {
          if (i >= positions.length) return null;
          const { x, y } = positions[i];
          return (
            <g key={c.id} transform={`translate(${x},${y})`}>
              <defs>
                <clipPath id={`wm-clip-${c.id}`}>
                  <circle cx={0} cy={0} r={AVATAR_R} />
                </clipPath>
              </defs>
              {c.photoNow ? (
                <>
                  <image
                    href={c.photoNow}
                    x={-AVATAR_R}
                    y={-AVATAR_R}
                    width={AVATAR_R * 2}
                    height={AVATAR_R * 2}
                    clipPath={`url(#wm-clip-${c.id})`}
                    preserveAspectRatio="xMidYMid slice"
                  />
                  <circle
                    cx={0}
                    cy={0}
                    r={AVATAR_R}
                    fill="none"
                    stroke="white"
                    strokeWidth={1.5}
                  />
                </>
              ) : (
                <>
                  <circle cx={0} cy={0} r={AVATAR_R} fill="#8aa0b8" />
                  <circle
                    cx={0}
                    cy={0}
                    r={AVATAR_R}
                    fill="none"
                    stroke="white"
                    strokeWidth={1.5}
                  />
                  <text
                    textAnchor="middle"
                    dominantBaseline="middle"
                    style={{
                      fontSize: "8px",
                      fill: "white",
                      fontWeight: "600",
                      fontFamily: "sans-serif",
                      pointerEvents: "none",
                    }}
                  >
                    {getInitials(c.fullName)}
                  </text>
                </>
              )}
            </g>
          );
        })}
      </svg>

      {/* Name list */}
      <div className="w-full max-h-40 overflow-y-auto grid grid-cols-2 gap-x-3 gap-y-0.5 px-1">
        {members.map((c) => (
          <p
            key={c.id}
            className="text-xs font-body text-edn-navy leading-5 min-w-0"
            style={{ wordBreak: "break-word" }}
          >
            {c.fullName}
          </p>
        ))}
      </div>
    </div>
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
  const clusters = buildClusters(classmates);
  const withLocation = classmates.filter((c) => c.latitude != null).length;

  function toggleCluster(cluster: Cluster) {
    setActive((prev) => (prev?.key === cluster.key ? null : cluster));
  }

  return (
    <div className="space-y-3">
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
        <ComposableMap
          projectionConfig={{ scale: 140, center: [15, 10] }}
          style={{ width: "100%", height: "auto" }}
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
                    hover: { outline: "none", fill: "#dbeaf5" },
                    pressed: { outline: "none" },
                  }}
                />
              ))
            }
          </Geographies>

          {clusters.map((cluster) => {
            const isActive = active?.key === cluster.key;
            const count = cluster.members.length;
            return (
              <Marker
                key={cluster.key}
                coordinates={[cluster.longitude, cluster.latitude]}
                onClick={() => toggleCluster(cluster)}
              >
                {/* Outer glow ring when active */}
                {isActive && (
                  <circle
                    r={count === 1 ? 12 : 14}
                    fill="#1a2744"
                    fillOpacity={0.15}
                    style={{ pointerEvents: "none" }}
                  />
                )}

                {/* Pin body */}
                <circle
                  r={count === 1 ? 6 : 9}
                  fill={isActive ? "#2a3d6a" : "#1a2744"}
                  stroke="white"
                  strokeWidth={1.5}
                  className="cursor-pointer"
                  style={{ transition: "fill 0.15s" }}
                />

                {/* Count label */}
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

      {/* Expanded cluster panel */}
      {active && (
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <div className="flex items-start justify-between mb-4">
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
              aria-label="Fechar"
            >
              <X size={16} />
            </button>
          </div>
          <ConcentricView members={active.members} />
        </div>
      )}
    </div>
  );
}
