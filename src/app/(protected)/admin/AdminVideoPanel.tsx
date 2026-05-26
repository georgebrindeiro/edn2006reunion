"use client";

import { useState, useEffect, useRef } from "react";
import { Loader2, AlertTriangle, CheckCircle2, RefreshCw, Play } from "lucide-react";
import { useUploadThing } from "@/lib/uploadthing-client";
import { detectVideoCodecFromUrl, codecNeedsTranscode, transcodeToH264 } from "@/lib/video-compat";

interface VideoEntry {
  id: string;
  mediaUrl: string;
  title: string | null;
  userName: string | null;
  createdAt: string;
  approved: boolean;
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

export function AdminVideoPanel() {
  const [videos,    setVideos]    = useState<VideoState[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [checking,  setChecking]  = useState(false);
  const { startUpload } = useUploadThing("memoryMedia");
  const abortRef = useRef(false);

  useEffect(() => {
    fetch("/api/admin/videos")
      .then((r) => r.json())
      .then((data: VideoEntry[]) => {
        setVideos(data.map((e) => ({
          entry:             e,
          compatStatus:      "idle",
          codec:             null,
          reprocessStatus:   "idle",
          reprocessProgress: 0,
          newUrl:            null,
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
      setVideos((prev) => prev.map((v, j) =>
        j === i ? { ...v, compatStatus: "checking" } : v
      ));
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
      // 1. Download the original file
      const resp = await fetch(v.entry.mediaUrl);
      if (!resp.ok) throw new Error("Download failed");
      const blob = await resp.blob();
      const originalFile = new File([blob], "original.mp4", { type: "video/mp4" });

      // 2. Transcode to H.264
      update({ reprocessStatus: "transcoding", reprocessProgress: 0 });
      const transcodedFile = await transcodeToH264(originalFile, (pct) =>
        update({ reprocessProgress: pct })
      );

      // 3. Upload to UploadThing
      update({ reprocessStatus: "uploading", reprocessProgress: 1 });
      const res = await startUpload([transcodedFile]);
      const newUrl = res?.[0]?.ufsUrl ?? (res?.[0] as any)?.url ?? null;
      if (!newUrl) throw new Error("Upload failed");

      // 4. Update the DB record
      await fetch(`/api/memories/${v.entry.id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ mediaUrl: newUrl }),
      });

      update({ reprocessStatus: "done", newUrl, compatStatus: "ok" });
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
    <div className="space-y-4">
      {/* Header + check button */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-sm font-body text-edn-gray">
            {videos.length} vídeo(s) no total
            {checkedCount > 0 && ` · ${checkedCount} verificados · ${incompatibleCount} incompatíveis`}
          </p>
          {incompatibleCount > 0 && (
            <p className="text-xs text-amber-600 font-body mt-0.5">
              ⚠️ Vídeos incompatíveis não tocam no Chrome — use "Reprocessar" para converter.
            </p>
          )}
        </div>
        <button
          onClick={checking ? () => { abortRef.current = true; setChecking(false); } : checkAll}
          className="flex items-center gap-1.5 text-xs font-body font-semibold px-3 py-1.5 rounded-lg border border-edn-mist hover:border-edn-steel transition-colors text-edn-navy"
        >
          {checking
            ? <><Loader2 size={12} className="animate-spin" /> Parar verificação</>
            : <><RefreshCw size={12} /> Verificar compatibilidade</>}
        </button>
      </div>

      {/* Video list */}
      <div className="space-y-2">
        {videos.map((v, idx) => (
          <div key={v.entry.id}
            className={`flex gap-3 rounded-xl p-3 border ${
              v.compatStatus === "incompatible" ? "border-amber-200 bg-amber-50"
              : v.compatStatus === "ok"         ? "border-green-100 bg-green-50/40"
              : "border-edn-mist bg-white"
            }`}>

            {/* Thumbnail */}
            <div className="relative flex-shrink-0 w-20 h-14 rounded-lg overflow-hidden bg-edn-cloud">
              <video src={v.newUrl ?? v.entry.mediaUrl} muted playsInline
                className="w-full h-full object-cover" />
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <Play size={14} className="text-white fill-white" />
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-body font-medium text-edn-navy truncate">
                {v.entry.title ?? "(sem legenda)"}
              </p>
              <p className="text-xs text-edn-gray font-body">
                {v.entry.userName ?? "—"} ·{" "}
                {new Date(v.entry.createdAt).toLocaleDateString("pt-BR")}
              </p>
              {v.codec && (
                <p className="text-[10px] font-mono text-edn-gray/60 mt-0.5">codec: {v.codec}</p>
              )}

              {/* Reprocess progress */}
              {(v.reprocessStatus === "downloading" || v.reprocessStatus === "transcoding" || v.reprocessStatus === "uploading") && (
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
                <p className="text-[10px] text-green-600 font-body mt-1">✅ Reprocessado com sucesso</p>
              )}
              {v.reprocessStatus === "error" && (
                <p className="text-[10px] text-red-500 font-body mt-1">❌ Erro — tente novamente</p>
              )}
            </div>

            {/* Status + action */}
            <div className="flex flex-col items-end gap-2 flex-shrink-0">
              {v.compatStatus === "checking" && (
                <Loader2 size={14} className="text-edn-gray animate-spin" />
              )}
              {v.compatStatus === "ok" && (
                <CheckCircle2 size={14} className="text-green-500" />
              )}
              {v.compatStatus === "incompatible" && (
                <AlertTriangle size={14} className="text-amber-500" />
              )}

              {v.compatStatus === "incompatible" && v.reprocessStatus === "idle" && (
                <button
                  onClick={() => reprocess(idx)}
                  className="text-xs font-body font-semibold px-2.5 py-1 rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-colors whitespace-nowrap"
                >
                  Reprocessar
                </button>
              )}
              {(v.reprocessStatus === "downloading" || v.reprocessStatus === "transcoding" || v.reprocessStatus === "uploading") && (
                <Loader2 size={14} className="text-amber-500 animate-spin" />
              )}
              {(v.reprocessStatus === "error") && v.compatStatus === "incompatible" && (
                <button
                  onClick={() => reprocess(idx)}
                  className="text-xs font-body px-2.5 py-1 rounded-lg border border-red-300 text-red-600 hover:border-red-400 transition-colors"
                >
                  Tentar novamente
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
