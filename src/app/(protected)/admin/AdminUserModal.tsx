"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Loader2, ExternalLink, Upload } from "lucide-react";
import { useUploadThing } from "@/lib/uploadthing-client";

const FOOD_LABEL: Record<string, string> = {
  BARBECUE: "🍖 Churrasco", VEGETARIAN: "🥗 Vegetariano", NO_FOOD: "🚫 Sem almoço",
};
const DRINK_LABEL: Record<string, string> = {
  CHOPP: "🍺 Chopp", NON_ALCOHOLIC: "🥤 Sem álcool", OWN_DRINKS: "🧃 Bebida própria",
};

interface GuestRow { fullName: string; age?: number; foodPreference: string; drinkPreference: string }

interface Metrics { photos: number; quotes: number; stories: number; videoMessages: number; taggedIn: number }

export interface AdminUserRow {
  id: string;
  fullName?: string | null;
  email?: string | null;
  phone?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  rsvp?: {
    isAttending: boolean;
    foodPreference: string;
    drinkPreference: string;
    paymentConfirmed: boolean;
    paymentProofUrl?: string | null;
    guestAdults: GuestRow[];
    guestChildren: GuestRow[];
  } | null;
  metrics: Metrics;
}

function LabelField({
  label, value, onChange, type = "text",
}: {
  label: string; value: string; onChange: (v: string) => void; type?: string;
}) {
  return (
    <div>
      <label className="text-xs text-edn-gray font-body font-medium block mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-edn-mist rounded-lg px-3 py-2 text-sm font-body text-edn-navy focus:outline-none focus:border-edn-steel"
      />
    </div>
  );
}

