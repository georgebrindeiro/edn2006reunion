"use client";

import { useState, useRef, useEffect } from "react";
import { Loader2, Video, Upload, Square, Circle, CheckCircle2, AlertCircle } from "lucide-react";
import { useUploadThing } from "@/lib/uploadthing-client";

interface VideoMessage {
  id: string; videoUrl: string;
  user: { fullName?: string; photoNow?: string };
  createdAt: string;
}

const MAX_SECONDS = 120;

const MIME_MAP: Record<string, string> = {
  mp4: "video/mp4", m4v: "video/mp4", mov: "video/quicktime",
  webm: "video/webm", avi: "video/x-msvideo", mkv: "video/x-matroska",
  "3gp": "video/3gpp", ogv: "video/ogg",
};
function inferVideoMime(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  return MIME_MAP[ext] ?? "video/mp4";
}

export function VideoMessagesClient({ initialMessages, hasExistingMessage }: {
  initialMessages: VideoMessage[];
  hasExistingMessage: boolean;
}) {
  const [messages,      setMessages]      = useState<VideoMessage[]>(initialMessages);
  const [mode,          setMode]          = useState<"idle" | "record" | "preview">("idle");
  const [recording,     setRecording]     = useState(false);
  const [seconds,       setSeconds]       = useState(0);
  const [videoBlob,     setVideoBlob]     = useState<Blob | null>(null);
  const [videoUrl,      setVideoUrl]      = useState<string | null>(null);
  const [error,         setError]         = useState("");
  const [submitted,     setSubmitted]     = useState(hasExistingMessage);
  const [uploadProgress,setUploadProgress]= useState(0);
  const [uploadPhase,   setUploadPhase]   = useState<"idle" | "uploading" | "saving">("idle");
  // Diagnostic info shown in preview so we can see exactly what file was picked
  const [fileInfo,      setFileInfo]      = useState<{ name: string; sizeMB: string; type: string } | null>(null);

  const livePreviewRef    = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef  = useRef<MediaRecorder | null>(null);
  const chunksRef         = useRef<Blob[]>([]);
  const timerRef          = useRef<NodeJS.Timeout | null>(null);
  const streamRef         = useRef<MediaStream | null>(null);
  // Tracks whether onUploadError already set a specific error so we don't
  // overwrite it with the generic "no URL" fallback message.
  const uploadErrorRef    = useRef(false);

  const { startUpload, isUploading } = useUploadThing("videoMessage", {
    onUploadProgress: (p) => setUploadProgress(p),
    onUploadError: (err) => {
      uploadErrorRef.current = true;
      setError(`Falha no upload: ${err.message}`);
      setUploadPhase("idle");
    },
  });

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  async function startRecording() {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (livePreviewRef.current) { livePreviewRef.current.srcObject = stream; livePreviewRef.current.play(); }

      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
        ? "video/webm;codecs=vp9,opus"
        : "video/webm";
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        setVideoBlob(blob);
        setVideoUrl(URL.createObjectURL(blob));
        setFileInfo(null);
        setMode("preview");
        streamRef.current?.getTracks().forEach((t) => t.stop());
      };

      recorder.start(100);
      setRecording(true);
      setSeconds(0);
      setMode("record");

      timerRef.current = setInterval(() => {
        setSeconds((s) => {
          if (s + 1 >= MAX_SECONDS) { stopRecording(); return MAX_SECONDS; }
          return s + 1;
        });
      }, 1000);
    } catch {
      setError("Não foi possível acessar a câmera. Verifique as permissões do navegador.");
    }
  }

  function stopRecording() {
    if (timerRef.current) clearInterval(timerRef.current);
    mediaRecorderRef.current?.stop();
    setRecording(false);
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    // Reset input so the same file can be re-selected after an error
    e.target.value = "";

    if (!file) return;

    // Android Chrome gallery files often have type="" or "application/octet-stream".
    // The accept="video/*" on the input already filters at OS level, so trust it.
    const isVideo = file.type.startsWith("video/")
      || file.type === ""
      || file.type === "application/octet-stream"
      || /\.(mp4|mov|webm|avi|mkv|m4v|3gp|ogv)$/i.test(file.name);
    if (!isVideo) {
      setError(`Arquivo inválido (tipo: "${file.type || "desconhecido"}"). Selecione um vídeo MP4, MOV ou WebM.`);
      return;
    }

    if (file.size === 0) {
      setError(
        "O arquivo parece estar vazio. No Android, abra o vídeo no app Arquivos (não no Google Fotos) e tente novamente, ou baixe o vídeo localmente antes de enviar."
      );
      return;
    }

    if (file.size > 1024 * 1024 * 1024) {
      setError(`Arquivo muito grande (${(file.size / (1024 * 1024)).toFixed(0)} MB). O limite é 1 GB.`);
      return;
    }

    setError("");
    setFileInfo({
      name:   file.name,
      sizeMB: (file.size / (1024 * 1024)).toFixed(1),
      type:   file.type || "(sem tipo — será inferido da extensão)",
    });
    setVideoBlob(file);
    setVideoUrl(URL.createObjectURL(file));
    setMode("preview");
  }

  async function handleSubmit() {
    if (!videoBlob) return;
    setError("");
    uploadErrorRef.current = false;
    setUploadProgress(0);
    setUploadPhase("uploading");

    // Build the File to upload. For gallery files that already have a type,
    // pass them directly — avoids any wrapping overhead for large files.
    let file: File;
    if (videoBlob instanceof File) {
      const f = videoBlob as File;
      file = f.type ? f : new File([f], f.name, { type: inferVideoMime(f.name) });
    } else {
      file = new File([videoBlob], "message.webm", { type: "video/webm" });
    }

    // Guard against cloud-backed Android files that materialised as 0 bytes
    if (file.size === 0) {
      setError(
        "Não foi possível ler o arquivo. No Android, use o app Arquivos para selecionar o vídeo ou baixe-o localmente antes de enviar."
      );
      setUploadPhase("idle");
      return;
    }

    let res;
    try {
      res = await startUpload([file]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido";
      setError(`Falha no upload: ${msg}`);
      setUploadPhase("idle");
      return;
    }

    const videoUrl = res?.[0]?.ufsUrl ?? res?.[0]?.url;
    if (!videoUrl) {
      // If onUploadError already set a specific message, don't overwrite it.
      if (!uploadErrorRef.current) {
        console.error("[VideoUpload] startUpload returned without URL:", res);
        setError("O upload não foi concluído. Verifique sua conexão e tente novamente.");
        setUploadPhase("idle");
      }
      return;
    }

    setUploadPhase("saving");
    const apiRes = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoUrl }),
    });

    if (apiRes.ok) {
      const newMsg = await apiRes.json();
      setMessages([newMsg, ...messages]);
      setSubmitted(true);
      setMode("idle");
      setVideoBlob(null);
      setVideoUrl(null);
      setFileInfo(null);
      setUploadPhase("idle");
    } else {
      const body = await apiRes.json().catch(() => ({}));
      setError(body.error ?? "Erro ao salvar mensagem.");
      setUploadPhase("idle");
    }
  }

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  const recordProgress = (seconds / MAX_SECONDS) * 100;

  return (
    <div className="space-y-8">

      {/* Record / Upload panel */}
      {!submitted ? (
        <div className="bg-white rounded-2xl p-6 shadow-sm space-y-5">
          <h2 className="font-display text-edn-navy text-lg font-semibold">Deixe sua mensagem</h2>

          {/* Error — always visible regardless of mode */}
          {error && (
            <div className="flex items-start gap-2 bg-red-50 rounded-lg px-3 py-2.5">
              <AlertCircle size={14} className="text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-red-600 text-xs font-body">{error}</p>
            </div>
          )}

          {mode === "idle" && (
            <div className="grid grid-cols-2 gap-4">
              <button onClick={startRecording}
                className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-dashed border-edn-mist hover:border-edn-navy hover:bg-edn-cloud transition-all">
                <Video size={28} className="text-edn-navy" />
                <div className="text-center">
                  <p className="font-body font-semibold text-edn-navy text-sm">Gravar agora</p>
                  <p className="text-edn-gray text-xs font-body mt-0.5">Até 2 minutos</p>
                </div>
              </button>
              <label className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-dashed border-edn-mist hover:border-edn-navy hover:bg-edn-cloud transition-all cursor-pointer">
                <Upload size={28} className="text-edn-navy" />
                <div className="text-center">
                  <p className="font-body font-semibold text-edn-navy text-sm">Enviar arquivo</p>
                  <p className="text-edn-gray text-xs font-body mt-0.5">MP4, MOV, WebM · máx 1 GB</p>
                </div>
                <input type="file" accept="video/*" className="hidden" onChange={handleFileUpload} />
              </label>
            </div>
          )}

          {mode === "record" && (
            <div className="space-y-4">
              <div className="bg-black rounded-xl overflow-hidden aspect-video relative">
                <video ref={livePreviewRef} muted playsInline className="w-full h-full object-cover" />
                {recording && (
                  <div className="absolute top-3 right-3 flex items-center gap-2 bg-black/60 rounded-full px-3 py-1">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-white text-xs font-body">{fmt(seconds)} / {fmt(MAX_SECONDS)}</span>
                  </div>
                )}
              </div>
              {recording && (
                <div className="h-1.5 bg-edn-cloud rounded-full overflow-hidden">
                  <div className="h-full bg-red-500 transition-all duration-1000 rounded-full"
                    style={{ width: `${recordProgress}%` }} />
                </div>
              )}
              <div className="flex gap-3">
                {!recording ? (
                  <button onClick={startRecording}
                    className="flex-1 flex items-center justify-center gap-2 bg-red-500 text-white py-3 rounded-xl text-sm font-body font-semibold hover:bg-red-600 transition-colors">
                    <Circle size={16} /> Iniciar gravação
                  </button>
                ) : (
                  <button onClick={stopRecording}
                    className="flex-1 flex items-center justify-center gap-2 bg-edn-navy text-white py-3 rounded-xl text-sm font-body font-semibold hover:bg-edn-navy-mid transition-colors">
                    <Square size={16} /> Parar e revisar
                  </button>
                )}
                <button onClick={() => { setMode("idle"); streamRef.current?.getTracks().forEach((t) => t.stop()); setRecording(false); if (timerRef.current) clearInterval(timerRef.current); }}
                  className="px-5 py-3 rounded-xl border border-edn-mist text-edn-gray text-sm font-body hover:bg-edn-cloud transition-colors">
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {mode === "preview" && videoUrl && (
            <div className="space-y-4">
              <video src={videoUrl} controls className="w-full block rounded-xl" />

              {/* File diagnostic row */}
              {fileInfo && (
                <p className="text-edn-gray text-[11px] font-body">
                  {fileInfo.name} · {fileInfo.sizeMB} MB · <span className="text-edn-steel">{fileInfo.type}</span>
                </p>
              )}

              {/* Upload progress */}
              {uploadPhase === "uploading" && (
                <div className="bg-edn-cloud rounded-lg px-4 py-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-edn-steel text-sm font-body">
                      <Loader2 size={14} className="animate-spin flex-shrink-0" />
                      <span>{uploadProgress < 100 ? "Enviando vídeo..." : "Processando..."}</span>
                    </div>
                    <span className="text-edn-navy text-sm font-body font-semibold">{uploadProgress}%</span>
                  </div>
                  <div className="h-2 bg-white rounded-full overflow-hidden">
                    <div className="h-full bg-edn-navy rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }} />
                  </div>
                  <p className="text-edn-gray text-[11px] font-body">
                    Mantenha esta tela aberta até o envio terminar.
                  </p>
                </div>
              )}

              {uploadPhase === "saving" && (
                <div className="flex items-center gap-2 text-edn-steel text-sm font-body bg-edn-cloud rounded-lg px-4 py-3">
                  <Loader2 size={14} className="animate-spin" />
                  Salvando mensagem...
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={handleSubmit} disabled={isUploading}
                  className="flex-1 flex items-center justify-center gap-2 bg-edn-navy text-white py-3 rounded-xl text-sm font-body font-semibold hover:bg-edn-navy-mid transition-colors disabled:opacity-60">
                  {isUploading && <Loader2 size={14} className="animate-spin" />}
                  {isUploading ? "Enviando..." : "Enviar mensagem"}
                </button>
                <button onClick={() => { setMode("idle"); setVideoBlob(null); setVideoUrl(null); setFileInfo(null); setUploadPhase("idle"); }}
                  disabled={isUploading}
                  className="px-5 py-3 rounded-xl border border-edn-mist text-edn-gray text-sm font-body hover:bg-edn-cloud transition-colors disabled:opacity-40">
                  Regravar
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-green-50 rounded-2xl p-5 flex items-center gap-3">
          <CheckCircle2 size={20} className="text-green-600 shrink-0" />
          <div>
            <p className="text-green-700 font-body font-semibold text-sm">Mensagem enviada!</p>
            <p className="text-green-600 text-xs font-body mt-0.5">Ela aparecerá abaixo assim que aprovada.</p>
          </div>
        </div>
      )}

      {/* Messages gallery */}
      <div className="space-y-4">
        <h2 className="font-display text-edn-navy text-lg font-semibold">
          Mensagens da turma ({messages.length})
        </h2>
        {messages.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl shadow-sm">
            <p className="text-4xl mb-3">🎥</p>
            <p className="text-edn-gray font-body text-sm">Nenhuma mensagem ainda. Seja o primeiro!</p>
          </div>
        ) : (
          <div className="columns-1 sm:columns-2 gap-3 space-y-3">
            {messages.map((m) => (
              <div key={m.id} className="break-inside-avoid bg-white rounded-xl overflow-hidden shadow-sm">
                <video src={m.videoUrl} controls className="w-full block" />
                <div className="p-3 flex items-center gap-2">
                  {m.user.photoNow ? (
                    <img src={m.user.photoNow} alt={m.user.fullName ?? ""} className="w-7 h-7 rounded-full object-cover" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-edn-cloud flex items-center justify-center text-sm">🙂</div>
                  )}
                  <p className="text-edn-navy text-sm font-body font-medium">{m.user.fullName ?? "Colega"}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
