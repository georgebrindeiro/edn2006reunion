"use client";

import { useState, useEffect, useRef } from "react";
import { Loader2, AlertTriangle, CheckCircle2, RefreshCw, Play, X, RefreshCcw, Copy, Check } from "lucide-react";
import { useUploadThing } from "@/lib/uploadthing-client";
import { detectVideoCodecFromUrl, codecNeedsTranscode, transcodeToH264 } from "@/lib/video-compat";

interface VideoEntry {
  id: string;
  mediaUrl: string;
  title: string | null;
  userName: string | null;
  createdAt: string;
  approved: boolean;
  fileName: string | null;
}

type CompatStatus = "idle" | "checking" | "ok" | "incompatible" | "error";
type ReprocessStatus = "idle" | "downloading" | "transcoding" | "uploading" | "done" | "error";

interface VideoState {
  entry: VideoEntry;
  compatStatus: CompatStatus;
  codec: string | null;
  reprocessStatus: ReprocessStatus;
  reprocessProgress: number;
  newUrl: string | null;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button onClick={copy} title="Copiar nome do arquivo"
      className="flex-shrink-0 text-edn-gray/50 hover:text-edn-navy transition-colors">
      {copied ? <Check size={11} className="text-green-500" /> : <Copy size={11} />}
    </button>
  );
}

