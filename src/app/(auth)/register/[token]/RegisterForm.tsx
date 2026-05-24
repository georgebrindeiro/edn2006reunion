"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { SCHOOL_YEAR_START, SCHOOL_YEAR_END } from "@/lib/utils";

const ALL_YEARS = Array.from(
  { length: SCHOOL_YEAR_END - SCHOOL_YEAR_START + 1 },
  (_, i) => SCHOOL_YEAR_START + i
);

interface StudyPeriod { yearStart: number; yearEnd: number }

export function RegisterForm({ token }: { token: string }) {
  const router = useRouter();

  const [fullName,     setFullName]     = useState("");
  const [birthday,     setBirthday]     = useState("");
  const [phone,        setPhone]        = useState("");
  const [email,        setEmail]        = useState("");
  const [city,         setCity]         = useState("");
  const [state,        setState]        = useState("");
  const [country,      setCountry]      = useState("Brasil");
  const [periods,      setPeriods]      = useState<StudyPeriod[]>([{ yearStart: 1998, yearEnd: 2006 }]);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState("");

  function addPeriod() {
    setPeriods([...periods, { yearStart: SCHOOL_YEAR_START, yearEnd: SCHOOL_YEAR_END }]);
  }
  function removePeriod(i: number) {
    setPeriods(periods.filter((_, idx) => idx !== i));
  }
  function updatePeriod(i: number, field: "yearStart" | "yearEnd", val: number) {
    setPeriods(periods.map((p, idx) => idx === i ? { ...p, [field]: val } : p));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/register", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token,
        fullName, birthday, phone, email,
        city, state, country,
        studyPeriods: periods,
      }),
    });

    if (res.ok) {
      router.push("/login?registered=1");
    } else {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Erro ao cadastrar. Tente novamente.");
      setLoading(false);
    }
  }

  const inputClass =
    "w-full border border-edn-mist rounded-lg px-3 py-2.5 text-sm font-body text-edn-navy focus:outline-none focus:border-edn-steel placeholder:text-edn-gray/40";

  const labelClass = "block text-xs font-body font-medium text-edn-gray uppercase tracking-wider mb-1.5";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      <div>
        <label className={labelClass}>Nome completo *</label>
        <input value={fullName} onChange={(e) => setFullName(e.target.value)}
          required placeholder="Seu nome completo" className={inputClass} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Data de nascimento *</label>
          <input type="date" value={birthday} onChange={(e) => setBirthday(e.target.value)}
            required className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Telefone / WhatsApp *</label>
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
            required placeholder="+55 61 9xxxx-xxxx" className={inputClass} />
        </div>
      </div>

      <div>
        <label className={labelClass}>E-mail *</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
          required placeholder="voce@email.com" className={inputClass} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Cidade *</label>
          <input value={city} onChange={(e) => setCity(e.target.value)}
            required placeholder="Brasília" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Estado</label>
          <input value={state} onChange={(e) => setState(e.target.value)}
            placeholder="DF" className={inputClass} />
        </div>
      </div>

      <div>
        <label className={labelClass}>País *</label>
        <input value={country} onChange={(e) => setCountry(e.target.value)}
          required placeholder="Brasil" className={inputClass} />
      </div>

      {/* Study periods */}
      <fieldset className="space-y-3 pt-1">
        <legend className="font-body font-semibold text-edn-navy text-sm mb-1">
          Período(s) na Escola das Nações
        </legend>
        <p className="text-edn-gray text-xs font-body">
          Selecione os anos em que você estudou na EDN. Se houve interrupção, adicione períodos separados.
        </p>

        {periods.map((p, i) => (
          <div key={i} className="flex items-center gap-2">
            <select value={p.yearStart} onChange={(e) => updatePeriod(i, "yearStart", parseInt(e.target.value))}
              className="flex-1 border border-edn-mist rounded-lg px-3 py-2.5 text-sm font-body text-edn-navy focus:outline-none focus:border-edn-steel bg-white">
              {ALL_YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            <span className="text-edn-gray text-xs font-body shrink-0">até</span>
            <select value={p.yearEnd} onChange={(e) => updatePeriod(i, "yearEnd", parseInt(e.target.value))}
              className="flex-1 border border-edn-mist rounded-lg px-3 py-2.5 text-sm font-body text-edn-navy focus:outline-none focus:border-edn-steel bg-white">
              {ALL_YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            {periods.length > 1 && (
              <button type="button" onClick={() => removePeriod(i)}
                className="p-2 text-red-400 hover:text-red-600 rounded-lg transition-colors">
                <Trash2 size={14} />
              </button>
            )}
          </div>
        ))}

        <button type="button" onClick={addPeriod}
          className="flex items-center gap-1.5 text-edn-steel text-sm font-body hover:text-edn-navy transition-colors">
          <Plus size={14} /> Adicionar outro período
        </button>
      </fieldset>

      {error && (
        <p className="text-red-500 text-xs font-body bg-red-50 rounded-lg px-3 py-2">{error}</p>
      )}

      <button type="submit" disabled={loading}
        className="w-full bg-edn-navy text-white font-body font-semibold text-sm rounded-xl py-3.5 hover:bg-edn-navy-mid transition-colors disabled:opacity-60 flex items-center justify-center gap-2 mt-2">
        {loading && <Loader2 size={16} className="animate-spin" />}
        {loading ? "Cadastrando..." : "Criar meu perfil"}
      </button>

      <p className="text-edn-gray text-xs font-body text-center">
        Após o cadastro, use seu e-mail + a senha compartilhada para entrar.
      </p>
    </form>
  );
}
