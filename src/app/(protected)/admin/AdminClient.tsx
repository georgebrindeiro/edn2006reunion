"use client";

import { Download } from "lucide-react";

interface Stats {
  total: number; attending: number; notGoing: number; noRsvp: number;
  barbecue: number; alcohol: number; adults: number; children: number;
}

interface UserRow {
  id: string; fullName?: string; email?: string; phone?: string;
  city?: string; country?: string;
  rsvp?: { isAttending: boolean; joinsBarbecue: boolean; drinksAlcohol: boolean;
            drinkPreference?: string; paymentRef?: string;
            guestAdults: { fullName: string }[];
            guestChildren: { fullName: string; age?: number }[]; };
}

export function AdminClient({
  stats, users,
}: { stats: Stats; users: UserRow[] }) {
  function downloadCsv() {
    const rows = [
      ["Nome", "Telefone", "Email", "Cidade", "País", "Vai", "Churrasco", "Bebe", "Bebida", "Adultos", "Crianças", "PIX ref"],
      ...users.map((u) => [
        u.fullName ?? "",
        u.phone ?? "",
        u.email ?? "",
        u.city ?? "",
        u.country ?? "",
        u.rsvp ? (u.rsvp.isAttending ? "Sim" : "Não") : "—",
        u.rsvp?.joinsBarbecue ? "Sim" : "Não",
        u.rsvp?.drinksAlcohol ? "Sim" : "Não",
        u.rsvp?.drinkPreference ?? "",
        u.rsvp?.guestAdults.map((g) => g.fullName).join(" | ") ?? "",
        u.rsvp?.guestChildren.map((g) => `${g.fullName} (${g.age ?? "?"}a)`).join(" | ") ?? "",
        u.rsvp?.paymentRef ?? "",
      ]),
    ];
    const csv = rows.map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a"); a.href = url; a.download = "edn-rsvp.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  const STAT_CARDS = [
    { label: "Cadastrados",    value: stats.total,     color: "bg-edn-navy" },
    { label: "Vão",            value: stats.attending,  color: "bg-green-600" },
    { label: "Não vão",        value: stats.notGoing,   color: "bg-red-500" },
    { label: "Sem confirmação",value: stats.noRsvp,     color: "bg-yellow-500" },
    { label: "Churrasco",      value: stats.barbecue,   color: "bg-orange-500" },
    { label: "Bebem álcool",   value: stats.alcohol,    color: "bg-purple-600" },
    { label: "Adultos convid.", value: stats.adults,    color: "bg-edn-steel" },
    { label: "Crianças",       value: stats.children,   color: "bg-pink-500" },
  ];

  return (
    <div className="space-y-8">

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {STAT_CARDS.map((s) => (
          <div key={s.label} className={`${s.color} rounded-xl p-4 text-white`}>
            <p className="font-display text-3xl font-bold">{s.value}</p>
            <p className="font-body text-xs mt-0.5 text-white/80">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Users table */}
      <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-edn-navy text-lg font-semibold">
            Confirmações ({users.length})
          </h2>
          <button onClick={downloadCsv}
            className="flex items-center gap-1.5 text-edn-steel text-xs font-body font-semibold hover:text-edn-navy transition-colors">
            <Download size={14} /> Exportar CSV
          </button>
        </div>

        <div className="overflow-x-auto -mx-2">
          <table className="w-full text-sm font-body min-w-[640px]">
            <thead>
              <tr className="border-b border-edn-mist text-left">
                <th className="pb-2 px-2 text-xs text-edn-gray font-medium uppercase tracking-wide">Nome</th>
                <th className="pb-2 px-2 text-xs text-edn-gray font-medium uppercase tracking-wide">Cidade</th>
                <th className="pb-2 px-2 text-xs text-edn-gray font-medium uppercase tracking-wide">Confirmação</th>
                <th className="pb-2 px-2 text-xs text-edn-gray font-medium uppercase tracking-wide">Convidados</th>
                <th className="pb-2 px-2 text-xs text-edn-gray font-medium uppercase tracking-wide">Pagamento</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-edn-cloud hover:bg-edn-cloud/50">
                  <td className="py-2.5 px-2">
                    <p className="font-medium text-edn-navy text-sm">{u.fullName ?? "—"}</p>
                    <p className="text-edn-gray text-xs">{u.phone ?? u.email ?? "—"}</p>
                  </td>
                  <td className="py-2.5 px-2 text-edn-gray text-xs">
                    {u.city ? `${u.city}, ${u.country}` : "—"}
                  </td>
                  <td className="py-2.5 px-2">
                    {!u.rsvp ? (
                      <span className="text-xs text-yellow-600 bg-yellow-50 rounded-full px-2 py-0.5">Pendente</span>
                    ) : u.rsvp.isAttending ? (
                      <span className="text-xs text-green-700 bg-green-50 rounded-full px-2 py-0.5">✅ Vai</span>
                    ) : (
                      <span className="text-xs text-red-600 bg-red-50 rounded-full px-2 py-0.5">❌ Não vai</span>
                    )}
                    {u.rsvp?.joinsBarbecue && (
                      <span className="ml-1 text-xs text-orange-600 bg-orange-50 rounded-full px-2 py-0.5">🍖</span>
                    )}
                    {u.rsvp?.drinksAlcohol && (
                      <span className="ml-1 text-xs text-purple-600 bg-purple-50 rounded-full px-2 py-0.5">🍺</span>
                    )}
                  </td>
                  <td className="py-2.5 px-2 text-edn-gray text-xs">
                    {u.rsvp ? (
                      <>
                        {u.rsvp.guestAdults.length > 0 && (
                          <p>{u.rsvp.guestAdults.length} adulto(s)</p>
                        )}
                        {u.rsvp.guestChildren.length > 0 && (
                          <p>{u.rsvp.guestChildren.length} criança(s)</p>
                        )}
                        {u.rsvp.guestAdults.length === 0 && u.rsvp.guestChildren.length === 0 && "Sozinho"}
                      </>
                    ) : "—"}
                  </td>
                  <td className="py-2.5 px-2">
                    {u.rsvp?.paymentRef ? (
                      <span className="text-xs text-green-700 bg-green-50 rounded-full px-2 py-0.5">✅ Pago</span>
                    ) : (
                      <span className="text-xs text-edn-gray">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
