"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2, Upload, CheckCircle2, Copy, Check } from "lucide-react";
import { useUploadThing } from "@/lib/uploadthing-client";
import { EVENT } from "@/lib/constants";
import { generatePixPayload } from "@/lib/pix";
import type { FoodPreference, DrinkPreference } from "@/types";
import QRCode from "qrcode";

type Food  = FoodPreference;
type Drink = DrinkPreference;

interface Guest {
  fullName:        string;
  age?:            number;
  foodPreference:  Food;
  drinkPreference: Drink;
}

interface ExistingRsvp {
  isAttending:     boolean;
  foodPreference:  string;
  drinkPreference: string;
  guestAdults:     Guest[];
  guestChildren:   Guest[];
  paymentProofUrl?: string;
}

const FOOD_OPTIONS: { val: Food; label: string }[] = [
  { val: "BARBECUE",   label: "🍖 Churrasco" },
  { val: "VEGETARIAN", label: "🥗 Vegetariano" },
  { val: "NO_FOOD",    label: "🚫 Sem almoço" },
];

const DRINK_OPTIONS: { val: Drink; label: string }[] = [
  { val: "CHOPP",         label: "🍺 Chopp" },
  { val: "NON_ALCOHOLIC", label: "🥤 Sem álcool" },
  { val: "OWN_DRINKS",    label: "🧃 Trarei minha bebida" },
];

