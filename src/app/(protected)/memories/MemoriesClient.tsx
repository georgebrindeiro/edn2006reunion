"use client";

import { useState } from "react";
import { Loader2, Plus } from "lucide-react";

type MemoryType = "QUOTE" | "STORY" | "PHOTO";

interface Memory {
  id:        string;
  type:      MemoryType;
  title?:    string;
  content?:  string;
  mediaUrl?: string;
  user:      { fullName?: string };
  createdAt: string;
}

const TABS: { key: MemoryType | "ALL"; label: string }[] = [
  { key: "ALL",   label: "Todas" },
  { key: "QUOTE", label: "Citações" },
  { key: "STORY", label: "Histórias" },
  { key: "PHOTO", label: "Fotos" },
];

export function MemoriesClient({
  initialMemories,
  userEmail,
}: {
  initialMemories: Memory[];
  userEmail: string;
}) {
  const [tab,       setTab]       = useState<"ALL" | MemoryType>("ALL");
  const [memories,  setMemories]  = useState<Memory[]>(initialMemories);
  const [showForm,  setShowForm]  = useState(false);
  const [type,      setType]      = useState<MemoryType>("QUOTE");
  const [title,     setTitle]     = useState("");
  const [content,   setContent]   = useState("");
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");

  const filtered = tab === "ALL" ? memories : memories.filter((m) => m.type === tab);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/memories", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, title, content }),
    });

    if (res.ok) {
      const newMemory = await res.json();
      setMemories([newMemory, ...memories]);
      setShowForm(false);
      setTitle("");
      setContent("");
    } else {
      setError("Erro ao salvar. Tente novamente.");
    }
    setLoading(false);
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-edn-navy text-lg font-semibold">
          💬 Da turma
        </h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 bg-edn-navy text-white text-xs font-body font-semibold px-4 py-2 rounded-lg hover:bg-edn-navy-mid transition-colors"
        >
          <Plus size={14} /> Contribuir
        </button>
      </div>

      {/* Contribution form */}
      {showForm && (
        <form onSubmit={handleSubmit}
          className="bg-white rounded-xl p-5 shadow-sm space-y-4 border-l-4 border-edn-navy">
          <div className="grid grid-cols-3 gap-2">
            {(["QUOTE", "STORY", "PHOTO"] as MemoryType[]).map((t) => (
              <button key={t} type="button" onClick={() => setType(t)}
                className={`py-2 rounded-lg text-xs font-body font-medium border-2 transition-all ${
                  type === t
                    ? "border-edn-navy bg-edn-navy text-white"
                    : "border-edn-mist text-edn-navy"
                }`}>
                {t === "QUOTE" ? "Citação" : t === "STORY" ? "História" : "Foto / Vídeo"}
              </button>
            ))}
          </div>

          {type !== "PHOTO" && (
            <>
              {type === "STORY" && (
                <input value={title} onChange={(e) => setTitle(e.target.value)}
                  placeholder="Título da história"
                  className="w-full border border-edn-mist rounded-lg px-3 py-2.5 text-sm font-body text-edn-navy focus:outline-none focus:border-edn-steel" />
              )}
              <textarea value={content} onChange={(e) => setContent(e.target.value)}
                required rows={type === "STORY" ? 5 : 2}
                placeholder={type === "QUOTE" ? "Uma citação memorável da época..." : "Conte uma história..."}
                className="w-full border border-edn-mist rounded-lg px-3 py-2.5 text-sm font-body text-edn-navy focus:outline-none focus:border-edn-steel resize-none" />
            </>
          )}

          {type === "PHOTO" && (
            <div className="bg-edn-cloud rounded-lg p-4 text-center">
              <p className="text-edn-gray text-sm font-body">
                Upload de fotos/vídeos será ativado com Uploadthing.
              </p>
              <p className="text-edn-gray/60 text-xs font-body mt-1">
                Configure <code>UPLOADTHING_SECRET</code> no <code>.env.local</code>
              </p>
            </div>
          )}

          {error && <p className="text-red-500 text-xs font-body">{error}</p>}

          <div className="flex gap-2">
            <button type="button" onClick={() => setShowForm(false)}
              className="flex-1 py-2.5 rounded-lg text-sm font-body text-edn-gray border border-edn-mist hover:bg-edn-cloud transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 rounded-lg text-sm font-body font-semibold bg-edn-navy text-white hover:bg-edn-navy-mid transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
              {loading && <Loader2 size={14} className="animate-spin" />}
              {loading ? "Salvando..." : "Publicar"}
            </button>
          </div>
        </form>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-xl p-1 shadow-sm">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 py-2 rounded-lg text-xs font-body font-medium transition-all ${
              tab === t.key
                ? "bg-edn-navy text-white"
                : "text-edn-gray hover:text-edn-navy"
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Memory cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-edn-gray font-body text-sm">
          Nenhuma memória ainda nesta categoria. Seja o primeiro a contribuir!
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((m) => (
            <MemoryCard key={m.id} memory={m} />
          ))}
        </div>
      )}
    </section>
  );
}

function MemoryCard({ memory: m }: { memory: Memory }) {
  const name = m.user.fullName ?? "Colega";

  if (m.type === "QUOTE") {
    return (
      <div className="bg-white rounded-xl p-5 shadow-sm border-l-4 border-edn-steel-lt">
        <blockquote className="font-display text-edn-navy text-base italic leading-relaxed mb-2">
          &ldquo;{m.content}&rdquo;
        </blockquote>
        <footer className="text-edn-gray text-xs font-body">— {name}</footer>
      </div>
    );
  }

  if (m.type === "STORY") {
    return (
      <div className="bg-white rounded-xl p-5 shadow-sm">
        {m.title && (
          <h3 className="font-display text-edn-navy font-semibold text-base mb-2">{m.title}</h3>
        )}
        <p className="font-body text-edn-navy/80 text-sm leading-relaxed whitespace-pre-line">
          {m.content}
        </p>
        <p className="text-edn-gray text-xs font-body mt-3">— {name}</p>
      </div>
    );
  }

  if (m.type === "PHOTO" && m.mediaUrl) {
    return (
      <div className="bg-white rounded-xl overflow-hidden shadow-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={m.mediaUrl} alt={m.title ?? "Memória"} className="w-full object-cover max-h-96" />
        {m.title && (
          <div className="p-3">
            <p className="font-body text-edn-navy text-sm">{m.title}</p>
            <p className="text-edn-gray text-xs font-body mt-0.5">— {name}</p>
          </div>
        )}
      </div>
    );
  }

  return null;
}
