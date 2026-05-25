"use client";

import { useState, useEffect, useCallback } from "react";
import { X, ChevronLeft, ChevronRight, Tag } from "lucide-react";
import { MEMORY_ERAS, type MemoryEra } from "@/lib/memory-eras";
import { CommentThread } from "@/components/CommentThread";

interface Photo {
  id:        string;
  mediaUrl:  string;
  title:     string | null;
  era:       string | null;
  createdAt: string;
  userName:  string | null;
}

export function PhotoAlbumClient({
  photos: initial,
  isAdmin,
}: {
  photos: Photo[];
  isAdmin: boolean;
}) {
  const [photos,    setPhotos]    = useState<Photo[]>(initial);
  const [eraFilter, setEraFilter] = useState<MemoryEra | "ALL">("ALL");
  const [lightbox,  setLightbox]  = useState<number | null>(null);
  const [tagging,   setTagging]   = useState(false);

  const filtered = eraFilter === "ALL"
    ? photos
    : photos.filter((p) => p.era === eraFilter);

  const open = useCallback((idx: number) => setLightbox(idx), []);
  const close = useCallback(() => { setLightbox(null); setTagging(false); }, []);

  const prev = useCallback(() =>
    setLightbox((i) => (i !== null && i > 0 ? i - 1 : i)), []);
  const next = useCallback(() =>
    setLightbox((i) => (i !== null && i < filtered.length - 1 ? i + 1 : i)), [filtered.length]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (lightbox === null) return;
      if (e.key === "ArrowLeft")  prev();
      if (e.key === "ArrowRight") next();
      if (e.key === "Escape")     close();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, prev, next, close]);

  async function applyEraTag(photoId: string, era: MemoryEra | null) {
    await fetch(`/api/memories/${photoId}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ era }),
    });
    setPhotos((prev) => prev.map((p) => p.id === photoId ? { ...p, era } : p));
  }

  const current = lightbox !== null ? filtered[lightbox] : null;

  return (
    <>
      {/* Era filter pills */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setEraFilter("ALL")}
          className={`text-xs font-body px-3 py-1.5 rounded-full transition-colors ${
            eraFilter === "ALL"
              ? "bg-edn-navy text-white"
              : "bg-edn-cloud/70 text-edn-gray hover:bg-edn-cloud"
          }`}
        >
          Todas ({photos.length})
        </button>
        {MEMORY_ERAS.map((era) => {
          const count = photos.filter((p) => p.era === era.value).length;
          if (count === 0 && !isAdmin) return null;
          return (
            <button
              key={era.value}
              onClick={() => setEraFilter(era.value)}
              className={`text-xs font-body px-3 py-1.5 rounded-full transition-colors ${
                eraFilter === era.value
                  ? "bg-edn-navy text-white"
                  : "bg-edn-cloud/70 text-edn-gray hover:bg-edn-cloud"
              }`}
            >
              {era.emoji} {era.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Photo grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-edn-gray font-body text-sm">
          Nenhuma foto nesta categoria ainda.
        </div>
      ) : (
        <div className="columns-2 sm:columns-3 md:columns-4 gap-2 space-y-2">
          {filtered.map((photo, idx) => (
            <div
              key={photo.id}
              onClick={() => open(idx)}
              className="break-inside-avoid cursor-pointer overflow-hidden rounded-xl group relative"
            >
              <img
                src={photo.mediaUrl}
                alt={photo.title ?? ""}
                className="w-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
              {photo.era && (
                <div className="absolute top-1.5 left-1.5 bg-black/40 text-white text-[10px] font-body px-1.5 py-0.5 rounded-full">
                  {MEMORY_ERAS.find((e) => e.value === photo.era)?.emoji}
                </div>
              )}
              {photo.title && (
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-white text-xs font-body truncate">{photo.title}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox !== null && current && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={close}
        >
          {/* Main image + sidebar */}
          <div
            className="relative flex max-w-5xl w-full max-h-[90vh] mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Image side */}
            <div className="flex-1 flex flex-col items-center justify-center min-w-0">
              <img
                src={current.mediaUrl}
                alt={current.title ?? ""}
                className="max-h-[80vh] max-w-full object-contain rounded-xl"
              />
              {(current.title || current.userName) && (
                <div className="mt-2 text-center">
                  {current.title && (
                    <p className="text-white font-body text-sm">{current.title}</p>
                  )}
                  <p className="text-white/50 font-body text-xs mt-0.5">
                    — {current.userName ?? "Colega"}
                    {current.era && (
                      <> · {MEMORY_ERAS.find((e) => e.value === current.era)?.label}</>
                    )}
                  </p>
                </div>
              )}

              {/* Admin era tagging */}
              {isAdmin && (
                <div className="mt-3">
                  {tagging ? (
                    <div className="flex flex-wrap gap-1.5 justify-center">
                      <button
                        onClick={() => { applyEraTag(current.id, null); setTagging(false); }}
                        className="text-xs font-body bg-white/20 text-white px-2 py-1 rounded-full hover:bg-white/30"
                      >
                        Sem era
                      </button>
                      {MEMORY_ERAS.map((era) => (
                        <button
                          key={era.value}
                          onClick={() => { applyEraTag(current.id, era.value); setTagging(false); }}
                          className={`text-xs font-body px-2 py-1 rounded-full hover:bg-white/30 transition-colors ${
                            current.era === era.value ? "bg-white text-edn-navy" : "bg-white/20 text-white"
                          }`}
                        >
                          {era.emoji} {era.label}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <button
                      onClick={() => setTagging(true)}
                      className="flex items-center gap-1 text-xs font-body text-white/60 hover:text-white transition-colors"
                    >
                      <Tag size={11} /> Classificar era
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Comment sidebar */}
            <div className="hidden lg:flex flex-col w-72 ml-4 bg-white rounded-xl overflow-hidden">
              <div className="p-3 border-b border-edn-mist">
                <p className="text-edn-navy text-sm font-body font-semibold">Comentários</p>
              </div>
              <CommentThread memoryId={current.id} />
            </div>
          </div>

          {/* Nav buttons */}
          {lightbox > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); prev(); }}
              className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-2"
            >
              <ChevronLeft size={22} />
            </button>
          )}
          {lightbox < filtered.length - 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); next(); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-2"
            >
              <ChevronRight size={22} />
            </button>
          )}
          <button
            onClick={close}
            className="absolute top-3 right-3 bg-black/40 hover:bg-black/60 text-white rounded-full p-1.5"
          >
            <X size={18} />
          </button>
        </div>
      )}
    </>
  );
}
