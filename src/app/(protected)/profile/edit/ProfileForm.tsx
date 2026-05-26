"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2, Camera, CheckCircle2 } from "lucide-react";
import { useUploadThing } from "@/lib/uploadthing-client";
import { SCHOOL_YEAR_START, SCHOOL_YEAR_END } from "@/lib/utils";

const ALL_YEARS = Array.from(
  { length: SCHOOL_YEAR_END - SCHOOL_YEAR_START + 1 },
  (_, i) => SCHOOL_YEAR_START + i
);

interface StudyPeriod { yearStart: number; yearEnd: number }
interface UserData {
  fullName?:    string;
  birthday?:    string;
  phone?:       string;
  city?:        string;
  state?:       string;
  country?:     string;
  linkedinUrl?: string;
  photoThen?:   string;
  photoNow?:    string;
  studyPeriods: StudyPeriod[];
}

const inputClass = "w-full border border-edn-mist rounded-lg px-3 py-2.5 text-sm font-body text-edn-navy focus:outline-none focus:border-edn-steel placeholder:text-edn-gray/40";
const labelClass = "block text-xs font-body font-medium text-edn-gray uppercase tracking-wider mb-1.5";

export function ProfileForm({
  user,
  apiEndpoint = "/api/profile",
  onSaved,
}: {
  user?: UserData;
  apiEndpoint?: string;
  onSaved?: () => void;
}) {
  const router = useRouter();

  const [fullName,  setFullName]  = useState(user?.fullName  ?? "");
  const [birthday,  setBirthday]  = useState(
    user?.birthday ? new Date(user.birthday).toISOString().split("T")[0] : ""
  );
  const [phone,    setPhone]    = useState(user?.phone   ?? "");
  const [city,     setCity]     = useState(user?.city    ?? "");
  const [state,    setState]    = useState(user?.state   ?? "");
  const [country,     setCountry]     = useState(user?.country     ?? "Brasil");
  const [linkedinUrl, setLinkedinUrl] = useState(user?.linkedinUrl ?? "");
  const [photoThen, setPhotoThen] = useState(user?.photoThen ?? "");
  const [photoNow,  setPhotoNow]  = useState(user?.photoNow  ?? "");
  const [periods,  setPeriods]  = useState<StudyPeriod[]>(
    user?.studyPeriods?.length ? user.studyPeriods : [{ yearStart: 1998, yearEnd: 2006 }]
  );
  const [loading,     setLoading]     = useState(false);
  const [saved,       setSaved]       = useState(false);
  const [error,       setError]       = useState("");
  const [uploadingThen, setUploadingThen] = useState(false);
  const [uploadingNow,  setUploadingNow]  = useState(false);

  const { startUpload: uploadPhoto } = useUploadThing("profilePhoto");

  function addPeriod()           { setPeriods([...periods, { yearStart: 1998, yearEnd: 2006 }]) }
  function removePeriod(i: number) { setPeriods(periods.filter((_, idx) => idx !== i)) }
  function updatePeriod(i: number, f: "yearStart" | "yearEnd", v: number) {
    setPeriods(periods.map((p, idx) => idx === i ? { ...p, [f]: v } : p));
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
      if (url) {
        setter(url);
      } else {
        setError("Upload falhou: nenhuma URL retornada. Tente novamente.");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Erro no upload: ${msg}`);
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSaved(false);

    const res = await fetch(apiEndpoint, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName, birthday, phone, city, state, country, linkedinUrl, photoThen, photoNow, studyPeriods: periods }),
    });

    if (res.ok) { setSaved(true); router.refresh(); onSaved?.(); }
    else {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Erro ao salvar.");
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
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

      <div>
        <label className={labelClass}>Nome completo *</label>
        <input value={fullName} onChange={(e) => setFullName(e.target.value)}
          required placeholder="Seu nome completo" className={inputClass} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Nascimento</label>
          <input type="date" value={birthday} onChange={(e) => setBirthday(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Telefone / WhatsApp</label>
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
            placeholder="+55 61 9xxxx-xxxx" className={inputClass} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Cidade</label>
          <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Brasília" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Estado</label>
          <input value={state} onChange={(e) => setState(e.target.value)} placeholder="DF" className={inputClass} />
        </div>
      </div>

      <div>
        <label className={labelClass}>País</label>
        <input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Brasil" className={inputClass} />
      </div>

      <div>
        <label className={labelClass}>LinkedIn (opcional)</label>
        <input
          value={linkedinUrl}
          onChange={(e) => setLinkedinUrl(e.target.value)}
          placeholder="https://linkedin.com/in/seu-perfil"
          className={inputClass}
          type="url"
        />
      </div>

      <fieldset className="space-y-3 pt-1">
        <legend className="font-body font-semibold text-edn-navy text-sm mb-1">Período(s) na EDN</legend>
        {periods.map((p, i) => (
          <div key={i} className="flex items-center gap-2">
            <select value={p.yearStart} onChange={(e) => updatePeriod(i, "yearStart", parseInt(e.target.value))}
              className="flex-1 border border-edn-mist rounded-lg px-3 py-2.5 text-sm font-body text-edn-navy focus:outline-none focus:border-edn-steel bg-white">
              {ALL_YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            <span className="text-edn-gray text-xs shrink-0">até</span>
            <select value={p.yearEnd} onChange={(e) => updatePeriod(i, "yearEnd", parseInt(e.target.value))}
              className="flex-1 border border-edn-mist rounded-lg px-3 py-2.5 text-sm font-body text-edn-navy focus:outline-none focus:border-edn-steel bg-white">
              {ALL_YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            {periods.length > 1 && (
              <button type="button" onClick={() => removePeriod(i)}
                className="p-1.5 text-red-400 hover:text-red-600 rounded-lg transition-colors shrink-0">
                <Trash2 size={13} />
              </button>
            )}
          </div>
        ))}
        <button type="button" onClick={addPeriod}
          className="flex items-center gap-1.5 text-edn-steel text-sm font-body hover:text-edn-navy transition-colors">
          <Plus size={13} /> Adicionar período
        </button>
      </fieldset>

      {error && <p className="text-red-500 text-xs font-body bg-red-50 rounded-lg px-3 py-2">{error}</p>}
      {saved && (
        <div className="flex items-center gap-2 text-green-600 text-sm font-body bg-green-50 rounded-lg px-3 py-2">
          <CheckCircle2 size={15} /> Perfil salvo com sucesso!
        </div>
      )}

      <button type="submit" disabled={loading || uploadingThen || uploadingNow}
        className="w-full bg-edn-navy text-white font-body font-semibold text-sm rounded-xl py-3.5 hover:bg-edn-navy-mid transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
        {loading && <Loader2 size={15} className="animate-spin" />}
        {loading ? "Salvando..." : "Salvar perfil"}
      </button>
    </form>
  );
}

function PhotoUploadField({ label, currentUrl, onUpload, isUploading, emptyEmoji, emptyLabel }: {
  label: string; currentUrl: string; onUpload: (file: File) => void;
  isUploading: boolean; emptyEmoji: string; emptyLabel: string;
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
