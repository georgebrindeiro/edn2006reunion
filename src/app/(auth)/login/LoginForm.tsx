"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, Plus, Trash2 } from "lucide-react";
import { SCHOOL_YEAR_START, SCHOOL_YEAR_END } from "@/lib/utils";

const ALL_YEARS = Array.from(
  { length: SCHOOL_YEAR_END - SCHOOL_YEAR_START + 1 },
  (_, i) => SCHOOL_YEAR_START + i
);

interface StudyPeriod { yearStart: number; yearEnd: number }
type Step = "check" | "register";

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

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

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

    const result = await signIn("credentials", { phone, passphrase, redirect: false });
    if (result?.error) {
      setError("Perfil criado! Tente entrar novamente.");
      setLoading(false);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
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

  if (step === "check") {
    return (
      <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 shadow-2xl">
        <h2 className="font-display text-white text-xl font-semibold mb-6">
          Entrar
        </h2>

        <form onSubmit={handleCheck} className="space-y-4">
          <div>
            <label className="block text-edn-mist text-xs font-body uppercase tracking-wider mb-1.5">
              Seu WhatsApp / Telefone
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              placeholder="+55 61 9xxxx-xxxx"
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-white/30 text-sm font-body focus:outline-none focus:border-edn-steel-lt focus:bg-white/15 transition-all"
            />
          </div>

          <div>
            <label className="block text-edn-mist text-xs font-body uppercase tracking-wider mb-1.5">
              Senha da turma
            </label>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                required
                placeholder="••••••••••••"
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 pr-11 text-white placeholder:text-white/30 text-sm font-body focus:outline-none focus:border-edn-steel-lt focus:bg-white/15 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-red-300 text-xs font-body bg-red-500/10 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-edn-navy font-body font-semibold text-sm rounded-lg py-3 hover:bg-edn-mist transition-colors disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {loading ? "Verificando..." : "Continuar"}
          </button>
        </form>
      </div>
    );
  }

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
