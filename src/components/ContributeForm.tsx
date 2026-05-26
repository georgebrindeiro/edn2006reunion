"use client";

import { useState, useRef } from "react";
import {
  Loader2, Plus, Image as ImageIcon, Quote, BookOpen, X, Upload, Check,
  FolderOpen, AlertCircle, Play,
} from "lucide-react";
import { useUploadThing } from "@/lib/uploadthing-client";
import { MEMORY_ERAS, type MemoryEra } from "@/lib/memory-eras";

type MemoryType = "QUOTE" | "STORY" | "PHOTO";

interface PendingMedia {
  file: File;
  fileKey: string;
  preview: string;
  isVideo: boolean;
  url: string | null;
  era: MemoryEra | null;
  useGlobalEra: boolean; // follows batchEra when true
  title: string;
  useGlobalTitle: boolean; // follows batchLabel when true
  uploadError: boolean;
}

const TYPE_OPTIONS: { val: MemoryType; label: string; icon: React.ElementType }[] = [
  { val: "PHOTO", label: "Fotos/Vídeos", icon: ImageIcon },
  { val: "QUOTE", label: "Citação",      icon: Quote     },
  { val: "STORY", label: "História",     icon: BookOpen  },
];

function fileKey(file: File) {
  return `${file.name}__${file.size}`;
}

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

  // Bulk media state
  const [items,          setItems]          = useState<PendingMedia[]>([]);
  const [batchLabel,     setBatchLabel]     = useState("");
  const [batchEra,       setBatchEra]       = useState<MemoryEra | "">("");
  const [uploadingIdx,   setUploadingIdx]   = useState<number | null>(null);
  const [uploadedCount,  setUploadedCount]  = useState(0);
  const seenKeys = useRef<Set<string>>(new Set());

  const { startUpload } = useUploadThing("memoryMedia");

  function resetForm() {
    setType("PHOTO"); setTitle(""); setContent(""); setAuthor(""); setEra(null);
    setItems([]); setBatchLabel(""); setBatchEra(""); setUploadingIdx(null);
    setUploadedCount(0); setError(""); setDone(false);
    seenKeys.current = new Set();
  }

  function handleClose() { setOpen(false); resetForm(); }

  function addFiles(files: FileList | null) {
    if (!files) return;
    const newItems: PendingMedia[] = [];
    let detectedFolder = "";

    for (const file of Array.from(files)) {
      const isVideo = file.type.startsWith("video/");
      const isImage = file.type.startsWith("image/");
      if (!isVideo && !isImage) continue; // skip non-media

      const k = fileKey(file);
      if (seenKeys.current.has(k)) continue;
      seenKeys.current.add(k);

      if (!detectedFolder && (file as any).webkitRelativePath) {
        const parts = ((file as any).webkitRelativePath as string).split("/");
        if (parts.length > 1) detectedFolder = parts[0];
      }

      newItems.push({
        file,
        fileKey: k,
        preview: URL.createObjectURL(file),
        isVideo,
        url: null,
        era: (batchEra as MemoryEra) || null,
        useGlobalEra: true,
        title: batchLabel || detectedFolder,
        useGlobalTitle: true,
        uploadError: false,
      });
    }

    if (detectedFolder && !batchLabel) {
      setBatchLabel(detectedFolder);
      // retroactively set title on items that still follow global
      newItems.forEach((it) => { if (it.useGlobalTitle) it.title = detectedFolder; });
    }

    setItems((prev) => [...prev, ...newItems]);
  }

  function applyBatchLabel(label: string) {
    setBatchLabel(label);
    setItems((prev) => prev.map((p) => p.useGlobalTitle ? { ...p, title: label } : p));
  }

  function applyBatchEra(e: MemoryEra | "") {
    setBatchEra(e);
    setItems((prev) => prev.map((p) => p.useGlobalEra ? { ...p, era: (e as MemoryEra) || null } : p));
  }

  function removeItem(idx: number) {
    setItems((prev) => {
      const removed = prev[idx];
      seenKeys.current.delete(removed.fileKey);
      return prev.filter((_, i) => i !== idx);
    });
  }

  function setItemEra(idx: number, e: MemoryEra | null) {
    setItems((prev) => prev.map((p, i) => i === idx ? { ...p, era: e, useGlobalEra: false } : p));
  }

  function resetItemEra(idx: number) {
    setItems((prev) => prev.map((p, i) =>
      i === idx ? { ...p, era: (batchEra as MemoryEra) || null, useGlobalEra: true } : p
    ));
  }

  function setItemTitle(idx: number, t: string) {
    setItems((prev) => prev.map((p, i) => i === idx ? { ...p, title: t, useGlobalTitle: false } : p));
  }

  function resetItemTitle(idx: number) {
    setItems((prev) => prev.map((p, i) =>
      i === idx ? { ...p, title: batchLabel, useGlobalTitle: true } : p
    ));
  }

  async function uploadPendingMedia(): Promise<PendingMedia[]> {
    const toUpload = items.filter((p) => p.url === null && !p.uploadError);
    if (toUpload.length === 0) return items;

    const uploaded = [...items];
    let done = 0;

    for (let i = 0; i < toUpload.length; i++) {
      const item = toUpload[i];
      const idx  = uploaded.findIndex((p) => p.fileKey === item.fileKey);
      setUploadingIdx(i);

      try {
        const res = await startUpload([item.file]);
        const url = res?.[0]?.ufsUrl ?? res?.[0]?.url ?? null;
        if (url) {
          if (idx !== -1) uploaded[idx] = { ...uploaded[idx], url, uploadError: false };
          done++;
          setUploadedCount(done);
        } else {
          if (idx !== -1) uploaded[idx] = { ...uploaded[idx], uploadError: true };
        }
      } catch {
        if (idx !== -1) uploaded[idx] = { ...uploaded[idx], uploadError: true };
      }
    }

    setUploadingIdx(null);
    const failed = uploaded.filter((p) => p.uploadError).length;
    if (failed > 0) setError(`${failed} arquivo(s) com erro. Clique em Publicar para tentar novamente.`);
    return uploaded;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (type === "PHOTO") {
      if (items.length === 0) { setError("Adicione pelo menos uma foto ou vídeo."); return; }
      setLoading(true);
      setUploadedCount(0);
      const uploaded = await uploadPendingMedia();
      const apiItems = uploaded
        .filter((p) => p.url)
        .map((p) => ({
          mediaUrl: p.url!,
          type:     p.isVideo ? "VIDEO" : "PHOTO",
          era:      p.era,
          title:    p.title || null,
        }));

      if (apiItems.length === 0) { setLoading(false); return; }

      const res = await fetch("/api/memories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: apiItems }),
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

  const isUploading   = uploadingIdx !== null;
  const toUploadCount = items.filter((p) => p.url === null && !p.uploadError).length;
  const progressLabel = isUploading
    ? `Enviando ${uploadingIdx! + 1} de ${items.filter((p) => p.url === null).length}…`
    : "";

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
      <div className="flex items-center justify-between">
        <p className="font-display text-edn-navy font-semibold text-base">Nova contribuição</p>
        <button onClick={handleClose} className="text-edn-gray/50 hover:text-edn-gray"><X size={18} /></button>
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
              <button key={val} type="button" onClick={() => setType(val)}
                className={`py-2.5 rounded-xl text-xs font-body font-medium border-2 flex flex-col items-center gap-1 transition-all ${
                  type === val ? "border-edn-navy bg-edn-navy text-white" : "border-edn-mist text-edn-navy hover:border-edn-steel"
                }`}>
                <Icon size={14} />{label}
              </button>
            ))}
          </div>

          {/* Media bulk upload */}
          {type === "PHOTO" && (
            <div className="space-y-3">
              {/* Drop zones */}
              <div className="grid grid-cols-2 gap-2">
                <label className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-dashed border-edn-mist hover:border-edn-navy hover:bg-edn-cloud/30 cursor-pointer transition-all">
                  <Upload size={18} className="text-edn-steel" />
                  <div className="text-center">
                    <p className="text-edn-navy text-xs font-body font-medium">Selecionar arquivos</p>
                    <p className="text-edn-gray text-[10px] font-body mt-0.5">Fotos e vídeos</p>
                  </div>
                  <input type="file" accept="image/*,video/*" multiple className="hidden"
                    onChange={(e) => addFiles(e.target.files)} />
                </label>

                <label className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-dashed border-edn-mist hover:border-edn-navy hover:bg-edn-cloud/30 cursor-pointer transition-all">
                  <FolderOpen size={18} className="text-edn-steel" />
                  <div className="text-center">
                    <p className="text-edn-navy text-xs font-body font-medium">Selecionar pasta</p>
                    <p className="text-edn-gray text-[10px] font-body mt-0.5">Toda a pasta de uma vez</p>
                  </div>
                  <input type="file" accept="image/*,video/*" multiple className="hidden"
                    // @ts-expect-error – non-standard but widely supported
                    webkitdirectory="" mozdirectory=""
                    onChange={(e) => addFiles(e.target.files)} />
                </label>
              </div>

              {/* Batch label + era */}
              {items.length > 0 && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-body font-medium text-edn-gray uppercase tracking-wider mb-1">
                      Legenda (todas)
                    </label>
                    <input
                      value={batchLabel}
                      onChange={(e) => applyBatchLabel(e.target.value)}
                      placeholder="Ex: Viagem de formatura 2009"
                      className="w-full text-xs font-body border border-edn-mist rounded-lg px-2.5 py-2 focus:outline-none focus:border-edn-steel"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-body font-medium text-edn-gray uppercase tracking-wider mb-1">
                      Era (todas)
                    </label>
                    <select value={batchEra} onChange={(e) => applyBatchEra(e.target.value as MemoryEra | "")}
                      className="w-full text-xs font-body border border-edn-mist rounded-lg px-2 py-2 bg-white focus:outline-none focus:border-edn-steel">
                      <option value="">Sem era</option>
                      {MEMORY_ERAS.map((era) => (
                        <option key={era.value} value={era.value}>{era.emoji} {era.label} ({era.years})</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Progress */}
              {isUploading && toUploadCount > 0 && (
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-body text-edn-gray">
                    <span>{progressLabel}</span>
                    <span>{uploadedCount} / {items.length}</span>
                  </div>
                  <div className="h-1.5 bg-edn-mist rounded-full overflow-hidden">
                    <div className="h-full bg-edn-navy rounded-full transition-all duration-300"
                      style={{ width: `${Math.round((uploadedCount / items.length) * 100)}%` }} />
                  </div>
                </div>
              )}

              {/* Item list */}
              {items.length > 0 && (
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <p className="text-xs font-body text-edn-gray">
                      {items.length} arquivo(s) · {items.filter((p) => p.isVideo).length} vídeo(s)
                    </p>
                    {items.some((p) => p.uploadError) && (
                      <p className="text-xs font-body text-amber-600 flex items-center gap-1">
                        <AlertCircle size={11} />
                        {items.filter((p) => p.uploadError).length} com erro
                      </p>
                    )}
                  </div>
                  <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                    {items.map((item, idx) => (
                      <div key={item.fileKey}
                        className={`flex gap-3 rounded-xl p-2.5 ${item.uploadError ? "bg-red-50" : item.url ? "bg-green-50" : "bg-edn-cloud/30"}`}>
                        {/* Thumbnail */}
                        <div className="relative flex-shrink-0 w-16 h-16">
                          {item.isVideo ? (
                            <>
                              <video src={item.preview} muted playsInline
                                className="w-16 h-16 object-cover rounded-lg" />
                              <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/30">
                                <Play size={14} className="text-white fill-white" />
                              </div>
                            </>
                          ) : (
                            <img src={item.preview} alt="" className="w-16 h-16 object-cover rounded-lg" />
                          )}
                          {item.url && (
                            <div className="absolute inset-0 bg-green-500/20 rounded-lg flex items-center justify-center">
                              <Check size={14} className="text-green-600" />
                            </div>
                          )}
                          {item.uploadError && (
                            <div className="absolute inset-0 bg-red-500/20 rounded-lg flex items-center justify-center">
                              <AlertCircle size={14} className="text-red-600" />
                            </div>
                          )}
                        </div>

                        {/* Fields */}
                        <div className="flex-1 min-w-0 space-y-1.5">
                          <div className="flex items-center gap-1">
                            <input
                              value={item.title}
                              onChange={(e) => setItemTitle(idx, e.target.value)}
                              placeholder="Legenda (opcional)"
                              className={`flex-1 min-w-0 text-xs font-body border rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-edn-steel bg-white ${
                                item.useGlobalTitle ? "border-edn-navy/30" : "border-edn-mist"
                              }`}
                            />
                            {!item.useGlobalTitle && batchLabel && (
                              <button type="button" onClick={() => resetItemTitle(idx)}
                                className="text-[10px] text-edn-steel hover:text-edn-navy font-body whitespace-nowrap flex-shrink-0">
                                ↺ global
                              </button>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <select
                              value={item.era ?? ""}
                              onChange={(e) => setItemEra(idx, (e.target.value as MemoryEra) || null)}
                              className={`flex-1 min-w-0 text-xs font-body border rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:border-edn-steel ${
                                item.useGlobalEra ? "border-edn-navy/30" : "border-edn-mist"
                              }`}
                            >
                              <option value="">Sem era</option>
                              {MEMORY_ERAS.map((era) => (
                                <option key={era.value} value={era.value}>{era.emoji} {era.label}</option>
                              ))}
                            </select>
                            {!item.useGlobalEra && batchEra && (
                              <button type="button" onClick={() => resetItemEra(idx)}
                                className="text-[10px] text-edn-steel hover:text-edn-navy font-body whitespace-nowrap flex-shrink-0">
                                ↺ global
                              </button>
                            )}
                          </div>
                        </div>

                        <button type="button" onClick={() => removeItem(idx)}
                          className="text-edn-gray/40 hover:text-red-400 self-start flex-shrink-0">
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Quote/Story fields */}
          {type !== "PHOTO" && (
            <div className="space-y-3">
              {type === "STORY" && (
                <input value={title} onChange={(e) => setTitle(e.target.value)}
                  placeholder="Título da história (opcional)"
                  className="w-full border border-edn-mist rounded-lg px-3 py-2.5 text-sm font-body text-edn-navy focus:outline-none focus:border-edn-steel" />
              )}
              <textarea value={content} onChange={(e) => setContent(e.target.value)} required
                rows={type === "STORY" ? 6 : 3}
                placeholder={type === "QUOTE" ? "Uma frase ou momento memorável da nossa época..." : "Conte uma história da EDN..."}
                className="w-full border border-edn-mist rounded-lg px-3 py-2.5 text-sm font-body text-edn-navy focus:outline-none focus:border-edn-steel resize-none" />
              {type === "QUOTE" && (
                <input value={author} onChange={(e) => setAuthor(e.target.value)}
                  placeholder="Atribuir a... (ex: Prof. João, Fulano, Anônimo)"
                  className="w-full border border-edn-mist rounded-lg px-3 py-2.5 text-sm font-body text-edn-navy focus:outline-none focus:border-edn-steel" />
              )}
            </div>
          )}

          {error && (
            <p className="text-red-500 text-xs font-body bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          <button type="submit" disabled={loading || isUploading}
            className="w-full py-2.5 rounded-xl text-sm font-body font-semibold bg-edn-navy text-white hover:bg-edn-navy/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
            {(loading || isUploading) && <Loader2 size={14} className="animate-spin" />}
            {isUploading ? progressLabel : loading ? "Publicando..." : "Publicar"}
          </button>
        </form>
      )}
    </div>
  );
}
