"use client";

import { useState, useEffect } from "react";
import { Loader2, Image as ImageIcon, Quote, BookOpen } from "lucide-react";

interface LogEntry {
  id: string;
  createdAt: string;
  action: string;
  memoryId: string | null;
  details: Record<string, unknown> | null;
  user: { id: string; fullName: string | null };
  memory: {
    id: string; type: string; title: string | null; mediaUrl: string | null;
  } | null;
}

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  UPLOAD:        { label: "Upload",           color: "bg-green-100 text-green-700" },
  EDIT:          { label: "Edição",           color: "bg-blue-100 text-blue-700" },
  SOFT_DELETE:   { label: "Removido",         color: "bg-orange-100 text-orange-700" },
  RESTORE:       { label: "Restaurado",       color: "bg-teal-100 text-teal-700" },
  ADMIN_DELETE:  { label: "Excluído (admin)", color: "bg-red-100 text-red-700" },
  BATCH_ERA:     { label: "Era (lote)",       color: "bg-purple-100 text-purple-700" },
  BATCH_OWNER:   { label: "Responsável (lote)", color: "bg-indigo-100 text-indigo-700" },
  BATCH_REORDER: { label: "Reordenação",      color: "bg-gray-100 text-gray-700" },
};

const TYPE_ICONS: Record<string, React.ElementType> = {
  PHOTO: ImageIcon, QUOTE: Quote, STORY: BookOpen,
};

export function ActivityLogPanel({ users }: { users: { id: string; fullName: string | null }[] }) {
  const [logs,    setLogs]    = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId,  setUserId]  = useState<string>("");

  useEffect(() => {
    const url = userId ? `/api/admin/activity-logs?userId=${userId}` : "/api/admin/activity-logs";
    fetch(url)
      .then((r) => r.json())
      .then((data) => { setLogs(data); setLoading(false); });
  }, [userId]);

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex items-center gap-3">
        <select
          value={userId}
          onChange={(e) => { setUserId(e.target.value); setLoading(true); }}
          className="text-sm font-body border border-edn-mist rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-edn-steel"
        >
          <option value="">Todos os usuários</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>{u.fullName ?? u.id}</option>
          ))}
        </select>
        {loading && <Loader2 size={15} className="animate-spin text-edn-steel" />}
      </div>

      {!loading && logs.length === 0 && (
        <div className="text-center py-10 text-edn-gray font-body text-sm">
          Nenhum registro encontrado.
        </div>
      )}

      <div className="space-y-2">
        {logs.map((log) => {
          const badge  = ACTION_LABELS[log.action] ?? { label: log.action, color: "bg-gray-100 text-gray-600" };
          const Icon   = log.memory ? (TYPE_ICONS[log.memory.type] ?? ImageIcon) : null;
          const isPhoto = log.memory?.type === "PHOTO" && log.memory.mediaUrl;

          return (
            <div key={log.id} className="flex items-start gap-3 bg-white rounded-xl border border-edn-mist p-3">
              {/* Memory thumbnail / icon */}
              <div className="flex-shrink-0 w-10 h-10 rounded-lg overflow-hidden bg-edn-cloud flex items-center justify-center">
                {isPhoto ? (
                  <img src={log.memory!.mediaUrl!} alt="" className="w-full h-full object-cover" />
                ) : Icon ? (
                  <Icon size={16} className="text-edn-steel" />
                ) : (
                  <div className="text-edn-steel/40 text-xs font-body">—</div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-[10px] font-body font-semibold px-2 py-0.5 rounded-full ${badge.color}`}>
                    {badge.label}
                  </span>
                  <span className="text-xs font-body font-medium text-edn-navy truncate">
                    {log.user.fullName ?? log.user.id}
                  </span>
                </div>

                {log.memory && (
                  <p className="text-[10px] font-body text-edn-gray mt-0.5 truncate">
                    {log.memory.title ?? `(${log.memory.type.toLowerCase()})`}
                  </p>
                )}

                {log.details && (
                  <p className="text-[10px] font-body text-edn-gray/60 mt-0.5">
                    {Object.entries(log.details as Record<string, unknown>)
                      .map(([k, v]) => `${k}: ${v}`)
                      .join(" · ")}
                  </p>
                )}
              </div>

              <time className="text-[10px] font-body text-edn-gray/50 flex-shrink-0 text-right">
                {new Date(log.createdAt).toLocaleString("pt-BR", {
                  day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
                })}
              </time>
            </div>
          );
        })}
      </div>
    </div>
  );
}