function FoodToggle({ value, onChange }: { value: Food; onChange: (v: Food) => void }) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {FOOD_OPTIONS.map(({ val, label }) => (
        <button
          key={val}
          type="button"
          onClick={() => onChange(val)}
          className={`px-3 py-1.5 rounded-lg border text-xs font-body transition-all ${
            value === val
              ? "border-edn-navy bg-edn-navy text-white"
              : "border-edn-mist text-edn-navy hover:border-edn-steel"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function DrinkToggle({ value, onChange }: { value: Drink; onChange: (v: Drink) => void }) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {DRINK_OPTIONS.map(({ val, label }) => (
        <button
          key={val}
          type="button"
          onClick={() => onChange(val)}
          className={`px-3 py-1.5 rounded-lg border text-xs font-body transition-all ${
            value === val
              ? "border-edn-navy bg-edn-navy text-white"
              : "border-edn-mist text-edn-navy hover:border-edn-steel"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export function RsvpForm({ existingRsvp }: { existingRsvp?: ExistingRsvp }) {
  const router = useRouter();
  const r = existingRsvp;

  const [isAttending,  setIsAttending]  = useState<boolean | null>(r ? r.isAttending : null);
  const [foodPref,     setFoodPref]     = useState<Food>((r?.foodPreference as Food)  ?? "BARBECUE");
  const [drinkPref,    setDrinkPref]    = useState<Drink>((r?.drinkPreference as Drink) ?? "NON_ALCOHOLIC");
  const [adults,       setAdults]       = useState<Guest[]>(r?.guestAdults   ?? []);
  const [children,     setChildren]     = useState<Guest[]>(r?.guestChildren ?? []);
  const [proofUrl,     setProofUrl]     = useState(r?.paymentProofUrl ?? "");
  const [qrDataUrl,    setQrDataUrl]    = useState("");
  const [pixPayload,   setPixPayload]   = useState("");
  const [copied,       setCopied]       = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [saved,        setSaved]        = useState(false);
  const [error,        setError]        = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { startUpload, isUploading } = useUploadThing("paymentProof");

  function adultCost(food: Food, drink: Drink): number {
    return food === "NO_FOOD" && drink === "OWN_DRINKS"
      ? EVENT.costPerPersonReduced
      : EVENT.costPerPerson;
  }

  const lineItems: { label: string; amount: number }[] =
    isAttending === true
      ? [
          { label: "Você", amount: adultCost(foodPref, drinkPref) },
          ...adults.map((a) => ({
            label:  a.fullName || "Convidado",
            amount: adultCost(a.foodPreference, a.drinkPreference),
          })),
          ...children.map((c) => ({
            label:  c.fullName || "Criança",
            amount: EVENT.costPerChild,
          })),
        ]
      : [];

  const total = lineItems.reduce((sum, li) => sum + li.amount, 0);

  // People counts for PIX description (no double-counting)
  const allAdults = isAttending === true
    ? [
        { food: foodPref, drink: drinkPref },
        ...adults.map((a) => ({ food: a.foodPreference, drink: a.drinkPreference })),
      ]
    : [];
  const reducedCount = allAdults.filter((p) => p.food === "NO_FOOD" && p.drink === "OWN_DRINKS").length;
  const adultCount   = allAdults.length - reducedCount; // full-price adults only
  const childCount   = children.length;

  const paymentDescription = isAttending === true
    ? "EDN 2006 Reunion - " + [
        adultCount   > 0 ? `${adultCount} adult`          : null,
        childCount   > 0 ? `${childCount} child`           : null,
        reducedCount > 0 ? `${reducedCount} reduced`        : null,
      ].filter(Boolean).join(" / ")
    : "";

  useEffect(() => {
    if (!EVENT.pixKey || total === 0 || isAttending !== true) {
      setQrDataUrl("");
      setPixPayload("");
      return;
    }
    const payload = generatePixPayload(EVENT.pixKey, EVENT.pixRecipientName, EVENT.pixCity, total, paymentDescription);
    setPixPayload(payload);
    QRCode.toDataURL(payload, { width: 220, margin: 2 })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(""));
  }, [total, isAttending]);

  function addAdult() {
    setAdults([...adults, { fullName: "", foodPreference: "BARBECUE", drinkPreference: "NON_ALCOHOLIC" }]);
  }
  function addChild() {
    setChildren([...children, { fullName: "", age: undefined, foodPreference: "BARBECUE", drinkPreference: "NON_ALCOHOLIC" }]);
  }
  function removeAdult(i: number) { setAdults(adults.filter((_, idx) => idx !== i)); }
  function removeChild(i: number) { setChildren(children.filter((_, idx) => idx !== i)); }

  function updateAdult<K extends keyof Guest>(i: number, field: K, val: Guest[K]) {
    setAdults(adults.map((a, idx) => idx === i ? { ...a, [field]: val } : a));
  }
  function updateChild<K extends keyof Guest>(i: number, field: K, val: Guest[K]) {
    setChildren(children.map((c, idx) => idx === i ? { ...c, [field]: val } : c));
  }

  function copyPixCode() {
    navigator.clipboard.writeText(pixPayload).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  async function handleProofUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const res = await startUpload([file]);
    if (res?.[0]?.url) setProofUrl(res[0].url);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isAttending === null) {
      setError("Por favor, confirme se você vai comparecer.");
      return;
    }
    setLoading(true);
    setError("");

    const res = await fetch("/api/rsvp", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        isAttending,
        foodPreference:  foodPref,
        drinkPreference: drinkPref,
        guestAdults:     adults,
        guestChildren:   children,
        paymentProofUrl: proofUrl || null,
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

      {/* ── Attending? ─────────────────────────────────────────────── */}
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

      {/* ── If attending ───────────────────────────────────────────── */}
      {isAttending === true && (
        <>
          {/* Your preferences */}
          <div className="bg-edn-cloud/50 rounded-xl p-4 space-y-4">
            <p className="font-body font-semibold text-edn-navy text-sm">Suas preferências</p>

            <div>
              <p className="text-xs font-body text-edn-gray mb-2">Comida</p>
              <FoodToggle value={foodPref} onChange={setFoodPref} />
            </div>

            <div>
              <p className="text-xs font-body text-edn-gray mb-2">Bebida</p>
              <DrinkToggle value={drinkPref} onChange={setDrinkPref} />
            </div>
          </div>

          {/* Adult guests */}
          <fieldset className="space-y-3">
            <legend className="font-body font-semibold text-edn-navy text-sm">
              Convidados adultos
            </legend>
            <p className="text-edn-gray text-xs font-body">
              Não inclua seu próprio nome. Adicione um convidado por linha.
            </p>
            {adults.map((a, i) => (
              <div key={i} className="border border-edn-mist rounded-xl p-3 space-y-3">
                <div className="flex gap-2">
                  <input
                    value={a.fullName}
                    onChange={(e) => updateAdult(i, "fullName", e.target.value)}
                    placeholder={`Nome completo do adulto ${i + 1}`}
                    required
                    className="flex-1 border border-edn-mist rounded-lg px-3 py-2.5 text-sm font-body text-edn-navy focus:outline-none focus:border-edn-steel"
                  />
                  <button
                    type="button"
                    onClick={() => removeAdult(i)}
                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
                <div className="grid gap-2">
                  <div>
                    <p className="text-xs font-body text-edn-gray mb-1.5">Comida</p>
                    <FoodToggle value={a.foodPreference} onChange={(v) => updateAdult(i, "foodPreference", v)} />
                  </div>
                  <div>
                    <p className="text-xs font-body text-edn-gray mb-1.5">Bebida</p>
                    <DrinkToggle value={a.drinkPreference} onChange={(v) => updateAdult(i, "drinkPreference", v)} />
                  </div>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={addAdult}
              className="flex items-center gap-1.5 text-edn-steel text-sm font-body hover:text-edn-navy transition-colors"
            >
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
              <div key={i} className="border border-edn-mist rounded-xl p-3 space-y-3">
                <div className="flex gap-2">
                  <input
                    value={c.fullName}
                    onChange={(e) => updateChild(i, "fullName", e.target.value)}
                    placeholder={`Nome completo da criança ${i + 1}`}
                    required
                    className="flex-1 border border-edn-mist rounded-lg px-3 py-2.5 text-sm font-body text-edn-navy focus:outline-none focus:border-edn-steel"
                  />
                  <input
                    type="number"
                    min="0"
                    max="17"
                    value={c.age ?? ""}
                    onChange={(e) => updateChild(i, "age", parseInt(e.target.value) || undefined)}
                    placeholder="Idade"
                    required
                    className="w-20 border border-edn-mist rounded-lg px-3 py-2.5 text-sm font-body text-edn-navy focus:outline-none focus:border-edn-steel"
                  />
                  <button
                    type="button"
                    onClick={() => removeChild(i)}
                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
                <div>
                  <p className="text-xs font-body text-edn-gray mb-1.5">Comida</p>
                  <FoodToggle value={c.foodPreference} onChange={(v) => updateChild(i, "foodPreference", v)} />
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={addChild}
              className="flex items-center gap-1.5 text-edn-steel text-sm font-body hover:text-edn-navy transition-colors"
            >
              <Plus size={15} /> Adicionar criança
            </button>
          </fieldset>

          {/* Total + Payment */}
          <div className="bg-edn-navy rounded-2xl p-5 space-y-4">
            <div>
              <p className="text-edn-steel-lt text-xs font-body uppercase tracking-widest mb-1">
                Total a pagar
              </p>
              <p className="font-display text-white text-3xl font-bold">
                R$ {total.toFixed(2).replace(".", ",")}
              </p>
              <div className="mt-2 space-y-0.5">
                {lineItems.map((li, i) => (
                  <div key={i} className="flex justify-between text-xs font-body">
                    <span className="text-edn-mist/70">{li.label}</span>
                    <span className={li.amount === EVENT.costPerPersonReduced ? "text-edn-steel-lt" : "text-edn-mist/70"}>
                      R$ {li.amount}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {qrDataUrl && (
              <div className="flex flex-col items-center gap-3">
                <p className="text-edn-mist/80 text-xs font-body">
                  Escaneie o QR code abaixo para pagar via PIX
                </p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrDataUrl} alt="PIX QR Code" className="w-48 h-48 rounded-xl bg-white p-2" />

                {/* Copyable PIX code for mobile */}
                <div className="w-full">
                  <p className="text-edn-mist/60 text-xs font-body text-center mb-2">
                    Ou copie o código PIX:
                  </p>
                  <div className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2.5">
                    <p className="flex-1 text-edn-mist text-xs font-mono break-all leading-relaxed">
                      {pixPayload}
                    </p>
                    <button
                      type="button"
                      onClick={copyPixCode}
                      className="shrink-0 p-1.5 rounded-lg hover:bg-white/10 transition-colors text-edn-steel-lt hover:text-white"
                      title="Copiar código PIX"
                    >
                      {copied ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {!qrDataUrl && EVENT.pixKey && (
              <div className="text-center">
                <p className="text-edn-mist/60 text-xs font-body">Chave PIX:</p>
                <p className="text-edn-mist text-sm font-body font-medium break-all">{EVENT.pixKey}</p>
              </div>
            )}
          </div>

          {/* Payment proof upload */}
          <fieldset>
            <legend className="font-body font-semibold text-edn-navy text-sm mb-2">
              Comprovante de pagamento
            </legend>
            <p className="text-edn-gray text-xs font-body mb-3">
              Após realizar o PIX, envie o comprovante aqui (imagem ou PDF).
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf"
              onChange={handleProofUpload}
              className="hidden"
            />

            {proofUrl ? (
              <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-xl">
                <CheckCircle2 size={18} className="text-green-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-green-700 text-xs font-body font-medium">Comprovante enviado</p>
                  <a
                    href={proofUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-600 text-xs font-body underline truncate block"
                  >
                    Ver comprovante →
                  </a>
                </div>
                <button
                  type="button"
                  onClick={() => { setProofUrl(""); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                  className="text-green-600 hover:text-red-500 text-xs font-body transition-colors shrink-0"
                >
                  Trocar
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-edn-mist rounded-xl text-sm font-body text-edn-steel hover:border-edn-navy hover:text-edn-navy transition-colors disabled:opacity-60 w-full justify-center"
              >
                {isUploading ? (
                  <><Loader2 size={15} className="animate-spin" /> Enviando...</>
                ) : (
                  <><Upload size={15} /> Upload do comprovante</>
                )}
              </button>
            )}
          </fieldset>
        </>
      )}

      {/* ── If NOT attending ──────────────────────────────────────── */}
      {isAttending === false && (
        <div className="bg-edn-cloud rounded-xl p-5 text-center space-y-2">
          <p className="font-body text-edn-navy text-sm font-medium">
            Que pena que não vai poder ir! 😢
          </p>
          <p className="text-edn-gray text-xs font-body">
            Que tal deixar uma mensagem em vídeo para a turma?
          </p>
          <a
            href="/messages"
            className="inline-block mt-1 text-edn-navy text-xs font-body font-semibold underline"
          >
            Deixar mensagem em vídeo →
          </a>
        </div>
      )}

      {/* ── Error ────────────────────────────────────────────────── */}
      {error && (
        <p className="text-red-500 text-xs font-body bg-red-50 rounded-lg px-3 py-2">{error}</p>
      )}

      {/* ── Success ──────────────────────────────────────────────── */}
      {saved && (
        <p className="text-green-600 text-sm font-body bg-green-50 rounded-lg px-3 py-2 text-center">
          ✅ Confirmação salva com sucesso!
        </p>
      )}

      {/* ── Submit ───────────────────────────────────────────────── */}
      {isAttending !== null && (
        <button
          type="submit"
          disabled={loading || isUploading}
          className="w-full bg-edn-navy text-white font-body font-semibold text-sm rounded-xl py-3.5 hover:bg-edn-navy-mid transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {loading && <Loader2 size={16} className="animate-spin" />}
          {loading ? "Salvando..." : "Confirmar"}
        </button>
      )}
    </form>
  );
}
