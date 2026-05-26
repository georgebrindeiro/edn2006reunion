"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  X, ChevronLeft, ChevronRight, Tag, GripVertical, Check, Loader2,
  UserPlus, Users, ChevronDown, Trash2, MessageSquare, Play, Folder, Link2,
} from "lucide-react";
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, useSortable, arrayMove, rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { MEMORY_ERAS, type MemoryEra } from "@/lib/memory-eras";
import { CommentThread } from "@/components/CommentThread";

const ERA_ORDER: Record<string, number> = {
  KINDERGARTEN: 0, LOWER_SCHOOL: 1, MIDDLE_SCHOOL: 2, HIGH_SCHOOL: 3, ADULT_LIFE: 4,
};
function eraIndex(era: string | null) { return era ? (ERA_ORDER[era] ?? 5) : 5; }

function sortedAll(photos: Photo[]): Photo[] {
  return [...photos].sort((a, b) => {
    const eraD = eraIndex(a.era) - eraIndex(b.era);
    if (eraD !== 0) return eraD;
    const aO = a.sortOrder ?? Infinity, bO = b.sortOrder ?? Infinity;
    if (aO !== bO) return aO - bO;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}
function sortedWithin(photos: Photo[]): Photo[] {
  return [...photos].sort((a, b) => {
    const aO = a.sortOrder ?? Infinity, bO = b.sortOrder ?? Infinity;
    if (aO !== bO) return aO - bO;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

interface TaggedUser { id: string; userId: string; fullName: string | null; photoNow: string | null; }
interface Photo {
  id: string; mediaUrl: string; mediaType: "PHOTO" | "VIDEO";
  title: string | null; era: string | null;
  sortOrder: number | null; createdAt: string; userName: string | null; tags: TaggedUser[];
}
interface Classmate { id: string; fullName: string; photoNow: string | null; }
type EraFilterValue = MemoryEra | "ALL" | "NONE";

function getInitials(name: string | null) {
  if (!name) return "?";
  return name.split(" ").filter(Boolean).map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

// ── Multi-select dropdown (generic) ─────────────────────────────────────────
function MultiSelectDropdown({
  label, icon: Icon, options, selected, onToggle, count,
}: {
  label: string;
  icon: React.ElementType;
  options: { key: string; label: string; sublabel?: string }[];
  selected: Set<string>;
  onToggle: (key: string) => void;
  count?: number;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function outside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", outside);
    return () => document.removeEventListener("mousedown", outside);
  }, []);

  if (options.length === 0) return null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-1.5 text-xs font-body px-3 py-1.5 rounded-full transition-colors whitespace-nowrap ${
          selected.size > 0 ? "bg-edn-navy text-white" : "bg-edn-cloud/70 text-edn-gray hover:bg-edn-cloud"
        }`}
      >
        <Icon size={12} />
        {label}
        {selected.size > 0 && (
          <span className="bg-white/25 rounded-full px-1.5 leading-4">{selected.size}</span>
        )}
        <ChevronDown size={11} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1.5 bg-white rounded-xl shadow-lg border border-edn-mist z-30 min-w-[220px] py-1.5 max-h-64 overflow-y-auto">
          {options.map((opt) => (
            <label key={opt.key} className="flex items-center gap-2.5 px-3.5 py-1.5 hover:bg-edn-cloud/40 cursor-pointer">
              <input
                type="checkbox"
                checked={selected.has(opt.key)}
                onChange={() => onToggle(opt.key)}
                className="rounded accent-[#1a2744]"
              />
              <span className="text-xs font-body text-edn-navy flex-1 truncate">{opt.label}</span>
              {opt.sublabel && (
                <span className="text-[10px] text-edn-gray/60 flex-shrink-0">{opt.sublabel}</span>
              )}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Sortable tile ────────────────────────────────────────────────────────────
function SortableTile({ photo }: { photo: Photo }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: photo.id });
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`relative group rounded-xl overflow-hidden bg-edn-cloud aspect-square ${isDragging ? "opacity-50 shadow-2xl z-50" : ""}`}>
      {photo.mediaType === "VIDEO" ? (
        <>
          <video src={photo.mediaUrl} muted playsInline
            className="w-full h-full object-cover" />
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <Play size={24} className="text-white fill-white drop-shadow" />
          </div>
        </>
      ) : (
        <img src={photo.mediaUrl} alt={photo.title ?? ""} className="w-full h-full object-cover" draggable={false} />
      )}
      <div {...attributes} {...listeners}
        className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/30 transition-colors cursor-grab active:cursor-grabbing">
        <GripVertical size={28} className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
      </div>
    </div>
  );
}

// ── Tag panel ────────────────────────────────────────────────────────────────
function TagPanel({ photo, classmates, onTagsChange }: {
  photo: Photo; classmates: Classmate[]; onTagsChange: (tags: TaggedUser[]) => void;
}) {
  const [search,  setSearch]  = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { inputRef.current?.focus(); }, []);

  const taggedIds   = new Set(photo.tags.map((t) => t.userId));
  const suggestions = classmates.filter(
    (c) => !taggedIds.has(c.id) && c.fullName.toLowerCase().includes(search.toLowerCase())
  );

  async function addTag(c: Classmate) {
    setLoading(c.id);
    const res = await fetch(`/api/memories/${photo.id}/tags`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: c.id }),
    });
    if (res.ok) {
      const tag = await res.json();
      onTagsChange([...photo.tags, { id: tag.id, userId: c.id, fullName: c.fullName, photoNow: c.photoNow }]);
    }
    setLoading(null); setSearch("");
  }

  async function removeTag(userId: string) {
    setLoading(userId);
    await fetch(`/api/memories/${photo.id}/tags`, {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    onTagsChange(photo.tags.filter((t) => t.userId !== userId));
    setLoading(null);
  }

  return (
    <div className="w-full max-w-xs space-y-2">
      <div className="relative">
        <input ref={inputRef} value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar colega para marcar..."
          className="w-full text-xs font-body bg-white/20 text-white placeholder:text-white/50 border border-white/30 rounded-lg px-3 py-1.5 focus:outline-none focus:border-white/60" />
        {search && suggestions.length > 0 && (
          <div className="absolute bottom-full left-0 right-0 mb-1 bg-white rounded-xl shadow-xl z-10 max-h-40 overflow-y-auto py-1">
            {suggestions.slice(0, 8).map((c) => (
              <button key={c.id} onClick={() => addTag(c)} disabled={loading === c.id}
                className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-edn-cloud/60 text-left">
                {c.photoNow
                  ? <img src={c.photoNow} alt="" className="w-6 h-6 rounded-full object-cover flex-shrink-0" />
                  : <div className="w-6 h-6 rounded-full bg-edn-steel flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-[8px] font-semibold">{getInitials(c.fullName)}</span>
                    </div>
                }
                <span className="text-edn-navy text-xs font-body">{c.fullName}</span>
                {loading === c.id && <Loader2 size={11} className="animate-spin text-edn-steel ml-auto" />}
              </button>
            ))}
          </div>
        )}
      </div>
      {photo.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {photo.tags.map((t) => (
            <span key={t.userId} className="flex items-center gap-1 bg-white/20 text-white text-xs font-body px-2 py-0.5 rounded-full">
              {t.fullName ?? "?"}
              <button onClick={() => removeTag(t.userId)} disabled={loading === t.userId} className="hover:text-red-300 ml-0.5">
                {loading === t.userId ? <Loader2 size={9} className="animate-spin" /> : <X size={9} />}
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function PhotoAlbumClient({
  photos: initial, classmates, isAdmin, initialPhotoId,
}: {
  photos: Photo[]; classmates: Classmate[]; isAdmin: boolean; initialPhotoId?: string | null;
}) {
  const [photos,         setPhotos]         = useState<Photo[]>(initial);
  const [eraFilter,      setEraFilter]      = useState<EraFilterValue>("ALL");
  const [personFilter,   setPersonFilter]   = useState<Set<string>>(new Set());
  const [labelFilter,    setLabelFilter]    = useState<Set<string>>(new Set());
  const [lightbox,       setLightbox]       = useState<number | null>(() => {
    if (!initialPhotoId) return null;
    const idx = sortedAll(initial).findIndex((p) => p.id === initialPhotoId);
    return idx !== -1 ? idx : null;
  });
  const [taggingEra,     setTaggingEra]     = useState(false);
  const [taggingWho,     setTaggingWho]     = useState(false);
  const [showComments,   setShowComments]   = useState(false);
  const [reorderItems,   setReorderItems]   = useState<Photo[]>([]);
  const [reordering,     setReordering]     = useState(false);
  const [saving,         setSaving]         = useState(false);
  const [saved,          setSaved]          = useState(false);
  const [deleting,       setDeleting]       = useState(false);
  const [confirmDelete,  setConfirmDelete]  = useState(false);
  const [copied,         setCopied]         = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const allSorted = useMemo(() => sortedAll(photos), [photos]);

  // Collect unique non-empty labels for the folder filter
  const allLabels = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of photos) {
      if (p.title?.trim()) counts.set(p.title.trim(), (counts.get(p.title.trim()) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .sort((a, b) => a[0].localeCompare(b[0], "pt-BR"))
      .map(([label, count]) => ({ key: label, label, sublabel: String(count) }));
  }, [photos]);

  // Tagged people for people filter
  const taggedPeople = useMemo(() =>
    Array.from(new Map(photos.flatMap((p) => p.tags).map((t) => [t.userId, t])).values())
      .sort((a, b) => (a.fullName ?? "").localeCompare(b.fullName ?? "", "pt-BR")),
    [photos]
  );

  const filtered = useMemo(() => {
    let base = allSorted;
    if (eraFilter === "NONE")     base = allSorted.filter((p) => !p.era);
    else if (eraFilter !== "ALL") base = allSorted.filter((p) => p.era === eraFilter);
    // Label filter: OR logic
    if (labelFilter.size > 0)    base = base.filter((p) => p.title && labelFilter.has(p.title.trim()));
    // Person filter: OR logic
    if (personFilter.size > 0)   base = base.filter((p) => p.tags.some((t) => personFilter.has(t.userId)));
    return eraFilter !== "ALL" ? sortedWithin(base) : base;
  }, [allSorted, eraFilter, personFilter, labelFilter]);

  const canReorder = isAdmin && eraFilter !== "ALL";

  // Sync ?photo=<id> in the URL whenever the lightbox opens, navigates, or closes
  useEffect(() => {
    const url = new URL(window.location.href);
    if (lightbox !== null && filtered[lightbox]) {
      url.searchParams.set("photo", filtered[lightbox].id);
    } else {
      url.searchParams.delete("photo");
    }
    window.history.replaceState(null, "", url.toString());
  }, [lightbox, filtered]);

  function startReorder() { setReorderItems([...filtered]); setReordering(true); }
  function cancelReorder() { setReorderItems([]); setReordering(false); }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setReorderItems((prev) => {
      const oi = prev.findIndex((p) => p.id === active.id);
      const ni = prev.findIndex((p) => p.id === over.id);
      return arrayMove(prev, oi, ni);
    });
  }

  async function saveOrder() {
    setSaving(true);
    const ids = reorderItems.map((p) => p.id);
    await fetch("/api/memories/reorder", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });
    setPhotos((prev) => {
      const updated = [...prev];
      ids.forEach((id, i) => {
        const idx = updated.findIndex((p) => p.id === id);
        if (idx !== -1) updated[idx] = { ...updated[idx], sortOrder: i };
      });
      return updated;
    });
    setSaving(false); setSaved(true);
    setTimeout(() => { setSaved(false); setReordering(false); setReorderItems([]); }, 1200);
  }

  const resetLightboxPanels = useCallback(() => {
    setTaggingEra(false); setTaggingWho(false); setConfirmDelete(false); setShowComments(false);
  }, []);

  const open  = useCallback((idx: number) => { resetLightboxPanels(); setLightbox(idx); }, [resetLightboxPanels]);
  const close = useCallback(() => { setLightbox(null); resetLightboxPanels(); }, [resetLightboxPanels]);
  const prev  = useCallback(() => { resetLightboxPanels(); setLightbox((i) => (i !== null && i > 0 ? i - 1 : i)); }, [resetLightboxPanels]);
  const next  = useCallback(() => { resetLightboxPanels(); setLightbox((i) => (i !== null && i < filtered.length - 1 ? i + 1 : i)); }, [filtered.length, resetLightboxPanels]);

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
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ era }),
    });
    setPhotos((prev) => prev.map((p) => p.id === photoId ? { ...p, era } : p));
    setTaggingEra(false);
  }

  function updateTags(photoId: string, tags: TaggedUser[]) {
    setPhotos((prev) => prev.map((p) => p.id === photoId ? { ...p, tags } : p));
  }

  async function deletePhoto(photoId: string) {
    setDeleting(true);
    await fetch(`/api/memories/${photoId}`, { method: "DELETE" });
    setPhotos((prev) => prev.filter((p) => p.id !== photoId));
    setDeleting(false);
    close();
  }

  function sharePhoto() {
    navigator.clipboard.writeText(window.location.href).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function togglePerson(id: string) {
    setPersonFilter((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  function toggleLabel(label: string) {
    setLabelFilter((prev) => { const n = new Set(prev); n.has(label) ? n.delete(label) : n.add(label); return n; });
  }

  const current = lightbox !== null ? filtered[lightbox] : null;
  const uncategorizedCount = photos.filter((p) => !p.era).length;
  const displayPhotos = reordering ? reorderItems : filtered;
  const activeFilters = personFilter.size + labelFilter.size;

  return (
    <>
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2">
        {!reordering && (
          <>
            <button onClick={() => { setEraFilter("ALL"); setPersonFilter(new Set()); setLabelFilter(new Set()); }}
              className={`text-xs font-body px-3 py-1.5 rounded-full transition-colors ${
                eraFilter === "ALL" && activeFilters === 0 ? "bg-edn-navy text-white" : "bg-edn-cloud/70 text-edn-gray hover:bg-edn-cloud"
              }`}>
              Todas ({photos.length})
            </button>

            {MEMORY_ERAS.map((era) => {
              const count = photos.filter((p) => p.era === era.value).length;
              if (count === 0 && !isAdmin) return null;
              return (
                <button key={era.value} onClick={() => { setEraFilter(era.value); setPersonFilter(new Set()); setLabelFilter(new Set()); }}
                  className={`text-xs font-body px-3 py-1.5 rounded-full transition-colors ${
                    eraFilter === era.value ? "bg-edn-navy text-white" : "bg-edn-cloud/70 text-edn-gray hover:bg-edn-cloud"
                  }`}>
                  {era.emoji} {era.label} ({count})
                </button>
              );
            })}

            {(uncategorizedCount > 0 || isAdmin) && (
              <button onClick={() => { setEraFilter("NONE"); setPersonFilter(new Set()); setLabelFilter(new Set()); }}
                className={`text-xs font-body px-3 py-1.5 rounded-full transition-colors ${
                  eraFilter === "NONE" ? "bg-edn-gray text-white" : "bg-edn-cloud/70 text-edn-gray hover:bg-edn-cloud"
                }`}>
                Sem era ({uncategorizedCount})
              </button>
            )}

            {/* Label / folder filter */}
            <MultiSelectDropdown
              label="Pastas"
              icon={Folder}
              options={allLabels}
              selected={labelFilter}
              onToggle={toggleLabel}
            />

            {/* Person filter */}
            <MultiSelectDropdown
              label="Pessoas"
              icon={Users}
              options={taggedPeople.map((p) => ({
                key: p.userId,
                label: p.fullName ?? "?",
                sublabel: String(photos.filter((ph) => ph.tags.some((t) => t.userId === p.userId)).length),
              }))}
              selected={personFilter}
              onToggle={togglePerson}
            />

            {/* Clear all extra filters */}
            {activeFilters > 0 && (
              <button onClick={() => { setPersonFilter(new Set()); setLabelFilter(new Set()); }}
                className="flex items-center gap-1 text-xs text-edn-gray/50 hover:text-edn-gray font-body transition-colors">
                <X size={11} /> limpar filtros
              </button>
            )}
          </>
        )}

        {isAdmin && (
          <div className="ml-auto flex items-center gap-2">
            {reordering ? (
              <>
                <p className="text-xs text-edn-gray font-body">Arraste para reordenar</p>
                <button onClick={cancelReorder}
                  className="text-xs font-body text-edn-gray/60 hover:text-edn-gray px-3 py-1.5 rounded-full border border-edn-mist transition-colors">
                  Cancelar
                </button>
                <button onClick={saveOrder} disabled={saving || saved}
                  className="flex items-center gap-1.5 text-xs font-body font-semibold bg-edn-navy text-white px-3 py-1.5 rounded-full disabled:opacity-70 hover:bg-edn-navy/90">
                  {saved ? <><Check size={12} /> Salvo</> : saving ? <><Loader2 size={12} className="animate-spin" /> Salvando…</> : "Salvar ordem"}
                </button>
              </>
            ) : canReorder ? (
              <button onClick={startReorder}
                className="text-xs font-body text-edn-steel hover:text-edn-navy px-3 py-1.5 rounded-full border border-edn-mist hover:border-edn-steel transition-colors">
                Reordenar
              </button>
            ) : (
              <span className="text-xs text-edn-gray/40 font-body hidden sm:inline">
                Selecione uma categoria para reordenar
              </span>
            )}
          </div>
        )}
      </div>

      {/* Result count when filtering */}
      {activeFilters > 0 && (
        <p className="text-xs font-body text-edn-gray/70">
          {filtered.length} resultado(s) com filtros ativos
        </p>
      )}

      {/* Grid */}
      {displayPhotos.length === 0 ? (
        <div className="text-center py-16 text-edn-gray font-body text-sm">
          {eraFilter === "NONE" ? "Nenhum item sem categoria." : "Nenhum resultado para os filtros selecionados."}
        </div>
      ) : reordering ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={reorderItems.map((p) => p.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
              {reorderItems.map((photo) => <SortableTile key={photo.id} photo={photo} />)}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <div className="columns-2 sm:columns-3 md:columns-4 gap-2 space-y-2">
          {displayPhotos.map((photo, idx) => (
            <div key={photo.id} onClick={() => open(idx)}
              className="break-inside-avoid cursor-pointer overflow-hidden rounded-xl group relative">
              {photo.mediaType === "VIDEO" ? (
                <>
                  <video src={photo.mediaUrl} muted playsInline
                    className="w-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
                    <Play size={28} className="text-white fill-white drop-shadow" />
                  </div>
                </>
              ) : (
                <img src={photo.mediaUrl} alt={photo.title ?? ""}
                  className="w-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
              )}
              {photo.era && (
                <div className="absolute top-1.5 left-1.5 bg-black/40 text-white text-[10px] font-body px-1.5 py-0.5 rounded-full">
                  {MEMORY_ERAS.find((e) => e.value === photo.era)?.emoji}
                </div>
              )}
              {photo.tags.length > 0 && (
                <div className="absolute bottom-1.5 left-1.5 flex -space-x-1">
                  {photo.tags.slice(0, 3).map((t) =>
                    t.photoNow
                      ? <img key={t.userId} src={t.photoNow} alt="" className="w-5 h-5 rounded-full object-cover border border-white" />
                      : <div key={t.userId} className="w-5 h-5 rounded-full bg-edn-steel border border-white flex items-center justify-center">
                          <span className="text-white text-[7px] font-semibold">{getInitials(t.fullName)}</span>
                        </div>
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
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center" onClick={close}>
          <div className="relative flex flex-col lg:flex-row max-w-5xl w-full max-h-[95vh] lg:max-h-[90vh] mx-2 lg:mx-4 overflow-y-auto lg:overflow-visible"
            onClick={(e) => e.stopPropagation()}>

            <div className="flex-1 flex flex-col items-center justify-center min-w-0 py-4 lg:py-0">
              {/* Video or image */}
              {current.mediaType === "VIDEO" ? (
                <video
                  src={current.mediaUrl}
                  controls
                  autoPlay
                  className="max-h-[55vh] lg:max-h-[72vh] max-w-full rounded-xl"
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <img src={current.mediaUrl} alt={current.title ?? ""}
                  className="max-h-[55vh] lg:max-h-[72vh] max-w-full object-contain rounded-xl" />
              )}

              <div className="mt-2 text-center">
                {current.title && <p className="text-white font-body text-sm">{current.title}</p>}
                <p className="text-white/50 font-body text-xs mt-0.5">
                  — {current.userName ?? "Colega"}
                  {current.era && <> · {MEMORY_ERAS.find((e) => e.value === current.era)?.label}</>}
                </p>
              </div>

              {current.tags.length > 0 && !taggingWho && (
                <div className="mt-2 flex flex-wrap gap-1.5 justify-center">
                  {current.tags.map((t) => (
                    <span key={t.userId} className="flex items-center gap-1 bg-white/15 text-white text-xs font-body px-2 py-0.5 rounded-full">
                      {t.photoNow && <img src={t.photoNow} alt="" className="w-4 h-4 rounded-full object-cover" />}
                      {t.fullName ?? "?"}
                    </span>
                  ))}
                </div>
              )}

              {taggingWho && (
                <div className="mt-3 w-full flex justify-center px-4">
                  <TagPanel photo={current} classmates={classmates}
                    onTagsChange={(tags) => updateTags(current.id, tags)} />
                </div>
              )}

              {isAdmin && taggingEra && (
                <div className="mt-3 flex flex-wrap gap-1.5 justify-center px-4">
                  <button onClick={() => applyEraTag(current.id, null)}
                    className="text-xs font-body bg-white/20 text-white px-2 py-1 rounded-full hover:bg-white/30">
                    Sem era
                  </button>
                  {MEMORY_ERAS.map((era) => (
                    <button key={era.value} onClick={() => applyEraTag(current.id, era.value)}
                      className={`text-xs font-body px-2 py-1 rounded-full hover:bg-white/30 transition-colors ${
                        current.era === era.value ? "bg-white text-edn-navy" : "bg-white/20 text-white"
                      }`}>
                      {era.emoji} {era.label}
                    </button>
                  ))}
                </div>
              )}

              {showComments && (
                <div className="lg:hidden mt-3 w-full bg-white rounded-xl overflow-hidden mx-4" style={{ maxWidth: "calc(100% - 2rem)" }}>
                  <div className="p-3 border-b border-edn-mist">
                    <p className="text-edn-navy text-sm font-body font-semibold">Comentários</p>
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    <CommentThread memoryId={current.id} />
                  </div>
                </div>
              )}

              {/* Action row */}
              <div className="mt-3 flex flex-wrap items-center gap-3 justify-center px-4">
                <button onClick={sharePhoto}
                  className="flex items-center gap-1 text-xs font-body transition-colors text-white/60 hover:text-white">
                  <Link2 size={12} />
                  {copied ? "Copiado!" : "Compartilhar"}
                </button>

                <button onClick={() => { setTaggingWho((v) => !v); setTaggingEra(false); setConfirmDelete(false); }}
                  className={`flex items-center gap-1 text-xs font-body transition-colors ${taggingWho ? "text-white" : "text-white/60 hover:text-white"}`}>
                  <UserPlus size={12} />
                  {taggingWho ? "Fechar" : current.tags.length > 0 ? "Editar pessoas" : "Marcar pessoas"}
                </button>

                <button onClick={() => { setShowComments((v) => !v); setTaggingWho(false); setTaggingEra(false); setConfirmDelete(false); }}
                  className={`lg:hidden flex items-center gap-1 text-xs font-body transition-colors ${showComments ? "text-white" : "text-white/60 hover:text-white"}`}>
                  <MessageSquare size={12} />
                  {showComments ? "Fechar comentários" : "Comentários"}
                </button>

                {isAdmin && (
                  <>
                    <button onClick={() => { setTaggingEra((v) => !v); setTaggingWho(false); setConfirmDelete(false); }}
                      className={`flex items-center gap-1 text-xs font-body transition-colors ${taggingEra ? "text-white" : "text-white/60 hover:text-white"}`}>
                      <Tag size={11} />
                      {taggingEra ? "Fechar" : "Classificar era"}
                    </button>

                    {confirmDelete ? (
                      <div className="flex items-center gap-2">
                        <span className="text-white/70 text-xs font-body">Tem certeza?</span>
                        <button onClick={() => deletePhoto(current.id)} disabled={deleting}
                          className="flex items-center gap-1 text-xs font-body text-red-400 hover:text-red-300 transition-colors">
                          {deleting ? <Loader2 size={11} className="animate-spin" /> : null}
                          {deleting ? "Removendo…" : "Sim, remover"}
                        </button>
                        <button onClick={() => setConfirmDelete(false)} className="text-xs font-body text-white/50 hover:text-white">Cancelar</button>
                      </div>
                    ) : (
                      <button onClick={() => { setConfirmDelete(true); setTaggingEra(false); setTaggingWho(false); }}
                        className="flex items-center gap-1 text-xs font-body text-white/40 hover:text-red-400 transition-colors">
                        <Trash2 size={11} /> Remover
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="hidden lg:flex flex-col w-72 ml-4 bg-white rounded-xl overflow-hidden flex-shrink-0">
              <div className="p-3 border-b border-edn-mist">
                <p className="text-edn-navy text-sm font-body font-semibold">Comentários</p>
              </div>
              <CommentThread memoryId={current.id} />
            </div>
          </div>

          {lightbox > 0 && (
            <button onClick={(e) => { e.stopPropagation(); prev(); }}
              className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-2">
              <ChevronLeft size={22} />
            </button>
          )}
          {lightbox < filtered.length - 1 && (
            <button onClick={(e) => { e.stopPropagation(); next(); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-2">
              <ChevronRight size={22} />
            </button>
          )}
          <button onClick={close}
            className="absolute top-3 right-3 bg-black/40 hover:bg-black/60 text-white rounded-full p-1.5">
            <X size={18} />
          </button>
        </div>
      )}
    </>
  );
}
