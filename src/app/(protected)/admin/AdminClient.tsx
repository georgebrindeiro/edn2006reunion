"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Pencil, FolderOpen, Activity, Image as ImageIcon, Video, Trash2, RotateCcw, ChevronDown, ChevronUp, Loader2, Users, Baby, Clock, XCircle, CheckCircle2, TrendingUp, Banknote } from "lucide-react";
import { AdminUserModal, type AdminUserRow } from "./AdminUserModal";
import { AdminPhotosPanel } from "./AdminPhotosPanel";
import { AdminVideoPanel } from "./AdminVideoPanel";
import { ActivityLogPanel } from "./ActivityLogPanel";
import { UserContentModal } from "./UserContentModal";
import type { EventDetails } from "@/types";

const FOOD_LABEL: Record<string, string> = {
  BARBECUE:   "Churrasco",
  VEGETARIAN: "Vegetariano",
  NO_FOOD:    "Sem almoço",
};
const DRINK_LABEL: Record<string, string> = {
  CHOPP:         "Chopp",
  NON_ALCOHOLIC: "Sem álcool",
  OWN_DRINKS:    "Traz bebida",
};

type Tab = "users" | "photos" | "videos" | "logs";

const METRIC_COLORS = {
  green: { card: "bg-green-50 border-green-200", number: "text-green-700", icon: "bg-green-100 text-green-600" },
  amber: { card: "bg-amber-50 border-amber-200", number: "text-amber-700", icon: "bg-amber-100 text-amber-600" },
  red:   { card: "bg-red-50 border-red-200",     number: "text-red-700",   icon: "bg-red-100 text-red-600"    },
  blue:  { card: "bg-blue-50 border-blue-200",   number: "text-blue-700",  icon: "bg-blue-100 text-blue-600"  },
};

