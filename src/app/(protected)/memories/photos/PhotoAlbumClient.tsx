"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  X, ChevronLeft, ChevronRight, Tag, GripVertical, Check, Loader2,
  UserPlus, Users,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  arrayMove,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { MEMORY_ERAS, type MemoryEra } from "@/lib/memory-eras";
import { CommentThread } from "@/components/CommentThread";

interface TaggedUser {
  id:       string;
  userId:   string;
  fullName: string | null;
  photoNow: string | null;
}

interface Photo {
  id:        string;
  mediaUrl:  string;
  title:     string | null;
  era:       string | null;
  sortOrder: number | null;
  createdAt: string;
  userName:  string | null;
  tags:      TaggedUser[];
}

interface Classmate {
  id:       string;
  fullName: string;
  photoNow: string | null;
}

function getInitials(name: string | null) {
  if (!name) return "?";
  return name.split(" ").filter(Boolean).map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

// ── Sortable tile ────────────────────────────────────────────────────────────
function SortableTile({ photo }: { photo: Photo }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: photo.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`relative group rounded-xl overflow-hidden bg-edn-cloud aspect-square ${
        isDragging ? "opacity-50 shadow-2xl z-50" : ""
      }`}
    >
      <img
        src={photo.mediaUrl}
        alt={photo.title ?? ""}
        className="w-full h-full object-cover"
        draggable={false}
      />
      <div
        {...attributes}
        {...listeners}
        className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/30 transition-colors cursor-grab active:cursor-grabbing"
      >
        <GripVertical size={28} className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
      </div>
    </div>
  );
}

