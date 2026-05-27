"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, Plus, Trash2, Camera } from "lucide-react";
import { SCHOOL_YEAR_START, SCHOOL_YEAR_END } from "@/lib/utils";
import { useUploadThing } from "@/lib/uploadthing-client";

const ALL_YEARS = Array.from(
  { length: SCHOOL_YEAR_END - SCHOOL_YEAR_START + 1 },
  (_, i) => SCHOOL_YEAR_START + i
);

interface StudyPeriod { yearStart: number; yearEnd: number }
type Step = "check" | "register" | "photos";

const lightInputClass =
  "w-full border border-edn-mist rounded-lg px-3 py-2.5 text-sm font-body text-edn-navy focus:outline-none focus:border-edn-steel placeholder:text-edn-gray/40";
const lightLabelClass =
  "block text-xs font-body font-medium text-edn-gray uppercase tracking-wider mb-1.5";

export function LoginForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("check");

  // Step 1
  const [phone,      setPhone]      = useState("");
  const [passphrase, setPassphrase] = useState("");
  const [showPass,   setShowPass]   = useState(false);

  // Step 2 (registration)
  const [fullName, setFullName] = useState("");
  const [birthday, setBirthday] = useState("");
  const [email,    setEmail]    = useState("");
  const [city,     setCity]     = useState("");
  const [state,    setState]    = useState("");
  const [country,  setCountry]  = useState("Brasil");
  const [periods,  setPeriods]  = useState<StudyPeriod[]>([{ yearStart: 1998, yearEnd: 2006 }]);

  // Step 3 (optional photos — called after sign-in so uploads are authenticated)
  const [photoThen,     setPhotoThen]     = useState("");
  const [photoNow,      setPhotoNow]      = useState("");
  const [uploadingThen, setUploadingThen] = useState(false);
  const [uploadingNow,  setUploadingNow]  = useState(false);

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const { startUpload: uploadPhoto } = useUploadThing("profilePhoto");

  async function handleCheck(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/check-phone", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ phone, passphrase }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Erro ao verificar. Tente novamente.");
      setLoading(false);
      return;
    }

    if (data.deleted) {
      setError("Perfil duplicado excluído. Tente entrar com o código do país (ex: +55 61 9xxxx-xxxx).");
      setLoading(false);
      return;
    }

    if (data.hasProfile) {
      const result = await signIn("credentials", { phone, passphrase, redirect: false });
      if (result?.error) {
        setError("Erro ao entrar. Tente novamente.");
        setLoading(false);
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } else {
      setStep("register");
      setLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/register", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        passphrase, fullName, phone, birthday, email,
        city, state, country, studyPeriods: periods,
      }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Erro ao cadastrar. Tente novamente.");
      setLoading(false);
      return;
    }

    // Sign in then proceed to optional photo step
    const result = await signIn("credentials", { phone, passphrase, redirect: false });
    if (result?.error) {
      setError("Perfil criado! Tente entrar novamente.");
      setLoading(false);
    } else {
      setStep("photos");
      setLoading(false);
    }
  }

  async function handlePhotoUpload(
    file: File,
    setter: (url: string) => void,
    setUploading: (v: boolean) => void,
  ) {
    setUploading(true);
    setError("");
    try {
      const res = await uploadPhoto([file]);
      const url = res?.[0]?.ufsUrl ?? res?.[0]?.url;
      if (url) setter(url);
      else setError("Upload falhou. Tente novamente.");
    } catch (err) {
      setError(`Erro no upload: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setUploading(false);
    }
  }

  async function handleSavePhotos() {
    if (!photoThen && !photoNow) {
      router.push("/dashboard");
      router.refresh();
      return;
    }
    setLoading(true);
    setError("");
    await fetch("/api/profile", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName, city, state, country,
        birthday, email, phone,
        photoThen: photoThen || null,
        photoNow:  photoNow  || null,
        studyPeriods: periods,
      }),
    });
    router.push("/dashboard");
    router.refresh();
  }

  function addPeriod() {
    setPeriods([...periods, { yearStart: SCHOOL_YEAR_START, yearEnd: SCHOOL_YEAR_END }]);
  }
  function removePeriod(i: number) {
    setPeriods(periods.filter((_, idx) => idx !== i));
  }
  function updatePeriod(i: number, field: "yearStart" | "yearEnd", val: number) {
    setPeriods(periods.map((p, idx) => idx === i ? { ...p, [field]: val } : p));
  }

  // ── Step 1: login ──────────────────────────────────────────────────────────

  if (step === "check") {
    return (
      <div className="bg-white border border-edn-mist/60 rounded-2xl p-8 shadow-sm">
        <h2 className="font-display text-edn-navy text-xl font-semibold mb-6">
          Entrar
        </h2>

        <form onSubmit={handleCheck} className="space-y-4">
          <div>
            <label className="block text-edn-gray text-xs font-body uppercase tracking-wider mb-1.5">
              Seu WhatsApp / Telefone
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              placeholder="+55 61 9xxxx-xxxx"
              className="w-full border border-edn-mist rounded-lg px-4 py-3 text-edn-navy placeholder:text-edn-gray/40 text-sm font-body focus:outline-none focus:border-edn-steel transition-all"
            />
          </div>

          <div>
            <label className="block text-edn-gray text-xs font-body uppercase tracking-wider mb-1.5">
              Senha da turma
            </label>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                required
                placeholder="••••••••••••"
                className="w-full border border-edn-mist rounded-lg px-4 py-3 pr-11 text-edn-navy placeholder:text-edn-gray/40 text-sm font-body focus:outline-none focus:border-edn-steel transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-edn-gray/50 hover:text-edn-navy transition-colors"
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-red-600 text-xs font-body bg-red-50 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-edn-navy text-white font-body font-semibold text-sm rounded-lg py-3 hover:bg-edn-navy-mid transition-colors disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {loading ? "Verificando..." : "Continuar"}
          </button>
        </form>
      </div>
    );
  }

  // ── Step 3: optional photos ────────────────────────────────────────────────

  if (step === "photos") {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-2xl">
        <h2 className="font-display text-edn-navy text-xl font-semibold mb-1">
          Suas fotos
        </h2>
        <p className="text-edn-gray text-sm font-body mb-5">
          Opcional — adicione sua foto da época da EDN e uma atual.
          Você também pode fazer isso depois no seu perfil.
        </p>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <PhotoUploadField
            label="Foto na EDN (antes)"
            currentUrl={photoThen}
            onUpload={(file) => handlePhotoUpload(file, setPhotoThen, setUploadingThen)}
            isUploading={uploadingThen}
            emptyEmoji="🎒"
            emptyLabel="Foto antiga"
          />
          <PhotoUploadField
            label="Foto hoje (depois)"
            currentUrl={photoNow}
            onUpload={(file) => handlePhotoUpload(file, setPhotoNow, setUploadingNow)}
            isUploading={uploadingNow}
            emptyEmoji="📷"
            emptyLabel="Foto atual"
          />
        </div>

        {error && (
          <p className="text-red-500 text-xs font-body bg-red-50 rounded-lg px-3 py-2 mb-4">
            {error}
          </p>
        )}

        <button
          onClick={handleSavePhotos}
          disabled={loading || uploadingThen || uploadingNow}
          className="w-full bg-edn-navy text-white font-body font-semibold text-sm rounded-xl py-3.5 hover:bg-edn-navy-mid transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {loading && <Loader2 size={16} className="animate-spin" />}
          {loading
            ? "Salvando..."
            : photoThen || photoNow
            ? "Salvar fotos e entrar"
            : "Entrar sem fotos"}
        </button>

        <button
          type="button"
          onClick={() => { router.push("/dashboard"); router.refresh(); }}
          className="w-full text-edn-gray text-sm font-body text-center hover:text-edn-navy transition-colors py-2 mt-1"
        >
          Pular por agora
        </button>
      </div>
    );
  }

  // ── Step 2: registration ───────────────────────────────────────────────────

  return (
    <div className="bg-white rounded-2xl p-6 shadow-2xl">
      <h2 className="font-display text-edn-navy text-xl font-semibold mb-1">
        Crie seu perfil
      </h2>
      <p className="text-edn-gray text-sm font-body mb-5">
        Preencha suas informações para sabermos quem você é.
      </p>

      <form onSubmit={handleRegister} className="space-y-4">
        <div>
          <label className={lightLabelClass}>Nome completo *</label>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            placeholder="Seu nome completo"
            className={lightInputClass}
          />
        </div>

        <div>
          <label className={lightLabelClass}>WhatsApp / Telefone</label>
          <input
            type="tel"
            value={phone}
            readOnly
            className={`${lightInputClass} bg-edn-cloud cursor-not-allowed`}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={lightLabelClass}>Nascimento</label>
            <input
              type="date"
              value={birthday}
              onChange={(e) => setBirthday(e.target.value)}
              className={lightInputClass}
            />
          </div>
          <div>
            <label className={lightLabelClass}>E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@email.com"
              className={lightInputClass}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={lightLabelClass}>Cidade</label>
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Brasília"
              className={lightInputClass}
            />
          </div>
          <div>
            <label className={lightLabelClass}>Estado</label>
            <input
              value={state}
              onChange={(e) => setState(e.target.value)}
              placeholder="DF"
              className={lightInputClass}
            />
          </div>
        </div>

        <div>
          <label className={lightLabelClass}>País</label>
          <input
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            placeholder="Brasil"
            className={lightInputClass}
          />
        </div>

        <fieldset className="space-y-3 pt-1">
          <legend className="font-body font-semibold text-edn-navy text-sm mb-1">
            Período(s) na Escola das Nações
          </legend>
          <p className="text-edn-gray text-xs font-body">
            Opcional. Selecione os anos em que você estudou na EDN.
          </p>
          {periods.map((p, i) => (
            <div key={i} className="flex items-center gap-2">
              <select
                value={p.yearStart}
                onChange={(e) => updatePeriod(i, "yearStart", parseInt(e.target.value))}
                className="flex-1 border border-edn-mist rounded-lg px-3 py-2.5 text-sm font-body text-edn-navy focus:outline-none focus:border-edn-steel bg-white"
              >
                {ALL_YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
              <span className="text-edn-gray text-xs font-body shrink-0">até</span>
              <select
                value={p.yearEnd}
                onChange={(e) => updatePeriod(i, "yearEnd", parseInt(e.target.value))}
                className="flex-1 border border-edn-mist rounded-lg px-3 py-2.5 text-sm font-body text-edn-navy focus:outline-none focus:border-edn-steel bg-white"
              >
                {ALL_YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
              {periods.length > 1 && (
                <button
                  type="button"
                  onClick={() => removePeriod(i)}
                  className="p-2 text-red-400 hover:text-red-600 rounded-lg transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addPeriod}
            className="flex items-center gap-1.5 text-edn-steel text-sm font-body hover:text-edn-navy transition-colors"
          >
            <Plus size={14} /> Adicionar outro período
          </button>
        </fieldset>

        {error && (
          <p className="text-red-500 text-xs font-body bg-red-50 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-edn-navy text-white font-body font-semibold text-sm rounded-xl py-3.5 hover:bg-edn-navy-mid transition-colors disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
        >
          {loading && <Loader2 size={16} className="animate-spin" />}
          {loading ? "Cadastrando..." : "Criar meu perfil"}
        </button>

        <button
          type="button"
          onClick={() => { setStep("check"); setError(""); }}
          className="w-full text-edn-gray text-sm font-body text-center hover:text-edn-navy transition-colors py-1"
        >
          Voltar
        </button>
      </form>
    </div>
  );
}

// ── Reusable photo upload field ──────────────────────────────────────────────

function PhotoUploadField({
  label, currentUrl, onUpload, isUploading, emptyEmoji, emptyLabel,
}: {
  label: string;
  currentUrl: string;
  onUpload: (file: File) => void;
  isUploading: boolean;
  emptyEmoji: string;
  emptyLabel: string;
}) {
  const [dragging, setDragging] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onUpload(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file?.type.startsWith("image/")) onUpload(file);
  }

  return (
    <div>
      <label className="block text-xs font-body font-medium text-edn-gray uppercase tracking-wider mb-1.5">
        {label}
      </label>
      <label
        className={`block aspect-square rounded-xl overflow-hidden cursor-pointer relative transition-all ${
          dragging ? "ring-2 ring-edn-navy bg-edn-cloud" : "bg-edn-cloud hover:bg-edn-mist"
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        {currentUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={currentUrl} alt="foto" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-1">
            <span className="text-3xl">{emptyEmoji}</span>
            <p className="text-edn-gray/60 text-xs font-body">{emptyLabel}</p>
            <Camera size={14} className="text-edn-mist mt-1" />
          </div>
        )}
        {isUploading && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <Loader2 size={20} className="animate-spin text-white" />
          </div>
        )}
        {currentUrl && !isUploading && (
          <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-all flex items-center justify-center opacity-0 hover:opacity-100">
            <div className="text-white text-center">
              <Camera size={18} className="mx-auto mb-1" />
              <p className="text-xs font-body">Trocar foto</p>
            </div>
          </div>
        )}
        <input type="file" accept="image/*" className="hidden" onChange={handleChange} />
      </label>
    </div>
  );
}
