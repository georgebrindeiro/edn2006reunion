"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2, Camera } from "lucide-react";
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
  email?:       string;
  city?:        string;
  state?:       string;
  country?:     string;
  photoThen?:   string;
  photoNow?:    string;
  studyPeriods: StudyPeriod[];
}

const inputClass = "w-full border border-edn-mist rounded-lg px-3 py-2.5 text-sm font-body text-edn-navy focus:outline-none focus:border-edn-steel placeholder:text-edn-gray/40";
const labelClass = "block text-xs font-body font-medium text-edn-gray uppercase tracking-wider mb-1.5";

export function ProfileForm({ user }: { user?: UserData }) {
  const router = useRouter();

  const [fullName,  setFullName]  = useState(user?.fullName  ?? "");
  const [birthday,  setBirthday]  = useState(
    user?.birthday ? new Date(user.birthday).toISOString().split("T")[0] : ""
  );
  const [phone,     setPhone]     = useState(user?.phone    ?? "");
  const [city,      setCity]      = useState(user?.city     ?? "");
  const [state,     setState]     = useState(user?.state    ?? "");
  const [country,   setCountry]   = useState(user?.country  ?? "Brasil");
  const [photoThen, setPhotoThen] = useState(user?.photoThen ?? "");
  const [photoNow,  setPhotoNow]  = useState(user?.photoNow  ?? "");
  const [periods,   setPeriods]   = useState<StudyPeriod[]>(
    user?.studyPeriods?.length ? user.studyPeriods : [{ yearStart: 1998, yearEnd: 2006 }]
  );
  const [loading,   setLoading]   = useState(false);
  const [saved,     setSaved]     = useState(false);
  const [error,     setError]     = useState("");

  function addPeriod()        { setPeriods([...periods, { yearStart: 1998, yearEnd: 2006 }]) }
  function removePeriod(i: number) { setPeriods(periods.filter((_, idx) => idx !== i)) }
  function updatePeriod(i: number, f: "yearStart" | "yearEnd", v: number) {
    setPeriods(periods.map((p, idx) => idx === i ? { ...p, [f]: v } : p));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSaved(false);

    const res = await fetch("/api/profile", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName, birthday, phone,
        city, state, country,
        photoThen, photoNow,
        studyPeriods: periods,
      }),
    });

    if (res.ok) {
      setSaved(true);
      router.refresh();
    } else {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Erro ao salvar.");
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* Then & Now photo previews */}
      <div className="grid grid-cols-2 gap-4 mb-2">
        <PhotoField
          label="📸 Foto na EDN (antes)"
          value={photoThen}
          onChange={setPhotoThen}
          placeholder="URL da foto antiga"
        />
        <PhotoField
          label="🙂 Foto hoje (depois)"
          value={photoNow}
          onChange={setPhotoNow}
          placeholder="URL da foto atual"
        />
      </div>
      <p className="text-edn-gray/60 text-[11px] font-body -mt-2">
        Cole a URL de uma foto. Em breve: upload direto via Uploadthing.
      </p>

      <div>
        <label className={labelClass}>Nome completo *</label>
        <input value={fullName} onChange={(e) => setFullName(e.target.value)}
          required placeholder="Seu nome completo" className={inputClass} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Nascimento</label>
          <input type="date" value={birthday} onChange={(e) => setBirthday(e.target.value)}
            className={inputClass} />
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
          <input value={city} onChange={(e) => setCity(e.target.value)}
            placeholder="Brasília" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Estado</label>
          <input value={state} onChange={(e) => setState(e.target.value)}
            placeholder="DF" className={inputClass} />
        </div>
      </div>

      <div>
        <label className={labelClass}>País</label>
        <input value={country} onChange={(e) => setCountry(e.target.value)}
          placeholder="Brasil" className={inputClass} />
      </div>

      {/* Study periods */}
      <fieldset className="space-y-3">
        <legend className="font-body font-semibold text-edn-navy text-sm mb-1">
          Período(s) na EDN
        </legend>
        {periods.map((p, i) => (
          <div key={i} className="flex items-center gap-2">
            <select value={p.yearStart} onChange={(e) => updatePeriod(i, "yearStart", parseInt(e.target.value))}
              className="flex-1 border border-edn-mist rounded-lg px-3 py-2.5 text-sm font-body text-edn-navy focus:outline-none focus:border-edn-steel bg-white">
              {ALL_YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            <span className="text-edn-gray text-xs">até</span>
            <select value={p.yearEnd} onChange={(e) => updatePeriod(i, "yearEnd", parseInt(e.target.value))}
              className="flex-1 border border-edn-mist rounded-lg px-3 py-2.5 text-sm font-body text-edn-navy focus:outline-none focus:border-edn-steel bg-white">
              {ALL_YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            {periods.length > 1 && (
              <button type="button" onClick={() => removePeriod(i)}
                className="p-1.5 text-red-400 hover:text-red-600 rounded-lg transition-colors">
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

      {error  && <p className="text-red-500 text-xs font-body bg-red-50 rounded-lg px-3 py-2">{error}</p>}
      {saved  && <p className="text-green-600 text-xs font-body bg-green-50 rounded-lg px-3 py-2">✅ Perfil salvo!</p>}

      <button type="submit" disabled={loading}
        className="w-full bg-edn-navy text-white font-body font-semibold text-sm rounded-xl py-3.5 hover:bg-edn-navy-mid transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
        {loading && <Loader2 size={15} className="animate-spin" />}
        {loading ? "Salvando..." : "Salvar perfil"}
      </button>
    </form>
  );
}

function PhotoField({ label, value, onChange, placeholder }: {
  label:       string;
  value:       string;
  onChange:    (v: string) => void;
  placeholder: string;
}) {
  return (
    <div>
      <label className="block text-xs font-body font-medium text-edn-gray uppercase tracking-wider mb-1.5">
        {label}
      </label>
      <div className="aspect-square bg-edn-cloud rounded-xl overflow-hidden mb-1.5 flex items-center justify-center">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="preview" className="w-full h-full object-cover" />
        ) : (
          <Camera size={24} className="text-edn-mist" />
        )}
      </div>
      <input value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-edn-mist rounded-lg px-2.5 py-2 text-xs font-body text-edn-navy focus:outline-none focus:border-edn-steel placeholder:text-edn-gray/40" />
    </div>
  );
}
