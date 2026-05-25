"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Loader2, Check, X } from "lucide-react";

interface Memory {
  id:      string;
  type:    "QUOTE" | "STORY";
  title:   string | null;
  content: string | null;
  author:  string | null;
}

export function AdminEditButton({ memory, onSaved }: {
  memory: Memory;
  onSaved?: (updated: Partial<Memory>) => void;
}) {
  const router = useRouter();
  const [open,    setOpen]    = useState(false);
  const [title,   setTitle]   = useState(memory.title   ?? "");
  const [content, setContent] = useState(memory.content ?? "");
  const [author,  setAuthor]  = useState(memory.author  ?? "");
  const [saving,  setSaving]  = useState(false);
  const [done,    setDone]    = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const body: Record<string, string | null> = { content: content || null };
    if (memory.type === "STORY") body.title  = title  || null;
    if (memory.type === "QUOTE") body.author = author || null;

    await fetch(`/api/memories/${memory.id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(body),
    });
    setSaving(false);
    setDone(true);
    onSaved?.(body);
    router.refresh();
    setTimeout(() => { setOpen(false); setDone(false); }, 1000);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="opacity-0 group-hover:opacity-100 transition-opacity text-edn-steel hover:text-edn-navy p-1"
        title="Editar"
      >
        <Pencil size={13} />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-2xl shadow-xl p-5 w-full max-w-lg space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <p className="font-display text-edn-navy font-semibold">
                Editar {memory.type === "QUOTE" ? "citação" : "história"}
              </p>
              <button onClick={() => setOpen(false)} className="text-edn-gray/50 hover:text-edn-gray">
                <X size={18} />
              </button>
            </div>

            {done ? (
              <div className="flex items-center justify-center gap-2 py-4 text-green-600">
                <Check size={20} /> <span className="font-body text-sm">Salvo!</span>
              </div>
            ) : (
              <form onSubmit={save} className="space-y-3">
                {memory.type === "STORY" && (
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Título (opcional)"
                    className="w-full border border-edn-mist rounded-lg px-3 py-2.5 text-sm font-body focus:outline-none focus:border-edn-steel"
                  />
                )}
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={memory.type === "STORY" ? 8 : 3}
                  required
                  className="w-full border border-edn-mist rounded-lg px-3 py-2.5 text-sm font-body focus:outline-none focus:border-edn-steel resize-none"
                />
                {memory.type === "QUOTE" && (
                  <input
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    placeholder="Atribuir a..."
                    className="w-full border border-edn-mist rounded-lg px-3 py-2.5 text-sm font-body focus:outline-none focus:border-edn-steel"
                  />
                )}
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-2.5 rounded-xl bg-edn-navy text-white text-sm font-body font-semibold disabled:opacity-60 flex items-center justify-center gap-2 hover:bg-edn-navy/90"
                >
                  {saving && <Loader2 size={14} className="animate-spin" />}
                  {saving ? "Salvando..." : "Salvar"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