export function AdminClient({ users, deletedUsers, eventConfig }: { users: AdminUserRow[]; deletedUsers: AdminUserRow[]; eventConfig: Pick<EventDetails, "costPerPerson" | "costPerPersonReduced" | "costPerChild"> }) {
  const router = useRouter();
  const [tab,              setTab]              = useState<Tab>("users");
  const [editUser,         setEditUser]         = useState<AdminUserRow | null>(null);
  const [contentUser,      setContentUser]      = useState<AdminUserRow | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null);
  const [deletingId,       setDeletingId]       = useState<string | null>(null);
  const [restoringId,      setRestoringId]      = useState<string | null>(null);
  const [showDeleted,      setShowDeleted]      = useState(false);

  const userOptions = users.map((u) => ({ id: u.id, fullName: u.fullName ?? null }));

  // ── RSVP metrics ────────────────────────────────────────────────────────────
  const attending    = users.filter((u) => u.rsvp?.isAttending === true);
  const confirmedCnt = attending.length;
  const noRsvpCnt    = users.filter((u) => !u.rsvp).length;
  const notGoingCnt  = users.filter((u) => u.rsvp && !u.rsvp.isAttending).length;

  const confirmedAdults = attending.reduce((sum, u) => sum + 1 + (u.rsvp?.guestAdults.length ?? 0), 0);
  const confirmedKids   = attending.reduce((sum, u) => sum + (u.rsvp?.guestChildren.length ?? 0), 0);

  const isReduced = (p: { foodPreference: string; drinkPreference: string }) =>
    p.foodPreference === "NO_FOOD" && p.drinkPreference === "OWN_DRINKS";

  function calcRevenue(subset: typeof attending): number {
    let total = 0;
    for (const u of subset) {
      if (!u.rsvp) continue;
      total += isReduced(u.rsvp) ? eventConfig.costPerPersonReduced : eventConfig.costPerPerson;
      for (const g of u.rsvp.guestAdults)
        total += isReduced(g) ? eventConfig.costPerPersonReduced : eventConfig.costPerPerson;
      total += u.rsvp.guestChildren.length * eventConfig.costPerChild;
    }
    return total;
  }

  const expectedRevenue  = calcRevenue(attending);
  const confirmedRevenue = calcRevenue(attending.filter((u) => u.rsvp?.paymentConfirmed || u.rsvp?.paymentProofUrl));

  const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 });

  const row1 = [
    { label: "Confirmados",  display: String(confirmedCnt), color: "green" as const, Icon: CheckCircle2 },
    { label: "Sem resposta", display: String(noRsvpCnt),    color: "amber" as const, Icon: Clock        },
    { label: "Não vão",      display: String(notGoingCnt),  color: "red"   as const, Icon: XCircle      },
  ];
  const row2 = [
    { label: "Adultos",            display: String(confirmedAdults),  Icon: Users      },
    { label: "Crianças",           display: String(confirmedKids),    Icon: Baby       },
    { label: "Receita esperada",   display: brl(expectedRevenue),     Icon: TrendingUp },
    { label: "Receita confirmada", display: brl(confirmedRevenue),    Icon: Banknote   },
  ];

  function downloadCsv() {
    const rows = [
      ["Nome", "Telefone", "Email", "Cidade", "País", "Vai", "Comida", "Bebida", "Adultos", "Crianças", "Pago"],
      ...users.map((u) => [
        u.fullName  ?? "",
        u.phone     ?? "",
        u.email     ?? "",
        u.city      ?? "",
        u.country   ?? "",
        u.rsvp ? (u.rsvp.isAttending ? "Sim" : "Não") : "—",
        u.rsvp ? (FOOD_LABEL[u.rsvp.foodPreference]  ?? u.rsvp.foodPreference)  : "",
        u.rsvp ? (DRINK_LABEL[u.rsvp.drinkPreference] ?? u.rsvp.drinkPreference) : "",
        u.rsvp?.guestAdults.map((g)  => g.fullName).join(" | ") ?? "",
        u.rsvp?.guestChildren.map((g) => `${g.fullName} (${g.age ?? "?"}a)`).join(" | ") ?? "",
        u.rsvp?.paymentConfirmed ? "Sim" : u.rsvp?.paymentProofUrl ? "Comprovante enviado" : "Não",
      ]),
    ];
    const csv  = rows.map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = "edn-rsvp.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  async function handleDelete(userId: string) {
    setDeletingId(userId);
    const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
    setDeletingId(null);
    setConfirmingDelete(null);
    if (res.ok) router.refresh();
  }

  async function handleRestore(userId: string) {
    setRestoringId(userId);
    const res = await fetch(`/api/admin/users/${userId}/restore`, { method: "POST" });
    setRestoringId(null);
    if (res.ok) router.refresh();
  }

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: "users",  label: "Participantes", icon: Pencil    },
    { key: "photos", label: "Fotos",         icon: ImageIcon },
    { key: "videos", label: "Vídeos",        icon: Video     },
    { key: "logs",   label: "Atividade",     icon: Activity  },
  ];

  return (
    <>
      {/* ── RSVP metrics dashboard ── */}
      <div className="space-y-3 mb-4">
        {/* Row 1: people status */}
        <div className="grid grid-cols-3 gap-3">
          {row1.map(({ label, display, color, Icon }) => {
            const c = METRIC_COLORS[color];
            return (
              <div key={label} className={`rounded-xl border ${c.card} p-4`}>
                <div className={`inline-flex items-center justify-center w-8 h-8 rounded-lg ${c.icon} mb-3`}>
                  <Icon size={15} />
                </div>
                <div className={`text-3xl font-bold font-display ${c.number} leading-none mb-1`}>
                  {display}
                </div>
                <div className="text-xs text-edn-gray font-body leading-tight">{label}</div>
              </div>
            );
          })}
        </div>

        {/* Row 2: headcount & revenue */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {row2.map(({ label, display, Icon }) => {
            const c = METRIC_COLORS.blue;
            return (
              <div key={label} className={`rounded-xl border ${c.card} p-4`}>
                <div className={`inline-flex items-center justify-center w-8 h-8 rounded-lg ${c.icon} mb-3`}>
                  <Icon size={15} />
                </div>
                <div className={`text-2xl font-bold font-display ${c.number} leading-none mb-1`}>
                  {display}
                </div>
                <div className="text-xs text-edn-gray font-body leading-tight">{label}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {/* Tab bar */}
        <div className="flex border-b border-edn-mist">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-body font-medium transition-colors border-b-2 -mb-px ${
                tab === key
                  ? "border-edn-navy text-edn-navy"
                  : "border-transparent text-edn-gray hover:text-edn-navy"
              }`}
            >
              <Icon size={14} /> {label}
              {key === "users" && (
                <span className="text-xs bg-edn-cloud text-edn-gray rounded-full px-1.5">{users.length}</span>
              )}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* ── Users tab ── */}
          {tab === "users" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-edn-navy text-lg font-semibold">
                  Participantes ({users.length})
                </h2>
                <button
                  onClick={downloadCsv}
                  className="flex items-center gap-1.5 text-edn-steel text-xs font-body font-semibold hover:text-edn-navy transition-colors"
                >
                  <Download size={14} /> Exportar CSV
                </button>
              </div>

              <div className="overflow-x-auto -mx-2">
                <table className="w-full text-sm font-body min-w-[860px]">
                  <thead>
                    <tr className="border-b border-edn-mist text-left">
                      {["", "Nome", "Última atividade", "Prefs", "Convidados", "Pagamento", "Conteúdo", ""].map((h, i) => (
                        <th key={i} className="pb-2 px-2 text-xs text-edn-gray font-medium uppercase tracking-wide whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => {
                      const waLink = u.phone ? `https://wa.me/${u.phone.replace(/\D/g, "")}` : null;
                      return (
                      <tr key={u.id} className="group border-b border-edn-cloud hover:bg-edn-cloud/50">

                        <td className="py-2.5 px-2 text-center text-base leading-none">
                          {!u.rsvp ? "⏳" : u.rsvp.isAttending ? "✅" : "❌"}
                        </td>

                        <td className="py-2.5 px-2">
                          {waLink ? (
                            <a href={waLink} target="_blank" rel="noopener noreferrer" className="font-medium text-edn-navy text-sm leading-tight hover:text-green-700 transition-colors block">{u.fullName ?? "—"}</a>
                          ) : (
                            <p className="font-medium text-edn-navy text-sm leading-tight">{u.fullName ?? "—"}</p>
                          )}
                          {(u.city || u.country) && (
                            <p className="text-edn-gray text-xs leading-tight">
                              {[u.city, u.state, u.country].filter(Boolean).join(", ")}
                            </p>
                          )}
                          {waLink ? (
                            <a href={waLink} target="_blank" rel="noopener noreferrer" className="text-edn-gray text-xs hover:text-green-700 transition-colors">{u.phone}</a>
                          ) : (
                            <p className="text-edn-gray text-xs">{u.phone ?? u.email ?? "—"}</p>
                          )}
                        </td>

                        <td className="py-2.5 px-2 text-edn-gray text-xs whitespace-nowrap">
                          {u.lastActiveAt
                            ? new Date(u.lastActiveAt).toLocaleString("pt-BR", {
                                day: "2-digit", month: "2-digit", year: "2-digit",
                                hour: "2-digit", minute: "2-digit",
                                timeZone: "America/Sao_Paulo",
                              })
                            : "—"}
                        </td>

                        <td className="py-2.5 px-2 text-edn-gray text-xs space-y-0.5">
                          {u.rsvp?.isAttending && (
                            <>
                              <p className="whitespace-nowrap">{FOOD_LABEL[u.rsvp.foodPreference]  ?? u.rsvp.foodPreference}</p>
                              <p className="whitespace-nowrap">{DRINK_LABEL[u.rsvp.drinkPreference] ?? u.rsvp.drinkPreference}</p>
                            </>
                          )}
                        </td>

                        <td className="py-2.5 px-2 text-edn-gray text-xs whitespace-nowrap">
                          {u.rsvp
                            ? u.rsvp.guestAdults.length + u.rsvp.guestChildren.length > 0
                              ? `+${u.rsvp.guestAdults.length + u.rsvp.guestChildren.length}`
                              : "Sozinho"
                            : "—"}
                        </td>

                        <td className="py-2.5 px-2">
                          {u.rsvp?.paymentConfirmed ? (
                            <span className="text-xs text-green-700 bg-green-50 rounded-full px-2 py-0.5 whitespace-nowrap">✅ Pago</span>
                          ) : u.rsvp?.paymentProofUrl ? (
                            <a
                              href={u.rsvp.paymentProofUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-yellow-700 bg-yellow-50 rounded-full px-2 py-0.5 whitespace-nowrap underline"
                            >
                              Ver comprovante
                            </a>
                          ) : (
                            <span className="text-xs text-edn-gray">—</span>
                          )}
                        </td>

                        <td className="py-2.5 px-2">
                          <div className="flex gap-1.5 text-xs text-edn-gray flex-wrap">
                            {u.metrics.photos        > 0 && <span title="Fotos">📸 {u.metrics.photos}</span>}
                            {u.metrics.quotes        > 0 && <span title="Citações">💬 {u.metrics.quotes}</span>}
                            {u.metrics.stories       > 0 && <span title="Histórias">📖 {u.metrics.stories}</span>}
                            {u.metrics.videoMessages > 0 && <span title="Vídeo">🎥</span>}
                            {u.metrics.taggedIn      > 0 && <span title="Tags">🏷️ {u.metrics.taggedIn}</span>}
                          </div>
                        </td>

                        <td className="py-2.5 px-2 w-28">
                          {confirmingDelete === u.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleDelete(u.id)}
                                disabled={deletingId === u.id}
                                className="text-[10px] font-body font-semibold text-white bg-red-500 hover:bg-red-600 px-2 py-1 rounded disabled:opacity-60 flex items-center gap-1"
                              >
                                {deletingId === u.id && <Loader2 size={10} className="animate-spin" />}
                                Deletar
                              </button>
                              <button
                                onClick={() => setConfirmingDelete(null)}
                                className="text-[10px] font-body text-edn-gray hover:text-edn-navy px-1 py-1"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                              <button
                                onClick={() => setContentUser(u)}
                                className="text-edn-gray/50 hover:text-edn-navy"
                                title="Ver conteúdo"
                              >
                                <FolderOpen size={14} />
                              </button>
                              <button
                                onClick={() => setEditUser(u)}
                                className="text-edn-gray/50 hover:text-edn-navy"
                                title="Editar"
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                onClick={() => setConfirmingDelete(u.id)}
                                className="text-edn-gray/50 hover:text-red-500"
                                title="Deletar perfil"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );})}
                  </tbody>
                </table>
              </div>

              {/* ── Deleted users ── */}
              {deletedUsers.length > 0 && (
                <div className="border border-red-100 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setShowDeleted((v) => !v)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-red-50 text-xs font-body font-semibold text-red-700 hover:bg-red-100 transition-colors"
                  >
                    <span>Perfis deletados ({deletedUsers.length})</span>
                    {showDeleted ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>

                  {showDeleted && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm font-body min-w-[500px]">
                        <thead>
                          <tr className="border-b border-red-100 text-left bg-red-50/50">
                            {["Nome", "Contato", "Deletado em", ""].map((h) => (
                              <th key={h} className="pb-2 pt-3 px-4 text-xs text-red-400 font-medium uppercase tracking-wide whitespace-nowrap">
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {deletedUsers.map((u) => (
                            <tr key={u.id} className="border-b border-red-50 last:border-0">
                              <td className="py-2.5 px-4">
                                <p className="font-medium text-edn-navy/60 text-sm leading-tight">{u.fullName ?? "—"}</p>
                              </td>
                              <td className="py-2.5 px-4 text-edn-gray/60 text-xs">
                                {u.phone ?? u.email ?? "—"}
                              </td>
                              <td className="py-2.5 px-4 text-edn-gray/60 text-xs whitespace-nowrap">
                                {u.deletedAt
                                  ? new Date(u.deletedAt).toLocaleString("pt-BR", {
                                      day: "2-digit", month: "2-digit", year: "2-digit",
                                      hour: "2-digit", minute: "2-digit",
                                      timeZone: "America/Sao_Paulo",
                                    })
                                  : "—"}
                              </td>
                              <td className="py-2.5 px-4">
                                <button
                                  onClick={() => handleRestore(u.id)}
                                  disabled={restoringId === u.id}
                                  className="flex items-center gap-1.5 text-xs font-body font-semibold text-green-700 hover:text-green-900 disabled:opacity-60 transition-colors"
                                  title="Restaurar perfil"
                                >
                                  {restoringId === u.id
                                    ? <Loader2 size={12} className="animate-spin" />
                                    : <RotateCcw size={12} />
                                  }
                                  Restaurar
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Photos tab ── */}
          {tab === "photos" && (
            <div className="space-y-4">
              <h2 className="font-display text-edn-navy text-lg font-semibold">
                Gerenciar Fotos
              </h2>
              <AdminPhotosPanel users={userOptions} />
            </div>
          )}

          {/* ── Videos tab ── */}
          {tab === "videos" && (
            <div className="space-y-4">
              <h2 className="font-display text-edn-navy text-lg font-semibold">
                Gerenciar Vídeos
              </h2>
              <AdminVideoPanel />
            </div>
          )}

          {/* ── Activity log tab ── */}
          {tab === "logs" && (
            <div className="space-y-4">
              <h2 className="font-display text-edn-navy text-lg font-semibold">
                Registro de Atividades
              </h2>
              <ActivityLogPanel users={userOptions} />
            </div>
          )}
        </div>
      </div>

      {editUser && (
        <AdminUserModal user={editUser} onClose={() => setEditUser(null)} />
      )}

      {contentUser && (
        <UserContentModal
          userId={contentUser.id}
          userName={contentUser.fullName ?? contentUser.id}
          onClose={() => setContentUser(null)}
        />
      )}
    </>
  );
}