export function AdminVideoPanel() {
  const [videos,   setVideos]   = useState<VideoState[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [checking, setChecking] = useState(false);
  const [preview,  setPreview]  = useState<VideoState | null>(null);
  const { startUpload } = useUploadThing("memoryMedia");
  const abortRef = useRef(false);

  useEffect(() => {
    fetch("/api/admin/videos")
      .then((r) => r.json())
      .then((data: VideoEntry[]) => {
        setVideos(data.map((e) => ({
          entry: e, compatStatus: "idle", codec: null,
          reprocessStatus: "idle", reprocessProgress: 0, newUrl: null,
        })));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function checkAll() {
    setChecking(true);
    abortRef.current = false;
    for (let i = 0; i < videos.length; i++) {
      if (abortRef.current) break;
      setVideos((prev) => prev.map((v, j) => j === i ? { ...v, compatStatus: "checking" } : v));
      const codec = await detectVideoCodecFromUrl(videos[i].entry.mediaUrl);
      const needs = codecNeedsTranscode(codec);
      setVideos((prev) => prev.map((v, j) =>
        j === i ? { ...v, compatStatus: needs ? "incompatible" : "ok", codec } : v
      ));
    }
    setChecking(false);
  }

  async function reprocess(idx: number) {
    const v = videos[idx];
    const update = (patch: Partial<VideoState>) =>
      setVideos((prev) => prev.map((x, i) => i === idx ? { ...x, ...patch } : x));

    update({ reprocessStatus: "downloading", reprocessProgress: 0 });
    try {
      const resp = await fetch(v.newUrl ?? v.entry.mediaUrl);
      if (!resp.ok) throw new Error("Download failed");
      const blob = await resp.blob();
      const originalFile = new File([blob], "original.mp4", { type: "video/mp4" });

      update({ reprocessStatus: "transcoding", reprocessProgress: 0 });
      const transcodedFile = await transcodeToH264(originalFile, (pct) =>
        update({ reprocessProgress: pct })
      );

      update({ reprocessStatus: "uploading", reprocessProgress: 1 });
      const res = await startUpload([transcodedFile]);
      const newUrl = res?.[0]?.ufsUrl ?? (res?.[0] as any)?.url ?? null;
      if (!newUrl) throw new Error("Upload failed");

      await fetch(`/api/memories/${v.entry.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mediaUrl: newUrl }),
      });

      update({ reprocessStatus: "done", newUrl, compatStatus: "ok" });
      // Update preview if currently open
      setPreview((p) => p?.entry.id === v.entry.id ? { ...p, newUrl, reprocessStatus: "done", compatStatus: "ok" } : p);
    } catch (err) {
      console.error(err);
      update({ reprocessStatus: "error" });
    }
  }

  const incompatibleCount = videos.filter((v) => v.compatStatus === "incompatible").length;
  const checkedCount      = videos.filter((v) => v.compatStatus !== "idle").length;

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-edn-gray text-sm font-body py-8">
        <Loader2 size={16} className="animate-spin" /> Carregando vídeos…
      </div>
    );
  }

  if (videos.length === 0) {
    return <p className="text-edn-gray text-sm font-body py-8 text-center">Nenhum vídeo encontrado.</p>;
  }

  return (
    <>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-sm font-body text-edn-gray">
              {videos.length} vídeo(s) · clique no thumbnail para testar
              {checkedCount > 0 && ` · ${checkedCount} verificados · ${incompatibleCount} incompatíveis`}
            </p>
          </div>
          <button
            onClick={checking ? () => { abortRef.current = true; setChecking(false); } : checkAll}
            className="flex items-center gap-1.5 text-xs font-body font-semibold px-3 py-1.5 rounded-lg border border-edn-mist hover:border-edn-steel transition-colors text-edn-navy"
          >
            {checking
              ? <><Loader2 size={12} className="animate-spin" /> Parar</>
              : <><RefreshCw size={12} /> Verificar codecs</>}
          </button>
        </div>

        {/* Video list */}
        <div className="space-y-2">
          {videos.map((v, idx) => {
            const busy = v.reprocessStatus === "downloading" || v.reprocessStatus === "transcoding" || v.reprocessStatus === "uploading";
            return (
              <div key={v.entry.id}
                className={`flex gap-3 rounded-xl p-3 border ${
                  v.compatStatus === "incompatible" ? "border-amber-200 bg-amber-50"
                  : v.reprocessStatus === "done"    ? "border-green-100 bg-green-50/40"
                  : "border-edn-mist bg-white"
                }`}>

                {/* Clickable thumbnail → preview modal */}
                <button
                  onClick={() => setPreview(v)}
                  className="relative flex-shrink-0 w-20 h-14 rounded-lg overflow-hidden bg-edn-cloud group"
                  title="Clique para testar"
                >
                  <video src={v.newUrl ?? v.entry.mediaUrl} muted playsInline
                    className="w-full h-full object-cover" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/50 transition-colors">
                    <Play size={18} className="text-white fill-white" />
                  </div>
                </button>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-body font-medium text-edn-navy truncate">
                    {v.entry.title ?? "(sem legenda)"}
                  </p>
                  <p className="text-xs text-edn-gray font-body">
                    {v.entry.userName ?? "—"} · {new Date(v.entry.createdAt).toLocaleDateString("pt-BR")}
                  </p>
                  {v.entry.fileName && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="text-[10px] font-mono text-edn-gray/70 truncate max-w-[180px]" title={v.entry.fileName}>
                        {v.entry.fileName}
                      </span>
                      <CopyButton text={v.entry.fileName} />
                    </div>
                  )}
                  {v.codec && (
                    <span className={`inline-block text-[10px] font-mono px-1.5 py-0.5 rounded mt-0.5 ${
                      v.compatStatus === "incompatible" ? "bg-amber-100 text-amber-700" : "bg-edn-cloud text-edn-gray/70"
                    }`}>
                      {v.codec}
                    </span>
                  )}

                  {/* Progress */}
                  {busy && (
                    <div className="mt-1.5 space-y-1">
                      <p className="text-[10px] text-amber-700 font-body">
                        {v.reprocessStatus === "downloading" ? "Baixando…"
                         : v.reprocessStatus === "uploading"  ? "Enviando…"
                         : `Convertendo… ${Math.round(v.reprocessProgress * 100)}%`}
                      </p>
                      {v.reprocessStatus === "transcoding" && (
                        <div className="h-1 bg-edn-mist rounded-full overflow-hidden w-40">
                          <div className="h-full bg-amber-500 rounded-full transition-all"
                            style={{ width: `${Math.round(v.reprocessProgress * 100)}%` }} />
                        </div>
                      )}
                    </div>
                  )}
                  {v.reprocessStatus === "done" && (
                    <p className="text-[10px] text-green-600 font-body mt-1">✅ Reprocessado</p>
                  )}
                  {v.reprocessStatus === "error" && (
                    <p className="text-[10px] text-red-500 font-body mt-1">❌ Erro na conversão</p>
                  )}
                </div>

                {/* Right side: compat badge + reprocess button (always visible) */}
                <div className="flex flex-col items-end justify-between flex-shrink-0 gap-2">
                  <div className="flex items-center gap-1.5">
                    {v.compatStatus === "checking"    && <Loader2 size={13} className="text-edn-gray animate-spin" />}
                    {v.compatStatus === "ok"          && <CheckCircle2 size={13} className="text-green-500" />}
                    {v.compatStatus === "incompatible" && <AlertTriangle size={13} className="text-amber-500" />}
                  </div>

                  {busy ? (
                    <Loader2 size={14} className="text-amber-500 animate-spin" />
                  ) : (
                    <button
                      onClick={() => reprocess(idx)}
                      title="Reprocessar para H.264"
                      className={`flex items-center gap-1 text-xs font-body font-medium px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap ${
                        v.compatStatus === "incompatible"
                          ? "bg-amber-500 text-white hover:bg-amber-600"
                          : v.reprocessStatus === "error"
                          ? "border border-red-300 text-red-600 hover:border-red-400"
                          : "border border-edn-mist text-edn-gray hover:border-edn-steel hover:text-edn-navy"
                      }`}
                    >
                      <RefreshCcw size={11} />
                      {v.reprocessStatus === "error" ? "Tentar novamente" : "Reprocessar"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Video preview modal */}
      {preview && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPreview(null)}
        >
          <div
            className="relative bg-black rounded-2xl overflow-hidden max-w-2xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPreview(null)}
              className="absolute top-3 right-3 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5"
            >
              <X size={16} />
            </button>

            <video
              src={preview.newUrl ?? preview.entry.mediaUrl}
              controls
              autoPlay
              className="w-full max-h-[70vh]"
            />

            <div className="p-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-white text-sm font-body font-medium">
                  {preview.entry.title ?? "(sem legenda)"}
                </p>
                <p className="text-white/50 text-xs font-body">
                  {preview.entry.userName} · {preview.codec ? `codec: ${preview.codec}` : "codec desconhecido"}
                  {preview.compatStatus === "incompatible" && " ⚠️ incompatível"}
                </p>
              </div>

              {/* Reprocess button inside preview */}
              {(() => {
                const idx = videos.findIndex((v) => v.entry.id === preview.entry.id);
                const v   = idx !== -1 ? videos[idx] : null;
                if (!v) return null;
                const busy = v.reprocessStatus === "downloading" || v.reprocessStatus === "transcoding" || v.reprocessStatus === "uploading";
                return busy ? (
                  <div className="flex items-center gap-2 text-amber-400 text-xs font-body">
                    <Loader2 size={13} className="animate-spin" />
                    {v.reprocessStatus === "downloading" ? "Baixando…"
                     : v.reprocessStatus === "uploading"  ? "Enviando…"
                     : `Convertendo… ${Math.round(v.reprocessProgress * 100)}%`}
                  </div>
                ) : v.reprocessStatus === "done" ? (
                  <span className="text-green-400 text-xs font-body">✅ Reprocessado</span>
                ) : (
                  <button
                    onClick={() => reprocess(idx)}
                    className="flex items-center gap-1.5 text-xs font-body font-semibold px-3 py-1.5 rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-colors"
                  >
                    <RefreshCcw size={12} /> Reprocessar
                  </button>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
