"use client";

import { useState, useRef } from "react";
import {
  Loader2, Plus, Image as ImageIcon, Quote, BookOpen, X, Upload, Check,
  FolderOpen, AlertCircle,
} from "lucide-react";
import { useUploadThing } from "@/lib/uploadthing-client";
import { MEMORY_ERAS, type MemoryEra } from "@/lib/memory-eras";

type MemoryType = "QUOTE" | "STORY" | "PHOTO";

interface PendingPhoto {
  file: File;
  fileKey: string; // name+size dedup key
  preview: string;
  url: string | null;
  era: MemoryEra | null;
  title: string;
  uploadError: boolean;
}

const TYPE_OPTIONS: { val: MemoryType; label: string; icon: React.ElementType }[] = [
  { val: "PHOTO", label: "Fotos",     icon: ImageIcon },
  { val: "QUOTE", label: "Citação",   icon: Quote     },
  { val: "STORY", label: "História",  icon: BookOpen  },
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

  // Bulk photo state
  const [photos,         setPhotos]         = useState<PendingPhoto[]>([]);
  const [batchLabel,     setBatchLabel]     = useState("");
  const [uploadingIdx,   setUploadingIdx]   = useState<number | null>(null);
  const [uploadedCount,  setUploadedCount]  = useState(0);
  const seenKeys = useRef<Set<string>>(new Set());

  const { startUpload } = useUploadThing("memoryMedia");

  function resetForm() {
    setType("PHOTO"); setTitle(""); setContent(""); setAuthor(""); setEra(null);
    setPhotos([]); setBatchLabel(""); setUploadingIdx(null); setUploadedCount(0);
    setError(""); setDone(false);
    seenKeys.current = new Set();
  }

  function handleClose() { setOpen(false); resetForm(); }

  function addFiles(files: FileList | null, fromFolder?: string) {
    if (!files) return;
    const newPhotos: PendingPhoto[] = [];
    let detectedFolder = fromFolder ?? "";

    for (const file of Array.from(files)) {
      const k = fileKey(file);
      if (seenKeys.current.has(k)) continue; // deduplicate
      seenKeys.current.add(k);

      // Extract folder name from webkitRelativePath if available
      if (!detectedFolder && (file as any).webkitRelativePath) {
        const parts = ((file as any).webkitRelativePath as string).split("/");
        if (parts.length > 1) detectedFolder = parts[0];
      }

      newPhotos.push({
        file,
        fileKey: k,
        preview: URL.createObjectURL(file),
        url: null,
        era: null,
        title: detectedFolder,
        uploadError: false,
      });
    }

    if (detectedFolder && !batchLabel) setBatchLabel(detectedFolder);

    setPhotos((prev) => [...prev, ...newPhotos]);
  }

  function applyBatchLabel(label: string) {
    setBatchLabel(label);
    setPhotos((prev) => prev.map((p) => ({ ...p, title: label })));
  }

  function removePhoto(idx: number) {
    setPhotos((prev) => {
      const removed = prev[idx];
      seenKeys.current.delete(removed.fileKey);
      return prev.filter((_, i) => i !== idx);
    });
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

    const uploaded = [...photos];
    let done = 0;

    for (let i = 0; i < toUpload.length; i++) {
      const photo = toUpload[i];
      const uploadedIdx = uploaded.findIndex((p) => p.fileKey === photo.fileKey);
      setUploadingIdx(i);

      try {
        const res = await startUpload([photo.file]);
        const url = res?.[0]?.ufsUrl ?? res?.[0]?.url ?? null;
        if (url) {
          if (uploadedIdx !== -1) uploaded[uploadedIdx] = { ...uploaded[uploadedIdx], url, uploadError: false };
          done++;
          setUploadedCount(done);
        } else {
          if (uploadedIdx !== -1) uploaded[uploadedIdx] = { ...uploaded[uploadedIdx], uploadError: true };
        }
      } catch {
        if (uploadedIdx !== -1) uploaded[uploadedIdx] = { ...uploaded[uploadedIdx], uploadError: true };
      }
    }

    setUploadingIdx(null);
    const failed = uploaded.filter((p) => p.uploadError).length;
    if (failed > 0) setError(`${failed} foto(s) não foram enviadas. Clique em Publicar para tentar novamente.`);
    return uploaded;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (type === "PHOTO") {
      if (photos.length === 0) { setError("Adicione pelo menos uma foto."); return; }
      setLoading(true);
      setUploadedCount(0);
      const uploaded = await uploadPendingPhotos();
      const items = uploaded
        .filter((p) => p.url)
        .map((p) => ({ mediaUrl: p.url!, era: p.era, title: p.title || null }));

      if (items.length === 0) { setLoading(false); return; }

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

  const isUploading = uploadingIdx !== null;
  const totalToUpload = photos.filter((p) => p.url === null && !p.uploadError).length;
  const progressLabel = isUploading
    ? `Enviando ${uploadingIdx! + 1} de ${photos.filter((p) => p.url === null).length}…`
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
              {/* Drop zones row */}
              <div className="grid grid-cols-2 gap-2">
                <label className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-dashed border-edn-mist hover:border-edn-navy hover:bg-edn-cloud/30 cursor-pointer transition-all">
                  <Upload size={18} className="text-edn-steel" />
                  <div className="text-center">
                    <p className="text-edn-navy text-xs font-body font-medium">Selecionar fotos</p>
                    <p className="text-edn-gray text-[10px] font-body mt-0.5">Múltiplos arquivos</p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => addFiles(e.target.files)}
                  />
                </label>

                <label className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-dashed border-edn-mist hover:border-edn-navy hover:bg-edn-cloud/30 cursor-pointer transition-all">
                  <FolderOpen size={18} className="text-edn-steel" />
                  <div className="text-center">
                    <p className="text-edn-navy text-xs font-body font-medium">Selecionar pasta</p>
                    <p className="text-edn-gray text-[10px] font-body mt-0.5">Toda a pasta de uma vez</p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    // @ts-expect-error – non-standard but widely supported
                    webkitdirectory=""
                    mozdirectory=""
                    onChange={(e) => addFiles(e.target.files)}
                  />
                </label>
              </div>

              {/* Batch label */}
              {photos.length > 0 && (
                <div>
                  <label className="block text-xs font-body font-medium text-edn-gray uppercase tracking-wider mb-1">
                    Legenda para todas as fotos
                  </label>
                  <input
                    value={batchLabel}
                    onChange={(e) => applyBatchLabel(e.target.value)}
                    placeholder="Ex: Viagem de formatura 2009 (opcional)"
                    className="w-full text-sm font-body border border-edn-mist rounded-lg px-3 py-2 focus:outline-none focus:border-edn-steel"
                  />
                  <p className="text-[10px] text-edn-gray/60 font-body mt-0.5">
                    Preenche automaticamente a legenda de todas as fotos
                  </p>
                </div>
              )}

              {/* Progress bar */}
              {isUploading && totalToUpload > 0 && (
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-body text-edn-gray">
                    <span>{progressLabel}</span>
                    <span>{uploadedCount} / {photos.length} enviadas</span>
                  </div>
                  <div className="h-1.5 bg-edn-mist rounded-full overflow-hidden">
                    <div
                      className="h-full bg-edn-navy rounded-full transition-all duration-300"
                      style={{ width: `${Math.round((uploadedCount / photos.length) * 100)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Photo grid with tagging */}
              {photos.length > 0 && (
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <p className="text-xs font-body text-edn-gray">{photos.length} foto(s) selecionada(s)</p>
                    {photos.some((p) => p.uploadError) && (
                      <p className="text-xs font-body text-amber-600 flex items-center gap-1">
                        <AlertCircle size={11} />
                        {photos.filter((p) => p.uploadError).length} com erro
                      </p>
                    )}
                  </div>
                  <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                    {photos.map((photo, idx) => (
                      <div key={photo.fileKey}
                        className={`flex gap-3 rounded-xl p-2.5 ${photo.uploadError ? "bg-red-50" : photo.url ? "bg-green-50" : "bg-edn-cloud/30"}`}>
                        <div className="relative flex-shrink-0">
                          <img
                            src={photo.preview}
                            alt=""
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                          {photo.url && (
                            <div className="absolute inset-0 bg-green-500/20 rounded-lg flex items-center justify-center">
                              <Check size={14} className="text-green-600" />
                            </div>
                          )}
                          {photo.uploadError && (
                            <div className="absolute inset-0 bg-red-500/20 rounded-lg flex items-center justify-center">
                              <AlertCircle size={14} className="text-red-600" />
                            </div>
                          )}
                          {isUploading && uploadingIdx === photos.filter((p) => p.url === null && !p.uploadError).indexOf(photo) && (
                            <div className="absolute inset-0 bg-black/30 rounded-lg flex items-center justify-center">
                              <Loader2 size={14} className="animate-spin text-white" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 space-y-1.5">
                          <input
                            value={photo.title}
                            onChange={(e) => setPhotoTitle(idx, e.target.value)}
                            placeholder="Legenda (opcional)"
                            className="w-full text-xs font-body border border-edn-mist rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-edn-steel bg-white"
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
            disabled={loading || isUploading}
            className="w-full py-2.5 rounded-xl text-sm font-body font-semibold bg-edn-navy text-white hover:bg-edn-navy/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {(loading || isUploading) && <Loader2 size={14} className="animate-spin" />}
            {isUploading ? progressLabel : loading ? "Publicando..." : "Publicar"}
          </button>
        </form>
      )}
    </div>
  );
}
