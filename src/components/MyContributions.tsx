"use client";

import { useState } from "react";
import { Loader2, Pencil, Trash2, RotateCcw, Check, X, Image as ImageIcon, Quote, BookOpen } from "lucide-react";
import { MEMORY_ERAS, type MemoryEra } from "@/lib/memory-eras";

interface MyMemory {
  id: string;
  type: string;
  title: string | null;
  content: string | null;
  era: string | null;
  mediaUrl: string | null;
  approved: boolean;
  createdAt: string;
}

const TYPE_ICONS: Record<string, React.ElementType> = {
  PHOTO: ImageIcon,
  QUOTE: Quote,
  STORY: BookOpen,
};

const TYPE_LABEL: Record<string, string> = {
  PHOTO: "Foto",
  QUOTE: "Citação",
  STORY: "História",
};

function MemoryCard({
  memory,
  onUpdate,
}: {
  memory: MyMemory;
  onUpdate: (updated: Partial<MyMemory>) => void;
}) {
  const [editing,  setEditing]  = useState(false);
  const [title,    setTitle]    = useState(memory.title ?? "");
  const [era,      setEra]      = useState<MemoryEra | null>((memory.era as MemoryEra) ?? null);
  const [saving,   setSaving]   = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirm,  setConfirm]  = useState(false);

  const Icon = TYPE_ICONS[memory.type] ?? ImageIcon;
  const isDeleted = !memory.approved;

  async function save() {
    setSaving(true);
    await fetch(`/api/memories/${memory.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title || null, era: era ?? null }),
    });
    setSaving(false);
    setEditing(false);
    onUpdate({ title: title || null, era });
  }

  async function softDelete() {
    setDeleting(true);
    await fetch(`/api/memories/${memory.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approved: false }),
    });
    setDeleting(false);
    setConfirm(false);
    onUpdate({ approved: false });
  }

  async function restore() {
    setDeleting(true);
    await fetch(`/api/memories/${memory.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approved: true }),
    });
    setDeleting(false);
    onUpdate({ approved: true });
  }

  return (
    <div className={`flex gap-3 p-3 rounded-xl border transition-all ${isDeleted ? "bg-gray-50 border-gray-200 opacity-60" : "bg-white border-edn-mist"}`}>
      {/* Thumbnail or icon */}
      {memory.type === "PHOTO" && memory.mediaUrl ? (
        <img src={memory.mediaUrl} alt={memory.title ?? ""} className="w-16 h-16 object-cover rounded-lg flex-shrink-0" />
      ) : (
        <div className="w-16 h-16 rounded-lg bg-edn-cloud flex items-center justify-center flex-shrink-0">
          <Icon size={20} className="text-edn-steel" />
        </div>
      )}

      <div className="flex-1 min-w-0 space-y-1">
        {isDeleted && (
          <span className="inline-block text-[10px] font-body text-gray-400 bg-gray-200 px-2 py-0.5 rounded-full">
            Removida
          </span>
        )}

        {editing ? (
          <div className="space-y-1.5">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Legenda (opcional)"
              className="w-full text-xs font-body border border-edn-mist rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-edn-steel"
            />
            {memory.type === "PHOTO" && (
              <select
                value={era ?? ""}
                onChange={(e) => setEra((e.target.value as MemoryEra) || null)}
                className="w-full text-xs font-body border border-edn-mist rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:border-edn-steel"
              >
                <option value="">Sem era</option>
                {MEMORY_ERAS.map((e) => (
                  <option key={e.value} value={e.value}>{e.emoji} {e.label}</option>
                ))}
              </select>
            )}
            <div className="flex gap-2">
              <button onClick={save} disabled={saving}
                className="flex items-center gap-1 text-xs font-body text-green-600 hover:text-green-700 disabled:opacity-50">
                {saving ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
                Salvar
              </button>
              <button onClick={() => { setEditing(false); setTitle(memory.title ?? ""); setEra((memory.era as MemoryEra) ?? null); }}
                className="text-xs font-body text-edn-gray/60 hover:text-edn-gray">
                <X size={11} className="inline" /> Cancelar
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-xs font-body text-edn-navy font-medium truncate">
              {TYPE_LABEL[memory.type]} · {memory.title || (memory.content ? memory.content.slice(0, 40) + "…" : "sem legenda")}
            </p>
            {memory.era && (
              <p className="text-[10px] font-body text-edn-gray">
                {MEMORY_ERAS.find((e) => e.value === memory.era)?.emoji}{" "}
                {MEMORY_ERAS.find((e) => e.value === memory.era)?.label}
              </p>
            )}
            <p className="text-[10px] font-body text-edn-gray/50">
              {new Date(memory.createdAt).toLocaleDateString("pt-BR")}
            </p>
          </>
        )}
      </div>

      {/* Actions */}
      {!editing && (
        <div className="flex flex-col gap-1.5 items-end flex-shrink-0">
          {!isDeleted ? (
            <>
              <button onClick={() => setEditing(true)}
                className="text-edn-gray/50 hover:text-edn-navy transition-colors">
                <Pencil size={13} />
              </button>
              {confirm ? (
                <div className="flex gap-1">
                  <button onClick={softDelete} disabled={deleting}
                    className="text-[10px] font-body text-red-500 hover:text-red-600">
                    {deleting ? <Loader2 size={10} className="animate-spin" /> : "Sim"}
                  </button>
                  <button onClick={() => setConfirm(false)}
                    className="text-[10px] font-body text-edn-gray/50 hover:text-edn-gray">
                    Não
                  </button>
                </div>
              ) : (
                <button onClick={() => setConfirm(true)}
                  className="text-edn-gray/30 hover:text-red-400 transition-colors">
                  <Trash2 size={13} />
                </button>
              )}
            </>
          ) : (
            <button onClick={restore} disabled={deleting}
              className="flex items-center gap-1 text-[10px] font-body text-edn-steel hover:text-edn-navy transition-colors">
              {deleting ? <Loader2 size={10} className="animate-spin" /> : <RotateCcw size={10} />}
              Restaurar
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function MyContributions({ initialMemories }: { initialMemories: MyMemory[] }) {
  const [memories, setMemories] = useState<MyMemory[]>(initialMemories);

  function handleUpdate(id: string, updated: Partial<MyMemory>) {
    setMemories((prev) => prev.map((m) => m.id === id ? { ...m, ...updated } : m));
  }

  if (memories.length === 0) {
    return (
      <div className="text-center py-8 text-edn-gray font-body text-sm">
        Você ainda não contribuiu com nenhuma memória.
      </div>
    );
  }

  const active  = memories.filter((m) => m.approved);
  const deleted = memories.filter((m) => !m.approved);

  return (
    <div className="space-y-2">
      {active.map((m) => (
        <MemoryCard key={m.id} memory={m} onUpdate={(u) => handleUpdate(m.id, u)} />
      ))}
      {deleted.length > 0 && (
        <>
          <p className="text-xs font-body text-edn-gray/50 pt-2">Removidas</p>
          {deleted.map((m) => (
            <MemoryCard key={m.id} memory={m} onUpdate={(u) => handleUpdate(m.id, u)} />
          ))}
        </>
      )}
    </div>
  );
}
