"use client";

import { useState } from "react";
import {
  Loader2, Plus, Image as ImageIcon, Quote, BookOpen, X, Upload, Check,
} from "lucide-react";
import { useUploadThing } from "@/lib/uploadthing-client";
import { MEMORY_ERAS, type MemoryEra } from "@/lib/memory-eras";

type MemoryType = "QUOTE" | "STORY" | "PHOTO";

interface PendingPhoto {
  file: File;
  preview: string;
  url: string | null;
  era: MemoryEra | null;
  title: string;
}

const TYPE_OPTIONS: { val: MemoryType; label: string; icon: React.ElementType }[] = [
  { val: "PHOTO", label: "Fotos",     icon: ImageIcon },
  { val: "QUOTE", label: "Citação",   icon: Quote     },
  { val: "STORY", label: "História",  icon: BookOpen  },
];

export function ContributeForm({ onSuccess }: { onSuccess?: () => void }) {
  const [open,    setOpen]    = useState(false);
  const [type,    setType]    = useState<MemoryType>("PHOTO");
  const [title,   setTitle]   = useState("");
  const [content, setContent] = useState("");
  const [author,  setAuthor]  = useState("");
  const [era,     setEra]     = useState<MemoryEra | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [done,    setDone]    = useState(false);

  // Bulk photo state
  const [photos,    setPhotos]    = useState<PendingPhoto[]>([]);
  const [uploading, setUploading] = useState(false);

  const { startUpload } = useUploadThing("bulkPhotos");

  function resetForm() {
    setType("PHOTO"); setTitle(""); setContent(""); setAuthor(""); setEra(null);
    setPhotos([]); setError(""); setDone(false);
  }

  function handleClose() { setOpen(false); resetForm(); }

  function addFiles(files: FileList | null) {
    if (!files) return;
    const newPhotos: PendingPhoto[] = Array.from(files).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      url: null,
      era: null,
      title: "",
    }));
    setPhotos((prev) => [...prev, ...newPhotos]);
  }

  function removePhoto(idx: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
  }

  function setPhotoEra(idx: number, era: MemoryEra | null) {
    setPhotos((prev) => prev.map((p, i) => i === idx ? { ...p, era } : p));
  }

  function setPhotoTitle(idx: number, title: string) {
    setPhotos((prev) => prev.map((p, i) => i === idx ? { ...p, title } : p));
  }

  async function uploadPendingPhotos(): Promise<PendingPhoto[]> {
    const toUpload = photos.filter((p) => p.url === null);
    if (toUpload.length === 0) return photos;

    setUploading(true);
    const results = await startUpload(toUpload.map((p) => p.file));
    setUploading(false);

    let ri = 0;
    return photos.map((p) => {
      if (p.url !== null) return p;
      const url = results?.[ri]?.ufsUrl ?? results?.[ri]?.url ?? null;
      ri++;
      return { ...p, url };
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (type === "PHOTO") {
      if (photos.length === 0) { setError("Adicione pelo menos uma foto."); return; }
      setLoading(true);
      const uploaded = await uploadPendingPhotos();
      const items = uploaded
        .filter((p) => p.url)
        .map((p) => ({ mediaUrl: p.url!, era: p.era, title: p.title || null }));

      const res = await fetch("/api/memories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      setLoading(false);
      if (!res.ok) { setError("Erro ao publicar. Tente novamente."); return; }
    } else {
      if (!content.trim()) { setError("Conteúdo obrigatório."); return; }
      setLoading(true);
      const res = await fetch("/api/memories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, title: title || null, content, era: era || null, mediaUrl: null, author: author || null }),
      });
      setLoading(false);
      if (!res.ok) { setError("Erro ao publicar. Tente novamente."); return; }
    }

    setDone(true);
    onSuccess?.();
    setTimeout(() => { handleClose(); }, 1800);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 bg-edn-navy text-white font-body font-semibold text-sm px-5 py-3 rounded-xl hover:bg-edn-navy/90 transition-colors shadow-sm"
      >
        <Plus size={16} /> Contribuir com uma memória
      </button>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-md border border-edn-mist p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="font-display text-edn-navy font-semibold text-base">Nova contribuição</p>
        <button onClick={handleClose} className="text-edn-gray/50 hover:text-edn-gray">
          <X size={18} />
        </button>
      </div>

      {done ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <Check size={32} className="text-green-500" />
          <p className="font-body text-edn-navy font-semibold">Publicado! Obrigado.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type selector */}
          <div className="grid grid-cols-3 gap-2">
            {TYPE_OPTIONS.map(({ val, label, icon: Icon }) => (
              <button
                key={val} type="button" onClick={() => setType(val)}
                className={`py-2.5 rounded-xl text-xs font-body font-medium border-2 flex flex-col items-center gap-1 transition-all ${
                  type === val
                    ? "border-edn-navy bg-edn-navy text-white"
                    : "border-edn-mist text-edn-navy hover:border-edn-steel"
                }`}
              >
                <Icon size={14} />{label}
              </button>
            ))}
          </div>

          {/* Photo bulk upload */}
          {type === "PHOTO" && (
            <div className="space-y-3">
              {/* Drop zone */}
              <label className="flex flex-col items-center gap-2 p-6 rounded-xl border-2 border-dashed border-edn-mist hover:border-edn-navy hover:bg-edn-cloud/30 cursor-pointer transition-all">
                <Upload size={22} className="text-edn-steel" />
                <div className="text-center">
                  <p className="text-edn-navy text-sm font-body font-medium">Clique para adicionar fotos</p>
                  <p className="text-edn-gray text-xs font-body mt-0.5">Até 30 fotos · 16 MB cada</p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => addFiles(e.target.files)}
                />
              </label>

              {/* Photo grid with tagging */}
              {photos.length > 0 && (
                <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                  {photos.map((photo, idx) => (
                    <div key={idx} className="flex gap-3 bg-edn-cloud/30 rounded-xl p-2.5">
                      <img
                        src={photo.preview}
                        alt=""
                        className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0 space-y-2">
                        <input
                          value={photo.title}
                          onChange={(e) => setPhotoTitle(idx, e.target.value)}
                          placeholder="Legenda (opcional)"
                          className="w-full text-xs font-body border border-edn-mist rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-edn-steel"
                        />
                        <select
                          value={photo.era ?? ""}
                          onChange={(e) => setPhotoEra(idx, (e.target.value as MemoryEra) || null)}
                          className="w-full text-xs font-body border border-edn-mist rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:border-edn-steel"
                        >
                          <option value="">Era (opcional)</option>
                          {MEMORY_ERAS.map((era) => (
                            <option key={era.value} value={era.value}>
                              {era.emoji} {era.label} ({era.years})
                            </option>
                          ))}
                        </select>
                      </div>
                      <button
                        type="button"
                        onClick={() => removePhoto(idx)}
                        className="text-edn-gray/40 hover:text-red-400 self-start"
                      >
                        <X size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Quote/Story fields */}
          {type !== "PHOTO" && (
            <div className="space-y-3">
              {type === "STORY" && (
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Título da história (opcional)"
                  className="w-full border border-edn-mist rounded-lg px-3 py-2.5 text-sm font-body text-edn-navy focus:outline-none focus:border-edn-steel"
                />
              )}
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                rows={type === "STORY" ? 6 : 3}
                placeholder={
                  type === "QUOTE"
                    ? "Uma frase ou momento memorável da nossa época..."
                    : "Conte uma história da EDN..."
                }
                className="w-full border border-edn-mist rounded-lg px-3 py-2.5 text-sm font-body text-edn-navy focus:outline-none focus:border-edn-steel resize-none"
              />
              {type === "QUOTE" && (
                <input
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="Atribuir a... (ex: Prof. João, Fulano, Anônimo)"
                  className="w-full border border-edn-mist rounded-lg px-3 py-2.5 text-sm font-body text-edn-navy focus:outline-none focus:border-edn-steel"
                />
              )}
            </div>
          )}

          {error && (
            <p className="text-red-500 text-xs font-body bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || uploading}
            className="w-full py-2.5 rounded-xl text-sm font-body font-semibold bg-edn-navy text-white hover:bg-edn-navy/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {(loading || uploading) && <Loader2 size={14} className="animate-spin" />}
            {uploading ? "Enviando fotos..." : loading ? "Publicando..." : "Publicar"}
          </button>
        </form>
      )}
    </div>
  );
}