// ── Tag panel shown inside lightbox ─────────────────────────────────────────
function TagPanel({
  photo,
  classmates,
  onTagsChange,
}: {
  photo: Photo;
  classmates: Classmate[];
  onTagsChange: (tags: TaggedUser[]) => void;
}) {
  const [search,  setSearch]  = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const taggedIds = new Set(photo.tags.map((t) => t.userId));
  const filtered  = classmates.filter(
    (c) =>
      !taggedIds.has(c.id) &&
      c.fullName.toLowerCase().includes(search.toLowerCase())
  );

  async function addTag(classmate: Classmate) {
    setLoading(classmate.id);
    const res = await fetch(`/api/memories/${photo.id}/tags`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ userId: classmate.id }),
    });
    if (res.ok) {
      const tag = await res.json();
      onTagsChange([...photo.tags, { id: tag.id, userId: classmate.id, fullName: classmate.fullName, photoNow: classmate.photoNow }]);
    }
    setLoading(null);
    setSearch("");
  }

  async function removeTag(tagUserId: string) {
    setLoading(tagUserId);
    await fetch(`/api/memories/${photo.id}/tags`, {
      method:  "DELETE",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ userId: tagUserId }),
    });
    onTagsChange(photo.tags.filter((t) => t.userId !== tagUserId));
    setLoading(null);
  }

  return (
    <div className="space-y-3">
      {/* Current tags */}
      {photo.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {photo.tags.map((t) => (
            <span
              key={t.userId}
              className="flex items-center gap-1 bg-white/20 text-white text-xs font-body px-2 py-0.5 rounded-full"
            >
              {t.fullName ?? "?"}
              <button
                onClick={() => removeTag(t.userId)}
                className="hover:text-red-300 ml-0.5"
                disabled={loading === t.userId}
              >
                {loading === t.userId ? <Loader2 size={9} className="animate-spin" /> : <X size={9} />}
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search + add */}
      <div className="relative">
        <input
          ref={inputRef}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar colega..."
          className="w-full text-xs font-body bg-white/20 text-white placeholder:text-white/50 border border-white/30 rounded-lg px-3 py-1.5 focus:outline-none focus:border-white/60"
        />
        {search && filtered.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl z-10 max-h-40 overflow-y-auto py-1">
            {filtered.slice(0, 8).map((c) => (
              <button
                key={c.id}
                onClick={() => addTag(c)}
                disabled={loading === c.id}
                className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-edn-cloud/60 text-left"
              >
                {c.photoNow ? (
                  <img src={c.photoNow} alt="" className="w-6 h-6 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-edn-steel flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-[8px] font-semibold">{getInitials(c.fullName)}</span>
                  </div>
                )}
                <span className="text-edn-navy text-xs font-body">{c.fullName}</span>
                {loading === c.id && <Loader2 size={11} className="animate-spin text-edn-steel ml-auto" />}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function PhotoAlbumClient({
  photos: initial,
  classmates,
  isAdmin,
}: {
  photos: Photo[];
  classmates: Classmate[];
  isAdmin: boolean;
}) {
  const [photos,      setPhotos]      = useState<Photo[]>(initial);
  const [eraFilter,   setEraFilter]   = useState<MemoryEra | "ALL">("ALL");
  const [personFilter, setPersonFilter] = useState<string | null>(null);
  const [lightbox,    setLightbox]    = useState<number | null>(null);
  const [taggingEra,  setTaggingEra]  = useState(false);
  const [taggingWho,  setTaggingWho]  = useState(false);
  const [reordering,  setReordering]  = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [saved,       setSaved]       = useState(false);

  const filtered = reordering
    ? photos
    : photos.filter((p) => {
        if (eraFilter !== "ALL" && p.era !== eraFilter) return false;
        if (personFilter && !p.tags.some((t) => t.userId === personFilter)) return false;
        return true;
      });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setPhotos((prev) => {
      const oldIdx = prev.findIndex((p) => p.id === active.id);
      const newIdx = prev.findIndex((p) => p.id === over.id);
      return arrayMove(prev, oldIdx, newIdx);
    });
  }

  async function saveOrder() {
    setSaving(true);
    await fetch("/api/memories/reorder", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ ids: photos.map((p) => p.id) }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => { setSaved(false); setReordering(false); }, 1200);
  }

  const open  = useCallback((idx: number) => { setTaggingEra(false); setTaggingWho(false); setLightbox(idx); }, []);
  const close = useCallback(() => { setLightbox(null); setTaggingEra(false); setTaggingWho(false); }, []);
  const prev  = useCallback(() => { setTaggingEra(false); setTaggingWho(false); setLightbox((i) => (i !== null && i > 0 ? i - 1 : i)); }, []);
  const next  = useCallback(() => { setTaggingEra(false); setTaggingWho(false); setLightbox((i) => (i !== null && i < filtered.length - 1 ? i + 1 : i)); }, [filtered.length]);

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
    setTaggingEra(false);
  }

  function updateTags(photoId: string, tags: TaggedUser[]) {
    setPhotos((prev) => prev.map((p) => p.id === photoId ? { ...p, tags } : p));
  }

  const current = lightbox !== null ? filtered[lightbox] : null;

  // Tagged people who appear in at least one photo
  const taggedPeople = Array.from(
    new Map(
      photos.flatMap((p) => p.tags).map((t) => [t.userId, t])
    ).values()
  ).sort((a, b) => (a.fullName ?? "").localeCompare(b.fullName ?? "", "pt-BR"));

  return (
    <>
      {/* Controls row */}
      <div className="flex flex-wrap items-center gap-2">
        {!reordering && (
          <>
            {/* Era filter */}
            <button
              onClick={() => setEraFilter("ALL")}
              className={`text-xs font-body px-3 py-1.5 rounded-full transition-colors ${
                eraFilter === "ALL" && !personFilter
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
                  onClick={() => { setEraFilter(era.value); setPersonFilter(null); }}
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

            {/* Person filter */}
            {taggedPeople.length > 0 && (
              <div className="flex items-center gap-1.5 border-l border-edn-mist pl-2 ml-0.5">
                <Users size={12} className="text-edn-steel flex-shrink-0" />
                {taggedPeople.map((t) => {
                  const count = photos.filter((p) => p.tags.some((pt) => pt.userId === t.userId)).length;
                  return (
                    <button
                      key={t.userId}
                      onClick={() => {
                        setPersonFilter(personFilter === t.userId ? null : t.userId);
                        setEraFilter("ALL");
                      }}
                      className={`flex items-center gap-1 text-xs font-body px-2.5 py-1.5 rounded-full transition-colors ${
                        personFilter === t.userId
                          ? "bg-edn-navy text-white"
                          : "bg-edn-cloud/70 text-edn-gray hover:bg-edn-cloud"
                      }`}
                    >
                      {t.photoNow && (
                        <img src={t.photoNow} alt="" className="w-4 h-4 rounded-full object-cover" />
                      )}
                      {t.fullName ?? "?"} ({count})
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Admin reorder controls */}
        {isAdmin && (
          <div className="ml-auto flex items-center gap-2">
            {reordering ? (
              <>
                <p className="text-xs text-edn-gray font-body">Arraste para reordenar</p>
                <button
                  onClick={() => { setPhotos(initial); setReordering(false); }}
                  className="text-xs font-body text-edn-gray/60 hover:text-edn-gray px-3 py-1.5 rounded-full border border-edn-mist transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={saveOrder}
                  disabled={saving || saved}
                  className="flex items-center gap-1.5 text-xs font-body font-semibold bg-edn-navy text-white px-3 py-1.5 rounded-full disabled:opacity-70 hover:bg-edn-navy/90"
                >
                  {saved   ? <><Check size={12} /> Salvo</> :
                   saving  ? <><Loader2 size={12} className="animate-spin" /> Salvando…</> :
                             "Salvar ordem"}
                </button>
              </>
            ) : (
              <button
                onClick={() => setReordering(true)}
                className="text-xs font-body text-edn-steel hover:text-edn-navy px-3 py-1.5 rounded-full border border-edn-mist hover:border-edn-steel transition-colors"
              >
                Reordenar
              </button>
            )}
          </div>
        )}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-edn-gray font-body text-sm">
          Nenhuma foto nesta categoria ainda.
        </div>
      ) : reordering ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={photos.map((p) => p.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
              {photos.map((photo) => <SortableTile key={photo.id} photo={photo} />)}
            </div>
          </SortableContext>
        </DndContext>
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
              {photo.tags.length > 0 && (
                <div className="absolute bottom-1.5 left-1.5 flex -space-x-1">
                  {photo.tags.slice(0, 3).map((t) =>
                    t.photoNow ? (
                      <img key={t.userId} src={t.photoNow} alt="" className="w-5 h-5 rounded-full object-cover border border-white" />
                    ) : (
                      <div key={t.userId} className="w-5 h-5 rounded-full bg-edn-steel border border-white flex items-center justify-center">
                        <span className="text-white text-[7px] font-semibold">{getInitials(t.fullName)}</span>
                      </div>
                    )
                  )}
                  {photo.tags.length > 3 && (
                    <div className="w-5 h-5 rounded-full bg-edn-navy border border-white flex items-center justify-center">
                      <span className="text-white text-[7px]">+{photo.tags.length - 3}</span>
                    </div>
                  )}
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
          <div
            className="relative flex max-w-5xl w-full max-h-[90vh] mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Image + metadata */}
            <div className="flex-1 flex flex-col items-center justify-center min-w-0">
              <img
                src={current.mediaUrl}
                alt={current.title ?? ""}
                className="max-h-[72vh] max-w-full object-contain rounded-xl"
              />

              {/* Caption + attribution */}
              <div className="mt-2 text-center">
                {current.title && (
                  <p className="text-white font-body text-sm">{current.title}</p>
                )}
                <p className="text-white/50 font-body text-xs mt-0.5">
                  — {current.userName ?? "Colega"}
                  {current.era && <> · {MEMORY_ERAS.find((e) => e.value === current.era)?.label}</>}
                </p>
              </div>

              {/* Tagged people */}
              {(current.tags.length > 0 || taggingWho) && (
                <div className="mt-2 flex flex-wrap gap-1.5 justify-center">
                  {!taggingWho && current.tags.map((t) => (
                    <span key={t.userId} className="flex items-center gap-1 bg-white/15 text-white text-xs font-body px-2 py-0.5 rounded-full">
                      {t.photoNow && <img src={t.photoNow} alt="" className="w-4 h-4 rounded-full object-cover" />}
                      {t.fullName ?? "?"}
                    </span>
                  ))}
                </div>
              )}

              {/* Tag classmates panel */}
              {taggingWho && (
                <div className="mt-3 w-full max-w-xs">
                  <TagPanel
                    photo={current}
                    classmates={classmates}
                    onTagsChange={(tags) => updateTags(current.id, tags)}
                  />
                </div>
              )}

              {/* Admin era tagging */}
              {isAdmin && taggingEra && (
                <div className="mt-3 flex flex-wrap gap-1.5 justify-center">
                  <button
                    onClick={() => applyEraTag(current.id, null)}
                    className="text-xs font-body bg-white/20 text-white px-2 py-1 rounded-full hover:bg-white/30"
                  >
                    Sem era
                  </button>
                  {MEMORY_ERAS.map((era) => (
                    <button
                      key={era.value}
                      onClick={() => applyEraTag(current.id, era.value)}
                      className={`text-xs font-body px-2 py-1 rounded-full hover:bg-white/30 transition-colors ${
                        current.era === era.value ? "bg-white text-edn-navy" : "bg-white/20 text-white"
                      }`}
                    >
                      {era.emoji} {era.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Action buttons */}
              <div className="mt-3 flex items-center gap-3">
                <button
                  onClick={() => { setTaggingWho((v) => !v); setTaggingEra(false); }}
                  className={`flex items-center gap-1 text-xs font-body transition-colors ${
                    taggingWho ? "text-white" : "text-white/60 hover:text-white"
                  }`}
                >
                  <UserPlus size={12} />
                  {taggingWho ? "Fechar" : current.tags.length > 0 ? "Editar pessoas" : "Marcar pessoas"}
                </button>
                {isAdmin && (
                  <button
                    onClick={() => { setTaggingEra((v) => !v); setTaggingWho(false); }}
                    className={`flex items-center gap-1 text-xs font-body transition-colors ${
                      taggingEra ? "text-white" : "text-white/60 hover:text-white"
                    }`}
                  >
                    <Tag size={11} />
                    {taggingEra ? "Fechar" : "Classificar era"}
                  </button>
                )}
              </div>
            </div>

            {/* Comment sidebar */}
            <div className="hidden lg:flex flex-col w-72 ml-4 bg-white rounded-xl overflow-hidden">
              <div className="p-3 border-b border-edn-mist">
                <p className="text-edn-navy text-sm font-body font-semibold">Comentários</p>
              </div>
              <CommentThread memoryId={current.id} />
            </div>
          </div>

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
