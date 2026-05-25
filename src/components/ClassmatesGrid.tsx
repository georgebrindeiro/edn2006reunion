"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { EditProfileModal } from "./EditProfileModal";
import { ClassmateDetailModal } from "./ClassmateDetailModal";

interface Classmate {
  id: string;
  fullName: string | null;
  birthday: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  photoThen: string | null;
  photoNow: string | null;
  studyPeriods: { yearStart: number; yearEnd: number }[];
}

function formatCardLocation(c: Classmate): string {
  if (!c.city) return "";
  const parts: string[] = [c.city];
  if (c.country === "Brasil" && c.state) parts.push(c.state);
  else if (c.country) parts.push(c.country);
  return parts.join(", ");
}

function getMapsUrl(c: Classmate): string {
  const query = [c.city, c.country].filter(Boolean).join(", ");
  return `https://www.google.com/maps/search/${encodeURIComponent(query)}`;
}

export function ClassmatesGrid({
  classmates,
  isAdmin,
}: {
  classmates: Classmate[];
  isAdmin: boolean;
}) {
  const [detailIndex, setDetailIndex] = useState<number | null>(null);
  const [editing, setEditing] = useState<Classmate | null>(null);

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {classmates.map((c, i) => (
          <div
            key={c.id}
            className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow relative cursor-pointer"
            onClick={() => setDetailIndex(i)}
          >
            {isAdmin && (
              <button
                onClick={(e) => { e.stopPropagation(); setEditing(c); }}
                className="absolute top-2 right-2 z-10 bg-white/90 hover:bg-white text-edn-navy rounded-full p-1.5 shadow transition-colors"
                title="Editar perfil"
              >
                <Pencil size={13} />
              </button>
            )}

            {/* Then & Now photos */}
            <div className="grid grid-cols-2 h-40">
              <div className="bg-edn-cloud flex items-center justify-center relative overflow-hidden">
                {c.photoThen ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={c.photoThen}
                    alt={`${c.fullName} — antes`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center p-2">
                    <div className="text-3xl">🎒</div>
                    <p className="text-edn-gray/60 text-[10px] font-body mt-1">
                      Foto antiga
                    </p>
                  </div>
                )}
                <span className="absolute bottom-1 left-1 bg-black/40 text-white text-[9px] font-body px-1 rounded">
                  Antes
                </span>
              </div>
              <div className="bg-edn-cloud flex items-center justify-center relative overflow-hidden">
                {c.photoNow ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={c.photoNow}
                    alt={`${c.fullName} — hoje`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center p-2">
                    <div className="text-3xl">🙂</div>
                    <p className="text-edn-gray/60 text-[10px] font-body mt-1">
                      Foto atual
                    </p>
                  </div>
                )}
                <span className="absolute bottom-1 right-1 bg-edn-navy/60 text-white text-[9px] font-body px-1 rounded">
                  Hoje
                </span>
              </div>
            </div>

            {/* Info */}
            <div className="p-3">
              <p
                className="font-body font-semibold text-edn-navy text-sm leading-snug"
                style={{ wordBreak: "break-word" }}
              >
                {c.fullName}
              </p>
              {c.city && (
                <p
                  className="text-edn-steel text-xs font-body mt-0.5 leading-snug"
                  style={{ wordBreak: "break-word" }}
                >
                  📍 {formatCardLocation(c)}
                </p>
              )}
              {c.studyPeriods.length > 0 && (
                <p className="text-edn-steel text-[10px] font-body mt-1">
                  EDN{" "}
                  {c.studyPeriods
                    .map((p) => `${p.yearStart}–${p.yearEnd}`)
                    .join(", ")}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {detailIndex !== null && (
        <ClassmateDetailModal
          classmates={classmates}
          initialIndex={detailIndex}
          onClose={() => setDetailIndex(null)}
        />
      )}

      {editing && (
        <EditProfileModal
          classmate={editing}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}
