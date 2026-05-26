"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Check, Loader2, X, ChevronDown, AlertCircle, Users, Tag, Hash,
} from "lucide-react";
import { MEMORY_ERAS } from "@/lib/memory-eras";

interface AdminPhoto {
  id: string;
  mediaUrl: string;
  title: string | null;
  era: string | null;
  sortOrder: number | null;
  approved: boolean;
  createdAt: string;
  user: { id: string; fullName: string | null };
}

interface UserOption { id: string; fullName: string | null; }

function EraSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}
      className="text-xs font-body border border-edn-mist rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:border-edn-steel">
      <option value="">Sem era</option>
      {MEMORY_ERAS.map((e) => (
        <option key={e.value} value={e.value}>{e.emoji} {e.label}</option>
      ))}
    </select>
  );
}

type BatchMode = "era" | "owner" | "reorder" | null;

export function AdminPhotosPanel({ users }: { users: UserOption[] }) {
  const [photos,    setPhotos]    = useState<AdminPhoto[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [selected,  setSelected]  = useState<Set<string>>(new Set());
  const [mode,      setMode]      = useState<BatchMode>(null);
  const [saving,    setSaving]    = useState(false);
  const [saved,     setSaved]     = useState(false);
  const [error,     setError]     = useState("");

  // Batch era
  const [batchEra,   setBatchEra]   = useState("");
  // Batch owner
  const [batchOwner, setBatchOwner] = useState("");
  // Reorder: map id → position number string
  const [positions, setPositions] = useState<Record<string, string>>({});
  const [posError,  setPosError]  = useState("");

  // Era filter for displaying
  const [eraFilter, setEraFilter] = useState<string>("ALL");

  useEffect(() => {
    fetch("/api/admin/photos")
      .then((r) => r.json())
      .then((data) => { setPhotos(data); setLoading(false); });
  }, []);

  const filtered = useMemo(() => {
    if (eraFilter === "ALL")  return photos;
    if (eraFilter === "NONE") return photos.filter((p) => !p.era);
    return photos.filter((p) => p.era === eraFilter);
  }, [photos, eraFilter]);

  function toggleAll() {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((p) => p.id)));
    }
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function startMode(m: BatchMode) {
    setMode(m);
    setError(""); setPosError(""); setSaved(false);
    if (m === "reorder") {
      const pos: Record<string, string> = {};
      filtered.forEach((p, i) => { pos[p.id] = String(i + 1); });
      setPositions(pos);
    }
  }

  function cancelMode() {
    setMode(null); setError(""); setPosError("");
    setSelected(new Set());
  }

  function validatePositions(): boolean {
    const ids = filtered.map((p) => p.id);
    const nums = ids.map((id) => parseInt(positions[id] ?? ""));
    if (nums.some(isNaN)) { setPosError("Todos os campos devem ser números."); return false; }
    const sorted = [...nums].sort((a, b) => a - b);
    const hasDup = sorted.some((v, i) => i > 0 && v === sorted[i - 1]);
    if (hasDup) { setPosError("Posições duplicadas não são permitidas."); return false; }
    const hasGap = sorted.some((v, i) => v !== i + 1);
    if (hasGap) { setPosError(`Posições devem ser sequenciais de 1 a ${ids.length} sem lacunas.`); return false; }
    return true;
  }

  async function applyBatch() {
    setError(""); setPosError("");
    const ids = Array.from(selected);

    if (mode === "reorder") {
      if (!validatePositions()) return;
      setSaving(true);
      const sortOrders = filtered.map((p) => ({ id: p.id, sortOrder: parseInt(positions[p.id]) - 1 }));
      const res = await fetch("/api/admin/photos/batch", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: filtered.map((p) => p.id), sortOrders }),
      });
      if (res.ok) {
        setPhotos((prev) => {
          const updated = [...prev];
          sortOrders.forEach(({ id, sortOrder }) => {
            const idx = updated.findIndex((p) => p.id === id);
            if (idx !== -1) updated[idx] = { ...updated[idx], sortOrder };
          });
          return updated;
        });
        setSaved(true);
        setTimeout(() => { setSaved(false); cancelMode(); }, 1200);
      } else {
        setError("Erro ao salvar.");
      }
      setSaving(false);
      return;
    }

    if (ids.length === 0) { setError("Selecione pelo menos uma foto."); return; }

    const body: Record<string, unknown> = { ids };
    if (mode === "era")   body.era    = batchEra || null;
    if (mode === "owner") {
      if (!batchOwner) { setError("Selecione um responsável."); return; }
      body.userId = batchOwner;
    }

    setSaving(true);
    const res = await fetch("/api/admin/photos/batch", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      if (mode === "era") {
        setPhotos((prev) => prev.map((p) => selected.has(p.id) ? { ...p, era: batchEra || null } : p));
      }
      if (mode === "owner") {
        const owner = users.find((u) => u.id === batchOwner);
        setPhotos((prev) => prev.map((p) => selected.has(p.id) ? { ...p, user: { id: batchOwner, fullName: owner?.fullName ?? null } } : p));
      }
      setSaved(true);
      setTimeout(() => { setSaved(false); cancelMode(); }, 1200);
    } else {
      setError("Erro ao salvar.");
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-edn-gray font-body text-sm">
        <Loader2 size={20} className="animate-spin mr-2" /> Carregando fotos…
      </div>
    );
  }

  const allSelected = selected.size === filtered.length && filtered.length > 0;

  return (
    <div className="space-y-4">
      {/* Era filter chips */}
      <div className="flex flex-wrap gap-2 items-center">
        <button onClick={() => setEraFilter("ALL")}
          className={`text-xs font-body px-3 py-1.5 rounded-full transition-colors ${eraFilter === "ALL" ? "bg-edn-navy text-white" : "bg-edn-cloud/70 text-edn-gray hover:bg-edn-cloud"}`}>
          Todas ({photos.length})
        </button>
        {MEMORY_ERAS.map((era) => {
          const count = photos.filter((p) => p.era === era.value).length;
          return (
            <button key={era.value} onClick={() => setEraFilter(era.value)}
              className={`text-xs font-body px-3 py-1.5 rounded-full transition-colors ${eraFilter === era.value ? "bg-edn-navy text-white" : "bg-edn-cloud/70 text-edn-gray hover:bg-edn-cloud"}`}>
              {era.emoji} {era.label} ({count})
            </button>
          );
        })}
        <button onClick={() => setEraFilter("NONE")}
          className={`text-xs font-body px-3 py-1.5 rounded-full transition-colors ${eraFilter === "NONE" ? "bg-edn-gray text-white" : "bg-edn-cloud/70 text-edn-gray hover:bg-edn-cloud"}`}>
          Sem era ({photos.filter((p) => !p.era).length})
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 bg-edn-cloud/40 rounded-xl px-3 py-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={allSelected} onChange={toggleAll}
            className="rounded accent-[#1a2744]" />
          <span className="text-xs font-body text-edn-gray">
            {selected.size > 0 ? `${selected.size} selecionada(s)` : "Selecionar todas"}
          </span>
        </label>

        {mode === null && (
          <div className="flex items-center gap-2 ml-auto">
            <button onClick={() => startMode("era")}
              className="flex items-center gap-1.5 text-xs font-body text-edn-navy bg-white border border-edn-mist rounded-lg px-3 py-1.5 hover:bg-edn-cloud transition-colors">
              <Tag size={12} /> Definir era
            </button>
            <button onClick={() => startMode("owner")}
              className="flex items-center gap-1.5 text-xs font-body text-edn-navy bg-white border border-edn-mist rounded-lg px-3 py-1.5 hover:bg-edn-cloud transition-colors">
              <Users size={12} /> Atribuir responsável
            </button>
            <button onClick={() => startMode("reorder")}
              className="flex items-center gap-1.5 text-xs font-body text-edn-navy bg-white border border-edn-mist rounded-lg px-3 py-1.5 hover:bg-edn-cloud transition-colors">
              <Hash size={12} /> Reordenar por número
            </button>
          </div>
        )}

        {mode !== null && (
          <div className="flex flex-wrap items-center gap-2 ml-auto">
            {mode === "era" && (
              <EraSelect value={batchEra} onChange={setBatchEra} />
            )}
            {mode === "owner" && (
              <select value={batchOwner} onChange={(e) => setBatchOwner(e.target.value)}
                className="text-xs font-body border border-edn-mist rounded-lg px-2 py-1.5 bg-white focus:outline-none">
                <option value="">Selecione...</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.fullName ?? u.id}</option>
                ))}
              </select>
            )}
            {mode === "reorder" && (
              <span className="text-xs font-body text-edn-gray">
                Edite os números abaixo e clique em Salvar
              </span>
            )}
            {posError && (
              <span className="flex items-center gap-1 text-xs font-body text-red-500">
                <AlertCircle size={11} /> {posError}
              </span>
            )}
            {error && (
              <span className="text-xs font-body text-red-500">{error}</span>
            )}
            <button onClick={cancelMode}
              className="text-xs font-body text-edn-gray/60 hover:text-edn-gray px-2 py-1 rounded-lg border border-edn-mist transition-colors">
              Cancelar
            </button>
            <button onClick={applyBatch} disabled={saving || saved}
              className="flex items-center gap-1.5 text-xs font-body font-semibold bg-edn-navy text-white px-3 py-1.5 rounded-lg disabled:opacity-70 hover:bg-edn-navy/90 transition-colors">
              {saved ? <><Check size={11} /> Salvo</> : saving ? <><Loader2 size={11} className="animate-spin" /> Salvando…</> : "Salvar"}
            </button>
          </div>
        )}
      </div>

      {/* Photo grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
        {filtered.map((photo) => (
          <div key={photo.id}
            className={`relative rounded-xl overflow-hidden aspect-square cursor-pointer border-2 transition-all ${
              selected.has(photo.id) ? "border-edn-navy ring-2 ring-edn-navy/30" : "border-transparent"
            } ${!photo.approved ? "opacity-50" : ""}`}
            onClick={() => mode !== "reorder" && toggleOne(photo.id)}
          >
            <img src={photo.mediaUrl} alt={photo.title ?? ""} className="w-full h-full object-cover" loading="lazy" />

            {/* Selection checkbox */}
            {mode !== "reorder" && (
              <div className="absolute top-1 left-1">
                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                  selected.has(photo.id) ? "bg-edn-navy border-edn-navy" : "bg-white/70 border-white/70"
                }`}>
                  {selected.has(photo.id) && <Check size={10} className="text-white" />}
                </div>
              </div>
            )}

            {/* Era badge */}
            {photo.era && (
              <div className="absolute top-1 right-1 bg-black/50 text-white text-[10px] px-1 rounded-full">
                {MEMORY_ERAS.find((e) => e.value === photo.era)?.emoji}
              </div>
            )}

            {/* Owner label */}
            <div className="absolute bottom-0 inset-x-0 bg-black/50 px-1.5 py-1">
              <p className="text-white text-[9px] font-body truncate">{photo.user.fullName ?? "?"}</p>
            </div>

            {/* Reorder input */}
            {mode === "reorder" && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <input
                  type="number"
                  min={1}
                  max={filtered.length}
                  value={positions[photo.id] ?? ""}
                  onChange={(e) => setPositions((prev) => ({ ...prev, [photo.id]: e.target.value }))}
                  onClick={(e) => e.stopPropagation()}
                  className="w-12 text-center text-sm font-body font-bold border-2 border-white rounded-lg bg-white/90 text-edn-navy focus:outline-none focus:border-edn-navy"
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-10 text-edn-gray font-body text-sm">
          Nenhuma foto nesta categoria.
        </div>
      )}
    </div>
  );
}
