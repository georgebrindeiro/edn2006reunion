"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2 } from "lucide-react";

interface Guest { fullName: string; age?: number }

interface ExistingRsvp {
  isAttending:     boolean;
  guestAdults:     Guest[];
  guestChildren:   Guest[];
  joinsBarbecue:   boolean;
  drinksAlcohol:   boolean;
  drinkPreference?: string;
  paymentRef?:     string;
}

export function RsvpForm({ existingRsvp }: { existingRsvp?: ExistingRsvp }) {
  const router = useRouter();
  const r = existingRsvp;

  const [isAttending,     setIsAttending]     = useState<boolean | null>(r ? r.isAttending : null);
  const [adults,          setAdults]          = useState<Guest[]>(r?.guestAdults     ?? []);
  const [children,        setChildren]        = useState<Guest[]>(r?.guestChildren   ?? []);
  const [joinsBarbecue,   setJoinsBarbecue]   = useState(r?.joinsBarbecue  ?? false);
  const [drinksAlcohol,   setDrinksAlcohol]   = useState(r?.drinksAlcohol  ?? false);
  const [drinkPref,       setDrinkPref]       = useState(r?.drinkPreference ?? "");
  const [paymentRef,      setPaymentRef]      = useState(r?.paymentRef      ?? "");
  const [loading,         setLoading]         = useState(false);
  const [saved,           setSaved]           = useState(false);
  const [error,           setError]           = useState("");

  function addAdult()   { setAdults([...adults,   { fullName: "" }]) }
  function addChild()   { setChildren([...children, { fullName: "", age: undefined }]) }

  function removeAdult(i: number) { setAdults(adults.filter((_, idx) => idx !== i)) }
  function removeChild(i: number) { setChildren(children.filter((_, idx) => idx !== i)) }

  function updateAdult(i: number, val: string) {
    setAdults(adults.map((a, idx) => idx === i ? { ...a, fullName: val } : a));
  }
  function updateChild(i: number, field: "fullName" | "age", val: string) {
    setChildren(children.map((c, idx) =>
      idx === i ? { ...c, [field]: field === "age" ? parseInt(val) || 0 : val } : c
    ));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isAttending === null) { setError("Por favor, confirme se você vai comparecer."); return; }
    setLoading(true);
    setError("");

    const res = await fetch("/api/rsvp", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        isAttending,
        guestAdults:   adults,
        guestChildren: children,
        joinsBarbecue,
        drinksAlcohol,
        drinkPreference: drinksAlcohol ? drinkPref : null,
        paymentRef,
      }),
    });

    if (res.ok) {
      setSaved(true);
      router.refresh();
    } else {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Erro ao salvar. Tente novamente.");
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-7">

      {/* ── Attending? ─────────────────────────────────────────── */}
      <fieldset>
        <legend className="font-body font-semibold text-edn-navy text-sm mb-3">
          Você vai comparecer ao reencontro?
        </legend>
        <div className="grid grid-cols-2 gap-3">
          {[
            { val: true,  label: "✅ Sim, vou!" },
            { val: false, label: "😢 Não poderei ir" },
          ].map(({ val, label }) => (
            <button
              key={String(val)}
              type="button"
              onClick={() => setIsAttending(val)}
              className={`py-3 px-4 rounded-xl border-2 text-sm font-body font-medium transition-all ${
                isAttending === val
                  ? "border-edn-navy bg-edn-navy text-white"
                  : "border-edn-mist text-edn-navy hover:border-edn-steel"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </fieldset>

      {/* ── If attending: guests + food + drinks ───────────────── */}
      {isAttending === true && (
        <>
          {/* Adult guests */}
          <fieldset className="space-y-3">
            <legend className="font-body font-semibold text-edn-navy text-sm">
              Convidados adultos
            </legend>
            <p className="text-edn-gray text-xs font-body">
              Inclua o nome completo de cada convidado adulto (não inclua seu próprio nome).
            </p>
            {adults.map((a, i) => (
              <div key={i} className="flex gap-2">
                <input
                  value={a.fullName}
                  onChange={(e) => updateAdult(i, e.target.value)}
                  placeholder={`Nome completo do adulto ${i + 1}`}
                  className="flex-1 border border-edn-mist rounded-lg px-3 py-2.5 text-sm font-body text-edn-navy focus:outline-none focus:border-edn-steel"
                  required
                />
                <button type="button" onClick={() => removeAdult(i)}
                  className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
            <button type="button" onClick={addAdult}
              className="flex items-center gap-1.5 text-edn-steel text-sm font-body hover:text-edn-navy transition-colors">
              <Plus size={15} /> Adicionar adulto
            </button>
          </fieldset>

          {/* Child guests */}
          <fieldset className="space-y-3">
            <legend className="font-body font-semibold text-edn-navy text-sm">
              Crianças
            </legend>
            <p className="text-edn-gray text-xs font-body">
              Inclua nome completo e idade de cada criança (necessário para a lista da porta).
            </p>
            {children.map((c, i) => (
              <div key={i} className="flex gap-2">
                <input
                  value={c.fullName}
                  onChange={(e) => updateChild(i, "fullName", e.target.value)}
                  placeholder={`Nome completo da criança ${i + 1}`}
                  className="flex-1 border border-edn-mist rounded-lg px-3 py-2.5 text-sm font-body text-edn-navy focus:outline-none focus:border-edn-steel"
                  required
                />
                <input
                  type="number"
                  min="0"
                  max="17"
                  value={c.age ?? ""}
                  onChange={(e) => updateChild(i, "age", e.target.value)}
                  placeholder="Idade"
                  className="w-20 border border-edn-mist rounded-lg px-3 py-2.5 text-sm font-body text-edn-navy focus:outline-none focus:border-edn-steel"
                  required
                />
                <button type="button" onClick={() => removeChild(i)}
                  className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
            <button type="button" onClick={addChild}
              className="flex items-center gap-1.5 text-edn-steel text-sm font-body hover:text-edn-navy transition-colors">
              <Plus size={15} /> Adicionar criança
            </button>
          </fieldset>

          {/* Barbecue */}
          <fieldset>
            <legend className="font-body font-semibold text-edn-navy text-sm mb-3">
              🍖 Vai participar do churrasco?
            </legend>
            <div className="grid grid-cols-2 gap-3">
              {[{ val: true, label: "Sim" }, { val: false, label: "Não" }].map(({ val, label }) => (
                <button key={String(val)} type="button" onClick={() => setJoinsBarbecue(val)}
                  className={`py-2.5 rounded-xl border-2 text-sm font-body transition-all ${
                    joinsBarbecue === val
                      ? "border-edn-navy bg-edn-navy text-white"
                      : "border-edn-mist text-edn-navy hover:border-edn-steel"
                  }`}>
                  {label}
                </button>
              ))}
            </div>
          </fieldset>

          {/* Alcohol */}
          <fieldset>
            <legend className="font-body font-semibold text-edn-navy text-sm mb-3">
              🍺 Vai consumir bebida alcoólica?
            </legend>
            <div className="grid grid-cols-2 gap-3">
              {[{ val: true, label: "Sim" }, { val: false, label: "Não" }].map(({ val, label }) => (
                <button key={String(val)} type="button" onClick={() => setDrinksAlcohol(val)}
                  className={`py-2.5 rounded-xl border-2 text-sm font-body transition-all ${
                    drinksAlcohol === val
                      ? "border-edn-navy bg-edn-navy text-white"
                      : "border-edn-mist text-edn-navy hover:border-edn-steel"
                  }`}>
                  {label}
                </button>
              ))}
            </div>
          </fieldset>

          {/* Drink preference */}
          {drinksAlcohol && (
            <fieldset>
              <legend className="font-body font-semibold text-edn-navy text-sm mb-3">
                Preferência de bebida
              </legend>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { val: "DRAFT_BEER", label: "🍺 Chopp" },
                  { val: "SPIRITS",   label: "🥃 Drinks" },
                  { val: "BOTH",      label: "🎉 Ambos" },
                ].map(({ val, label }) => (
                  <button key={val} type="button" onClick={() => setDrinkPref(val)}
                    className={`py-2.5 rounded-xl border-2 text-xs font-body transition-all ${
                      drinkPref === val
                        ? "border-edn-navy bg-edn-navy text-white"
                        : "border-edn-mist text-edn-navy hover:border-edn-steel"
                    }`}>
                    {label}
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          {/* Payment ref */}
          <fieldset>
            <legend className="font-body font-semibold text-edn-navy text-sm mb-2">
              Comprovante de pagamento
            </legend>
            <p className="text-edn-gray text-xs font-body mb-2">
              Após realizar o pagamento, cole aqui o código / referência do PIX ou outro método.
            </p>
            <input
              value={paymentRef}
              onChange={(e) => setPaymentRef(e.target.value)}
              placeholder="Ex: E000000000020260101123456789"
              className="w-full border border-edn-mist rounded-lg px-3 py-2.5 text-sm font-body text-edn-navy focus:outline-none focus:border-edn-steel"
            />
          </fieldset>
        </>
      )}

      {/* ── If NOT attending: nudge for video message ─────────── */}
      {isAttending === false && (
        <div className="bg-edn-cloud rounded-xl p-5 text-center space-y-2">
          <p className="font-body text-edn-navy text-sm font-medium">
            Que pena que não vai poder ir! 😢
          </p>
          <p className="text-edn-gray text-xs font-body">
            Que tal deixar uma mensagem em vídeo para a turma?
          </p>
          <a href="/messages" className="inline-block mt-1 text-edn-navy text-xs font-body font-semibold underline">
            Deixar mensagem em vídeo →
          </a>
        </div>
      )}

      {/* ── Error ──────────────────────────────────────────────── */}
      {error && (
        <p className="text-red-500 text-xs font-body bg-red-50 rounded-lg px-3 py-2">{error}</p>
      )}

      {/* ── Submit ─────────────────────────────────────────────── */}
      {saved && (
        <p className="text-green-600 text-sm font-body bg-green-50 rounded-lg px-3 py-2 text-center">
          ✅ Confirmação salva com sucesso!
        </p>
      )}

      {isAttending !== null && (
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-edn-navy text-white font-body font-semibold text-sm rounded-xl py-3.5 hover:bg-edn-navy-mid transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {loading && <Loader2 size={16} className="animate-spin" />}
          {loading ? "Salvando..." : "Confirmar"}
        </button>
      )}
    </form>
  );
}
