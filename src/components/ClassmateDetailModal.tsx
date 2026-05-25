"use client";

import { useEffect, useRef, useState } from "react";
import { X, ChevronLeft, ChevronRight, Phone, MapPin, Calendar, GraduationCap } from "lucide-react";

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

function formatBirthday(iso: string | null): string {
  if (!iso) return "";
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}

function formatLocation(c: Classmate): string {
  const parts: string[] = [];
  if (c.city) parts.push(c.city);
  if (c.country === "Brasil" && c.state) parts.push(c.state);
  else if (c.country) parts.push(c.country);
  return parts.join(", ");
}

function getMapsUrl(c: Classmate): string {
  const query = [c.city, c.country].filter(Boolean).join(", ");
  return `https://www.google.com/maps/search/${encodeURIComponent(query)}`;
}

export function ClassmateDetailModal({
  classmates,
  initialIndex,
  onClose,
}: {
  classmates: Classmate[];
  initialIndex: number;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(initialIndex);
  const c = classmates[index];

  const touchStartX = useRef<number | null>(null);

  function prev() { setIndex((i) => (i > 0 ? i - 1 : classmates.length - 1)); }
  function next() { setIndex((i) => (i < classmates.length - 1 ? i + 1 : 0)); }

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  });

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 50) {
      dx < 0 ? next() : prev();
    }
    touchStartX.current = null;
  }

  const whatsappLink = c.phone
    ? `https://wa.me/${c.phone.replace(/\D/g, "")}`
    : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-8"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden select-none"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <div className="flex items-center gap-2">
            <button onClick={prev} className="p-1.5 text-edn-gray hover:text-edn-navy rounded-lg transition-colors">
              <ChevronLeft size={18} />
            </button>
            <span className="text-edn-steel text-xs font-body">
              {index + 1} / {classmates.length}
            </span>
            <button onClick={next} className="p-1.5 text-edn-gray hover:text-edn-navy rounded-lg transition-colors">
              <ChevronRight size={18} />
            </button>
          </div>
          <button onClick={onClose} className="p-1.5 text-edn-gray hover:text-edn-navy rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Photos */}
        <div className="grid grid-cols-2 h-48">
          <div className="bg-edn-cloud flex items-center justify-center relative overflow-hidden">
            {c.photoThen ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={c.photoThen} alt="antes" className="w-full h-full object-cover" />
            ) : (
              <div className="text-center">
                <div className="text-4xl">🎒</div>
                <p className="text-edn-gray/50 text-[10px] font-body mt-1">Foto antiga</p>
              </div>
            )}
            <span className="absolute bottom-1 left-1 bg-black/40 text-white text-[9px] font-body px-1 rounded">
              Antes
            </span>
          </div>
          <div className="bg-edn-cloud flex items-center justify-center relative overflow-hidden">
            {c.photoNow ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={c.photoNow} alt="hoje" className="w-full h-full object-cover" />
            ) : (
              <div className="text-center">
                <div className="text-4xl">🙂</div>
                <p className="text-edn-gray/50 text-[10px] font-body mt-1">Foto atual</p>
              </div>
            )}
            <span className="absolute bottom-1 right-1 bg-edn-navy/60 text-white text-[9px] font-body px-1 rounded">
              Hoje
            </span>
          </div>
        </div>

        {/* Info */}
        <div className="px-5 py-4 space-y-3">
          <h2
            className="font-display text-edn-navy text-xl font-bold leading-tight"
            style={{ wordBreak: "break-word" }}
          >
            {c.fullName ?? "—"}
          </h2>

          <div className="space-y-2">
            {(c.city || c.country) && (
              <a
                href={getMapsUrl(c)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm font-body text-edn-steel hover:text-edn-navy transition-colors"
              >
                <MapPin size={14} className="shrink-0" />
                <span>{formatLocation(c)}</span>
              </a>
            )}

            {c.birthday && (
              <div className="flex items-center gap-2 text-sm font-body text-edn-steel">
                <Calendar size={14} className="shrink-0" />
                <span>{formatBirthday(c.birthday)}</span>
              </div>
            )}

            {c.studyPeriods.length > 0 && (
              <div className="flex items-center gap-2 text-sm font-body text-edn-steel">
                <GraduationCap size={14} className="shrink-0" />
                <span>
                  EDN {c.studyPeriods.map((p) => `${p.yearStart}–${p.yearEnd}`).join(", ")}
                </span>
              </div>
            )}

            {whatsappLink && (
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm font-body text-edn-steel hover:text-edn-navy transition-colors"
              >
                <Phone size={14} className="shrink-0" />
                <span>{c.phone}</span>
              </a>
            )}
          </div>
        </div>

        {/* Swipe hint */}
        <p className="text-center text-[10px] text-edn-gray/40 font-body pb-3">
          Deslize ou use as setas para navegar
        </p>
      </div>
    </div>
  );
}
