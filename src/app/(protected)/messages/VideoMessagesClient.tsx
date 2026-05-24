"use client";

import { useState, useRef, useEffect } from "react";
import { Loader2, Video, Upload, Square, Circle } from "lucide-react";

interface VideoMessage {
  id:        string;
  videoUrl:  string;
  user:      { fullName?: string; photoNow?: string };
  createdAt: string;
}

const MAX_SECONDS = 120; // 2 minutes

export function VideoMessagesClient({
  initialMessages,
  hasExistingMessage,
}: {
  initialMessages:    VideoMessage[];
  hasExistingMessage: boolean;
}) {
  const [messages,    setMessages]    = useState<VideoMessage[]>(initialMessages);
  const [mode,        setMode]        = useState<"idle" | "record" | "upload" | "preview">("idle");
  const [recording,   setRecording]   = useState(false);
  const [seconds,     setSeconds]     = useState(0);
  const [videoBlob,   setVideoBlob]   = useState<Blob | null>(null);
  const [videoUrl,    setVideoUrl]    = useState<string | null>(null);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");
  const [submitted,   setSubmitted]   = useState(hasExistingMessage);

  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const livePreviewRef  = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef        = useRef<Blob[]>([]);
  const timerRef         = useRef<NodeJS.Timeout | null>(null);
  const streamRef        = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    };
  }, []);

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (livePreviewRef.current) {
        livePreviewRef.current.srcObject = stream;
        livePreviewRef.current.play();
      }

      const recorder = new MediaRecorder(stream, { mimeType: "video/webm;codecs=vp9,opus" });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        const url  = URL.createObjectURL(blob);
        setVideoBlob(blob);
        setVideoUrl(url);
        setMode("preview");
        streamRef.current?.getTracks().forEach((t) => t.stop());
      };

      recorder.start(100);
      setRecording(true);
      setSeconds(0);

      timerRef.current = setInterval(() => {
        setSeconds((s) => {
          if (s + 1 >= MAX_SECONDS) {
            stopRecording();
            return MAX_SECONDS;
          }
          return s + 1;
        });
      }, 1000);
    } catch {
      setError("Não foi possível acessar a câmera/microfone.");
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
    if (file.size > 200 * 1024 * 1024) {
      setError("O arquivo é muito grande. Máximo 200 MB.");
      return;
    }
    setVideoBlob(file);
    setVideoUrl(URL.createObjectURL(file));
    setMode("preview");
  }

  async function handleSubmit() {
    if (!videoBlob) return;
    setLoading(true);
    setError("");

    // In production: upload to Uploadthing first, get URL, then POST to API
    // For now: POST a placeholder (shows the upload integration point)
    const formData = new FormData();
    formData.append("video", videoBlob, "message.webm");

    const res = await fetch("/api/messages", {
      method: "POST",
      body:   formData,
    });

    if (res.ok) {
      const newMsg = await res.json();
      setMessages([newMsg, ...messages]);
      setSubmitted(true);
      setMode("idle");
      setVideoBlob(null);
      setVideoUrl(null);
    } else {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Erro ao enviar. Tente novamente.");
    }
    setLoading(false);
  }

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="space-y-8">

      {/* ── Record / Upload panel ─────────────────────────────── */}
      {!submitted ? (
        <div className="bg-white rounded-2xl p-6 shadow-sm space-y-5">
          <h2 className="font-display text-edn-navy text-lg font-semibold">
            Deixe sua mensagem
          </h2>

          {mode === "idle" && (
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setMode("record")}
                className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-dashed border-edn-mist hover:border-edn-navy hover:bg-edn-cloud transition-all">
                <Video size={28} className="text-edn-navy" />
                <div className="text-center">
                  <p className="font-body font-semibold text-edn-navy text-sm">Gravar agora</p>
                  <p className="text-edn-gray text-xs font-body mt-0.5">Usar câmera</p>
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
                <video ref={livePreviewRef} muted className="w-full h-full object-cover" />
                {recording && (
                  <div className="absolute top-3 right-3 flex items-center gap-2 bg-black/60 rounded-full px-3 py-1">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-white text-xs font-body">{fmt(seconds)} / {fmt(MAX_SECONDS)}</span>
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                {!recording ? (
                  <button onClick={startRecording}
                    className="flex-1 flex items-center justify-center gap-2 bg-red-500 text-white py-3 rounded-xl text-sm font-body font-semibold hover:bg-red-600 transition-colors">
                    <Circle size={16} /> Iniciar gravação
                  </button>
                ) : (
                  <button onClick={stopRecording}
                    className="flex-1 flex items-center justify-center gap-2 bg-edn-navy text-white py-3 rounded-xl text-sm font-body font-semibold hover:bg-edn-navy-mid transition-colors">
                    <Square size={16} /> Parar gravação
                  </button>
                )}
                <button onClick={() => { setMode("idle"); streamRef.current?.getTracks().forEach((t) => t.stop()); }}
                  className="px-5 py-3 rounded-xl border border-edn-mist text-edn-gray text-sm font-body hover:bg-edn-cloud transition-colors">
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {mode === "preview" && videoUrl && (
            <div className="space-y-4">
              <video ref={videoPreviewRef} src={videoUrl} controls
                className="w-full rounded-xl aspect-video bg-black" />
              {error && <p className="text-red-500 text-xs font-body">{error}</p>}
              <div className="flex gap-3">
                <button onClick={handleSubmit} disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 bg-edn-navy text-white py-3 rounded-xl text-sm font-body font-semibold hover:bg-edn-navy-mid transition-colors disabled:opacity-60">
                  {loading && <Loader2 size={14} className="animate-spin" />}
                  {loading ? "Enviando..." : "Enviar mensagem"}
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
        <div className="bg-green-50 rounded-2xl p-5 text-center">
          <p className="text-green-700 font-body font-semibold text-sm">
            ✅ Sua mensagem já foi enviada!
          </p>
          <p className="text-green-600 text-xs font-body mt-1">
            Ela aparecerá abaixo assim que aprovada.
          </p>
        </div>
      )}

      {/* ── Messages gallery ──────────────────────────────────── */}
      <div className="space-y-4">
        <h2 className="font-display text-edn-navy text-lg font-semibold">
          Mensagens da turma
        </h2>
        {messages.length === 0 ? (
          <p className="text-edn-gray font-body text-sm text-center py-8">
            Nenhuma mensagem ainda. Seja o primeiro!
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {messages.map((m) => (
              <div key={m.id} className="bg-white rounded-xl overflow-hidden shadow-sm">
                <video src={m.videoUrl} controls
                  className="w-full aspect-video bg-black" />
                <div className="p-3 flex items-center gap-2">
                  {m.user.photoNow ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.user.photoNow} alt={m.user.fullName ?? ""}
                      className="w-7 h-7 rounded-full object-cover" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-edn-cloud flex items-center justify-center text-sm">
                      🙂
                    </div>
                  )}
                  <p className="text-edn-navy text-sm font-body font-medium">
                    {m.user.fullName ?? "Colega"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