export function AdminUserModal({ user, onClose }: { user: AdminUserRow; onClose: () => void }) {
  const router = useRouter();
  const [tab, setTab] = useState<"profile" | "rsvp" | "payment">("profile");

  const [fullName, setFullName] = useState(user.fullName ?? "");
  const [email,    setEmail]    = useState(user.email    ?? "");
  const [phone,    setPhone]    = useState(user.phone    ?? "");
  const [city,     setCity]     = useState(user.city     ?? "");
  const [state,    setState]    = useState(user.state    ?? "");
  const [country,  setCountry]  = useState(user.country  ?? "");

  const [isAttending,  setIsAttending]  = useState<boolean | null>(user.rsvp ? user.rsvp.isAttending : null);
  const [foodPref,     setFoodPref]     = useState(user.rsvp?.foodPreference  ?? "BARBECUE");
  const [drinkPref,    setDrinkPref]    = useState(user.rsvp?.drinkPreference ?? "NON_ALCOHOLIC");

  const [proofUrl,         setProofUrl]         = useState(user.rsvp?.paymentProofUrl ?? "");
  const [paymentConfirmed, setPaymentConfirmed] = useState(user.rsvp?.paymentConfirmed ?? false);

  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  const { startUpload, isUploading } = useUploadThing("paymentProof");

  async function saveProfile() {
    setSaving(true); setError("");
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ fullName, email, phone, city, state, country }),
    });
    setSaving(false);
    if (!res.ok) { setError("Erro ao salvar."); return; }
    router.refresh();
    onClose();
  }

  async function saveRsvp() {
    if (isAttending === null) { setError("Selecione o status de confirmação."); return; }
    setSaving(true); setError("");
    const res = await fetch(`/api/admin/rsvp/${user.id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ isAttending, foodPreference: foodPref, drinkPreference: drinkPref }),
    });
    setSaving(false);
    if (!res.ok) { setError("Erro ao salvar."); return; }
    router.refresh();
    onClose();
  }

  async function savePayment() {
    setSaving(true); setError("");
    const res = await fetch(`/api/admin/rsvp/${user.id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ paymentConfirmed, paymentProofUrl: proofUrl || null }),
    });
    setSaving(false);
    if (!res.ok) { setError("Erro ao salvar."); return; }
    router.refresh();
    onClose();
  }

  async function handleUploadProof(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const res = await startUpload([file]);
    const url = res?.[0]?.ufsUrl ?? (res?.[0] as any)?.url ?? null;
    if (url) setProofUrl(url);
  }

  const TABS = [
    { key: "profile" as const, label: "Perfil"      },
    { key: "rsvp"    as const, label: "RSVP"        },
    { key: "payment" as const, label: "Pagamento"   },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-edn-mist">
          <div>
            <p className="font-display text-edn-navy font-semibold">{user.fullName ?? "—"}</p>
            <p className="text-xs text-edn-gray font-body">{user.email ?? user.phone ?? ""}</p>
          </div>
          <button onClick={onClose} className="text-edn-gray/50 hover:text-edn-gray"><X size={20} /></button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-edn-mist">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => { setTab(key); setError(""); }}
              className={`flex-1 py-2.5 text-xs font-body font-semibold transition-colors ${
                tab === key
                  ? "text-edn-navy border-b-2 border-edn-navy"
                  : "text-edn-gray hover:text-edn-navy"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="p-5 space-y-4">

          {/* ── Profile ──────────────────────────────────────────────── */}
          {tab === "profile" && (
            <>
              <LabelField label="Nome completo" value={fullName} onChange={setFullName} />
              <LabelField label="Email" value={email} onChange={setEmail} type="email" />
              <LabelField label="Telefone" value={phone} onChange={setPhone} type="tel" />
              <div className="grid grid-cols-2 gap-3">
                <LabelField label="Cidade" value={city}    onChange={setCity}    />
                <LabelField label="Estado" value={state}   onChange={setState}   />
              </div>
              <LabelField label="País" value={country} onChange={setCountry} />

              {/* Metrics */}
              <div className="bg-edn-cloud/40 rounded-xl p-3 grid grid-cols-5 gap-2 text-center">
                {([
                  { label: "Fotos",    value: user.metrics.photos        },
                  { label: "Citações", value: user.metrics.quotes        },
                  { label: "Histórias",value: user.metrics.stories       },
                  { label: "Vídeo",    value: user.metrics.videoMessages },
                  { label: "Tags",     value: user.metrics.taggedIn      },
                ] as const).map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-lg font-display font-bold text-edn-navy">{value}</p>
                    <p className="text-[10px] text-edn-gray font-body">{label}</p>
                  </div>
                ))}
              </div>

              {error && <p className="text-red-500 text-xs">{error}</p>}
              <button
                onClick={saveProfile}
                disabled={saving}
                className="w-full py-2.5 rounded-xl bg-edn-navy text-white text-sm font-body font-semibold disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {saving && <Loader2 size={14} className="animate-spin" />}
                Salvar perfil
              </button>
            </>
          )}

          {/* ── RSVP ─────────────────────────────────────────────────── */}
          {tab === "rsvp" && (
            <>
              {!user.rsvp ? (
                <p className="text-xs text-edn-gray font-body text-center py-4">Este usuário não tem RSVP ainda.</p>
              ) : (
                <>
                  <div>
                    <label className="text-xs text-edn-gray font-body font-medium block mb-2">Confirmação</label>
                    <div className="flex gap-2">
                      {([true, false] as const).map((val) => (
                        <button
                          key={String(val)}
                          type="button"
                          onClick={() => setIsAttending(val)}
                          className={`flex-1 py-2 rounded-lg border text-sm font-body transition-all ${
                            isAttending === val
                              ? "border-edn-navy bg-edn-navy text-white"
                              : "border-edn-mist text-edn-navy hover:border-edn-steel"
                          }`}
                        >
                          {val ? "✅ Vai" : "❌ Não vai"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {isAttending === true && (
                    <>
                      <div>
                        <label className="text-xs text-edn-gray font-body font-medium block mb-2">Comida</label>
                        <div className="flex gap-2 flex-wrap">
                          {["BARBECUE", "VEGETARIAN", "NO_FOOD"].map((val) => (
                            <button
                              key={val}
                              type="button"
                              onClick={() => setFoodPref(val)}
                              className={`px-3 py-1.5 rounded-lg border text-xs font-body transition-all ${
                                foodPref === val
                                  ? "border-edn-navy bg-edn-navy text-white"
                                  : "border-edn-mist text-edn-navy hover:border-edn-steel"
                              }`}
                            >
                              {FOOD_LABEL[val]}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="text-xs text-edn-gray font-body font-medium block mb-2">Bebida</label>
                        <div className="flex gap-2 flex-wrap">
                          {["CHOPP", "NON_ALCOHOLIC", "OWN_DRINKS"].map((val) => (
                            <button
                              key={val}
                              type="button"
                              onClick={() => setDrinkPref(val)}
                              className={`px-3 py-1.5 rounded-lg border text-xs font-body transition-all ${
                                drinkPref === val
                                  ? "border-edn-navy bg-edn-navy text-white"
                                  : "border-edn-mist text-edn-navy hover:border-edn-steel"
                              }`}
                            >
                              {DRINK_LABEL[val]}
                            </button>
                          ))}
                        </div>
                      </div>

                      {(user.rsvp.guestAdults.length > 0 || user.rsvp.guestChildren.length > 0) && (
                        <div className="bg-edn-cloud/40 rounded-xl p-3 space-y-1.5">
                          <p className="text-xs text-edn-gray font-body font-medium mb-2">Convidados</p>
                          {user.rsvp.guestAdults.map((g, i) => (
                            <p key={i} className="text-xs font-body text-edn-navy">
                              👤 {g.fullName} · {FOOD_LABEL[g.foodPreference]} · {DRINK_LABEL[g.drinkPreference]}
                            </p>
                          ))}
                          {user.rsvp.guestChildren.map((g, i) => (
                            <p key={i} className="text-xs font-body text-edn-navy">
                              👶 {g.fullName} ({g.age}a) · {FOOD_LABEL[g.foodPreference]}
                            </p>
                          ))}
                        </div>
                      )}
                    </>
                  )}

                  {error && <p className="text-red-500 text-xs">{error}</p>}
                  <button
                    onClick={saveRsvp}
                    disabled={saving}
                    className="w-full py-2.5 rounded-xl bg-edn-navy text-white text-sm font-body font-semibold disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {saving && <Loader2 size={14} className="animate-spin" />}
                    Salvar RSVP
                  </button>
                </>
              )}
            </>
          )}

          {/* ── Payment ──────────────────────────────────────────────── */}
          {tab === "payment" && (
            <>
              {!user.rsvp ? (
                <p className="text-xs text-edn-gray font-body text-center py-4">Sem RSVP.</p>
              ) : (
                <>
                  {proofUrl && (
                    <div className="space-y-1">
                      <p className="text-xs text-edn-gray font-body font-medium">Comprovante atual</p>
                      <a
                        href={proofUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-edn-navy font-body underline"
                      >
                        <ExternalLink size={12} /> Ver comprovante
                      </a>
                    </div>
                  )}

                  <div>
                    <p className="text-xs text-edn-gray font-body font-medium mb-2">
                      {proofUrl ? "Substituir comprovante" : "Upload de comprovante"}
                    </p>
                    <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-edn-mist hover:border-edn-navy cursor-pointer text-xs font-body text-edn-navy transition-colors">
                      <Upload size={14} />
                      {isUploading ? "Enviando…" : "Escolher arquivo"}
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        className="hidden"
                        onChange={handleUploadProof}
                        disabled={isUploading}
                      />
                    </label>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentConfirmed(!paymentConfirmed)}
                      className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0 ${
                        paymentConfirmed ? "bg-green-500" : "bg-edn-mist"
                      }`}
                    >
                      <span
                        className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${
                          paymentConfirmed ? "left-5" : "left-1"
                        }`}
                      />
                    </button>
                    <span className="text-sm font-body text-edn-navy">Pagamento confirmado</span>
                  </div>

                  {error && <p className="text-red-500 text-xs">{error}</p>}
                  <button
                    onClick={savePayment}
                    disabled={saving || isUploading}
                    className="w-full py-2.5 rounded-xl bg-edn-navy text-white text-sm font-body font-semibold disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {saving && <Loader2 size={14} className="animate-spin" />}
                    Salvar pagamento
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
