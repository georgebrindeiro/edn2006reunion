"use client";

import { useState } from "react";
import { Loader2, Plus, Image as ImageIcon, Quote, BookOpen, X } from "lucide-react";
import { useUploadThing } from "@/lib/uploadthing-client";

type MemoryType = "QUOTE" | "STORY" | "PHOTO";

interface Memory {
  id: string; type: MemoryType; title?: string;
  content?: string; mediaUrl?: string;
  user: { fullName?: string };
  createdAt: string;
}

const TABS: { key: MemoryType | "ALL"; label: string; icon: string }[] = [
  { key: "ALL",   label: "Todas",    icon: "✨" },
  { key: "PHOTO", label: "Fotos",    icon: "📷" },
  { key: "QUOTE", label: "Citações", icon: "💬" },
  { key: "STORY", label: "Histórias",icon: "📖" },
];

export function MemoriesClient({ initialMemories, userEmail }: {
  initialMemories: Memory[];
  userEmail: string;
}) {
  const [tab,      setTab]      = useState<"ALL" | MemoryType>("ALL");
  const [memories, setMemories] = useState<Memory[]>(initialMemories);
  const [showForm, setShowForm] = useState(false);
  const [type,     setType]     = useState<MemoryType>("QUOTE");
  const [title,    setTitle]    = useState("");
  const [content,  setContent]  = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  const { startUpload, isUploading } = useUploadThing("memoryMedia");

  const filtered = tab === "ALL" ? memories : memories.filter((m) => m.type === tab);

  async function handleMediaUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const res = await startUpload([file]);
    const url = res?.[0]?.ufsUrl ?? res?.[0]?.url;
    if (url) setMediaUrl(url);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (type === "PHOTO" && !mediaUrl) { setError("Selecione uma foto ou vídeo primeiro."); return; }
    setLoading(true);
    setError("");

    const res = await fetch("/api/memories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, title, content, mediaUrl: mediaUrl || null }),
    });

    if (res.ok) {
      const newMemory = await res.json();
      setMemories([newMemory, ...memories]);
      setShowForm(false);
      setTitle(""); setContent(""); setMediaUrl("");
    } else {
      setError("Erro ao salvar. Tente novamente.");
    }
    setLoading(false);
  }

  const TYPE_OPTIONS: { val: MemoryType; label: string; icon: typeof Quote }[] = [
    { val: "QUOTE", label: "Citação",       icon: Quote     },
    { val: "STORY", label: "História",      icon: BookOpen  },
    { val: "PHOTO", label: "Foto / Vídeo",  icon: ImageIcon },
  ];

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-edn-navy text-lg font-semibold">
          💬 Contribuições da turma
        </h2>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 bg-edn-navy text-white text-xs font-body font-semibold px-4 py-2 rounded-lg hover:bg-edn-navy-mid transition-colors">
          {showForm ? <X size={13} /> : <Plus size={13} />}
          {showForm ? "Cancelar" : "Contribuir"}
        </button>
      </div>

      {/* Contribution form */}
      {showForm && (
        <form onSubmit={handleSubmit}
          className="bg-white rounded-xl p-5 shadow-sm space-y-4 border-l-4 border-edn-navy animate-fade-up">
          <div className="grid grid-cols-3 gap-2">
            {TYPE_OPTIONS.map(({ val, label, icon: Icon }) => (
              <button key={val} type="button" onClick={() => setType(val)}
                className={`py-2.5 rounded-lg text-xs font-body font-medium border-2 transition-all flex flex-col items-center gap-1 ${
                  type === val ? "border-edn-navy bg-edn-navy text-white" : "border-edn-mist text-edn-navy hover:border-edn-steel"
                }`}>
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>

          {type === "STORY" && (
            <input value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="Título da história (opcional)"
              className="w-full border border-edn-mist rounded-lg px-3 py-2.5 text-sm font-body text-edn-navy focus:outline-none focus:border-edn-steel" />
          )}

          {type !== "PHOTO" && (
            <textarea value={content} onChange={(e) => setContent(e.target.value)}
              required rows={type === "STORY" ? 5 : 2}
              placeholder={type === "QUOTE"
                ? "Uma frase ou momento memorável da nossa época..."
                : "Conte uma história da EDN..."}
              className="w-full border border-edn-mist rounded-lg px-3 py-2.5 text-sm font-body text-edn-navy focus:outline-none focus:border-edn-steel resize-none" />
          )}

          {type === "PHOTO" && (
            <div>
              {mediaUrl ? (
                <div className="relative">
                  {mediaUrl.includes("video") || mediaUrl.endsWith(".mp4") || mediaUrl.endsWith(".webm") ? (
                    <video src={mediaUrl} controls className="w-full rounded-lg aspect-video bg-black max-h-64" />
                  ) : (
                    <img src={mediaUrl} alt="preview" className="w-full rounded-lg object-cover max-h-64" />
                  )}
                  <button type="button" onClick={() => setMediaUrl("")}
                    className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70">
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <label className={`flex flex-col items-center gap-3 p-8 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
                  isUploading ? "border-edn-steel bg-edn-cloud" : "border-edn-mist hover:border-edn-navy hover:bg-edn-cloud"
                }`}>
                  {isUploading ? (
                    <>
                      <Loader2 size={24} className="animate-spin text-edn-steel" />
                      <p className="text-edn-steel text-sm font-body">Enviando...</p>
                    </>
                  ) : (
                    <>
                      <ImageIcon size={24} className="text-edn-mist" />
                      <div className="text-center">
                        <p className="text-edn-navy text-sm font-body font-medium">Clique para selecionar</p>
                        <p className="text-edn-gray text-xs font-body mt-0.5">Foto (até 16 MB) ou Vídeo (até 256 MB)</p>
                      </div>
                    </>
                  )}
                  <input type="file" accept="image/*,video/*" className="hidden" onChange={handleMediaUpload} disabled={isUploading} />
                </label>
              )}
              <input value={title} onChange={(e) => setTitle(e.target.value)}
                placeholder="Legenda (opcional)" className="mt-2 w-full border border-edn-mist rounded-lg px-3 py-2.5 text-sm font-body text-edn-navy focus:outline-none focus:border-edn-steel" />
            </div>
          )}

          {error && <p className="text-red-500 text-xs font-body bg-red-50 rounded-lg px-3 py-2">{error}</p>}

          <button type="submit" disabled={loading || isUploading}
            className="w-full py-2.5 rounded-lg text-sm font-body font-semibold bg-edn-navy text-white hover:bg-edn-navy-mid transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
            {loading && <Loader2 size={14} className="animate-spin" />}
            {loading ? "Publicando..." : "Publicar"}
          </button>
        </form>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-xl p-1 shadow-sm overflow-x-auto">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 min-w-max py-2 px-3 rounded-lg text-xs font-body font-medium transition-all whitespace-nowrap ${
              tab === t.key ? "bg-edn-navy text-white" : "text-edn-gray hover:text-edn-navy"
            }`}>
            {t.icon} {t.label}
            {tab === t.key && <span className="ml-1 opacity-70">({filtered.length})</span>}
          </button>
        ))}
      </div>

      {/* Memory grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl shadow-sm">
          <p className="text-4xl mb-3">✨</p>
          <p className="text-edn-gray font-body text-sm">Nenhuma memória ainda nesta categoria.</p>
          <button onClick={() => setShowForm(true)}
            className="mt-3 text-edn-navy text-xs font-body font-semibold underline">
            Seja o primeiro a contribuir
          </button>
        </div>
      ) : (
        <div className="columns-1 sm:columns-2 gap-4 space-y-4">
          {filtered.map((m) => <MemoryCard key={m.id} memory={m} />)}
        </div>
      )}
    </section>
  );
}

function MemoryCard({ memory: m }: { memory: Memory }) {
  const name = m.user.fullName ?? "Colega";

  if (m.type === "QUOTE") return (
    <div className="break-inside-avoid bg-edn-navy rounded-xl p-5 mb-4">
      <blockquote className="font-display text-white text-base italic leading-relaxed mb-3">
        &ldquo;{m.content}&rdquo;
      </blockquote>
      <footer className="text-edn-mist/60 text-xs font-body">— {name}</footer>
    </div>
  );

  if (m.type === "STORY") return (
    <div className="break-inside-avoid bg-white rounded-xl p-5 shadow-sm mb-4 border-l-4 border-edn-mist">
      {m.title && <h3 className="font-display text-edn-navy font-semibold text-base mb-2">{m.title}</h3>}
      <p className="font-body text-edn-navy/80 text-sm leading-relaxed whitespace-pre-line line-clamp-6">{m.content}</p>
      <p className="text-edn-gray text-xs font-body mt-3">— {name}</p>
    </div>
  );

  if (m.type === "PHOTO" && m.mediaUrl) return (
    <div className="break-inside-avoid bg-white rounded-xl overflow-hidden shadow-sm mb-4">
      {m.mediaUrl.includes("video") || m.mediaUrl.endsWith(".mp4") || m.mediaUrl.endsWith(".webm") ? (
        <video src={m.mediaUrl} controls className="w-full object-cover" />
      ) : (
        <img src={m.mediaUrl} alt={m.title ?? "Memória"} className="w-full object-cover" />
      )}
      {(m.title || m.user.fullName) && (
        <div className="p-3">
          {m.title && <p className="font-body text-edn-navy text-sm">{m.title}</p>}
          <p className="text-edn-gray text-xs font-body mt-0.5">— {name}</p>
        </div>
      )}
    </div>
  );

  return null;
}
