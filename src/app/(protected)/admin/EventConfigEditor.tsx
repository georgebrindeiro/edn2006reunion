"use client";

import { useState } from "react";
import { Loader2, Check, ChevronDown, ChevronUp, Plus, X } from "lucide-react";
import type { EventDetails } from "@/types";

function Field({
  label, value, onChange, type = "text", placeholder,
}: {
  label: string; value: string | number; onChange: (v: string) => void;
  type?: string; placeholder?: string;
}) {
  return (
    <div>
      <label className="text-xs text-edn-gray font-body font-medium block mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-edn-mist rounded-lg px-3 py-2 text-sm font-body text-edn-navy focus:outline-none focus:border-edn-steel"
      />
    </div>
  );
}

export function EventConfigEditor({ initialConfig }: { initialConfig: EventDetails }) {
  const [open,     setOpen]     = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [error,    setError]    = useState("");
  const [cfg,      setCfg]      = useState<EventDetails>(initialConfig);
  const [included, setIncluded] = useState<string[]>(initialConfig.whatsIncluded);
  const [newItem,  setNewItem]  = useState("");

  function set(field: keyof EventDetails) {
    return (v: string) => setCfg((prev) => ({ ...prev, [field]: v }));
  }
  function setNum(field: keyof EventDetails) {
    return (v: string) => setCfg((prev) => ({ ...prev, [field]: parseInt(v) || 0 }));
  }

  async function save() {
    setSaving(true); setError(""); setSaved(false);
    const res = await fetch("/api/admin/event-config", {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ ...cfg, whatsIncluded: included }),
    });
    setSaving(false);
    if (!res.ok) { setError("Erro ao salvar."); return; }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function addItem() {
    if (!newItem.trim()) return;
    setIncluded((prev) => [...prev, newItem.trim()]);
    setNewItem("");
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-6 text-left"
      >
        <div>
          <h2 className="font-display text-edn-navy text-lg font-semibold">Configurações do Evento</h2>
          <p className="text-xs text-edn-gray font-body mt-0.5">Data, local, preços, PIX</p>
        </div>
        {open
          ? <ChevronUp size={18} className="text-edn-steel flex-shrink-0" />
          : <ChevronDown size={18} className="text-edn-steel flex-shrink-0" />
        }
      </button>

      {open && (
        <div className="px-6 pb-6 border-t border-edn-mist pt-5 space-y-5">

          <div className="grid grid-cols-2 gap-4">
            <Field label="Data (YYYY-MM-DD)" value={cfg.date} onChange={set("date")} placeholder="2026-06-20" />
            <Field label="Horário"            value={cfg.time} onChange={set("time")} placeholder="12:00 - 20:00" />
          </div>

          <Field label="Nome do local"    value={cfg.venueName}    onChange={set("venueName")} />
          <Field label="Endereço"         value={cfg.venueAddress} onChange={set("venueAddress")} />
          <Field label="Cidade do evento" value={cfg.venueCity}    onChange={set("venueCity")} />
          <Field label="Link Google Maps" value={cfg.mapsUrl}      onChange={set("mapsUrl")} />

          <div className="grid grid-cols-3 gap-3">
            <Field label="Adulto (R$)"   value={cfg.costPerPerson}        onChange={setNum("costPerPerson")}        type="number" />
            <Field label="Reduzido (R$)" value={cfg.costPerPersonReduced} onChange={setNum("costPerPersonReduced")} type="number" />
            <Field label="Criança (R$)"  value={cfg.costPerChild}         onChange={setNum("costPerChild")}         type="number" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Chave PIX"                    value={cfg.pixKey}           onChange={set("pixKey")} />
            <Field label="Nome recebedor (sem acentos)" value={cfg.pixRecipientName} onChange={set("pixRecipientName")} placeholder="max 25 chars" />
          </div>
          <Field label="Cidade PIX (sem acentos, max 15)" value={cfg.pixCity} onChange={set("pixCity")} />

          {/* What's included */}
          <div>
            <label className="text-xs text-edn-gray font-body font-medium block mb-2">O que está incluso</label>
            <div className="space-y-2">
              {included.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="flex-1 text-sm font-body text-edn-navy bg-edn-cloud/40 rounded-lg px-3 py-1.5">
                    {item}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIncluded((prev) => prev.filter((_, idx) => idx !== i))}
                    className="text-edn-gray/40 hover:text-red-400 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
              <div className="flex gap-2">
                <input
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addItem(); } }}
                  placeholder="Adicionar item…"
                  className="flex-1 border border-edn-mist rounded-lg px-3 py-1.5 text-sm font-body text-edn-navy focus:outline-none focus:border-edn-steel"
                />
                <button
                  type="button"
                  onClick={addItem}
                  className="px-3 py-1.5 rounded-lg bg-edn-navy text-white hover:bg-edn-navy/90 transition-colors"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
          </div>

          {error && <p className="text-red-500 text-xs font-body">{error}</p>}

          <button
            onClick={save}
            disabled={saving}
            className="w-full py-2.5 rounded-xl bg-edn-navy text-white text-sm font-body font-semibold disabled:opacity-60 flex items-center justify-center gap-2 transition-colors hover:bg-edn-navy/90"
          >
            {saving
              ? <Loader2 size={14} className="animate-spin" />
              : saved
                ? <Check size={14} />
                : null
            }
            {saved ? "Salvo!" : "Salvar configurações"}
          </button>
        </div>
      )}
    </div>
  );
}
