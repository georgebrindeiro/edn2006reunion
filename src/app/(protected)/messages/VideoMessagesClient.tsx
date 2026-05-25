"use client";

import { useState, useRef, useEffect } from "react";
import { Loader2, Video, Upload, Square, Circle, CheckCircle2 } from "lucide-react";
import { useUploadThing } from "@/lib/uploadthing-client";

interface VideoMessage {
  id: string; videoUrl: string;
  user: { fullName?: string; photoNow?: string };
  createdAt: string;
}

const MAX_SECONDS = 120;

export function VideoMessagesClient({ initialMessages, hasExistingMessage }: {
  initialMessages: VideoMessage[];
  hasExistingMessage: boolean;
}) {
  const [messages,  setMessages]  = useState<VideoMessage[]>(initialMessages);
  const [mode,      setMode]      = useState<"idle" | "record" | "upload" | "preview">("idle");
  const [recording, setRecording] = useState(false);
  const [seconds,   setSeconds]   = useState(0);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [videoUrl,  setVideoUrl]  = useState<string | null>(null);
  const [error,     setError]     = useState("");
  const [submitted, setSubmitted] = useState(hasExistingMessage);

  const livePreviewRef   = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef        = useRef<Blob[]>([]);
  const timerRef         = useRef<NodeJS.Timeout | null>(null);
  const streamRef        = useRef<MediaStream | null>(null);

  const { startUpload, isUploading } = useUploadThing("videoMessage");

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
    if (!file) return;
    if (file.size > 256 * 1024 * 1024) { setError("Arquivo muito grande. Máximo 256 MB."); return; }
    setVideoBlob(file);
    setVideoUrl(URL.createObjectURL(file));
    setMode("preview");
  }

  async function handleSubmit() {
    if (!videoBlob) return;
    setError("");

    const file = new File([videoBlob], "message.webm", { type: videoBlob.type });
    const res = await startUpload([file]);

    const videoUrl = res?.[0]?.ufsUrl ?? res?.[0]?.url;
    if (!videoUrl) { setError("Erro no upload. Tente novamente."); return; }

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
    } else {
      const body = await apiRes.json().catch(() => ({}));
      setError(body.error ?? "Erro ao salvar mensagem.");
    }
  }

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  const progress = (seconds / MAX_SECONDS) * 100;

  return (
    <div className="space-y-8">

      {/* Record / Upload panel */}
      {!submitted ? (
        <div className="bg-white rounded-2xl p-6 shadow-sm space-y-5">
          <h2 className="font-display text-edn-navy text-lg font-semibold">Deixe sua mensagem</h2>

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
                  <p className="text-edn-gray text-xs font-body mt-0.5">MP4, MOV, WebM</p>
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
                    style={{ width: `${progress}%` }} />
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
              <video src={videoUrl} controls className="w-full rounded-xl aspect-video bg-black" />
              {isUploading && (
                <div className="flex items-center gap-2 text-edn-steel text-sm font-body bg-edn-cloud rounded-lg px-4 py-3">
                  <Loader2 size={15} className="animate-spin" />
                  Enviando... isso pode demorar alguns segundos.
                </div>
              )}
              {error && <p className="text-red-500 text-xs font-body bg-red-50 rounded-lg px-3 py-2">{error}</p>}
              <div className="flex gap-3">
                <button onClick={handleSubmit} disabled={isUploading}
                  className="flex-1 flex items-center justify-center gap-2 bg-edn-navy text-white py-3 rounded-xl text-sm font-body font-semibold hover:bg-edn-navy-mid transition-colors disabled:opacity-60">
                  {isUploading && <Loader2 size={14} className="animate-spin" />}
                  {isUploading ? "Enviando..." : "Enviar mensagem"}
                </button>
                <button onClick={() => { setMode("idle"); setVideoBlob(null); setVideoUrl(null); }}
                  className="px-5 py-3 rounded-xl border border-edn-mist text-edn-gray text-sm font-body hover:bg-edn-cloud transition-colors">
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
          <div className="grid gap-4 sm:grid-cols-2">
            {messages.map((m) => (
              <div key={m.id} className="bg-white rounded-xl overflow-hidden shadow-sm">
                <video src={m.videoUrl} controls className="w-full aspect-video bg-black" />
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
