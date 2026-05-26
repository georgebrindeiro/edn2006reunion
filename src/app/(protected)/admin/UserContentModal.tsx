"use client";

import { useState, useEffect } from "react";
import { X, Loader2, Image as ImageIcon, Quote, BookOpen } from "lucide-react";
import { MEMORY_ERAS } from "@/lib/memory-eras";

interface Memory {
  id: string;
  type: string;
  title: string | null;
  content: string | null;
  era: string | null;
  mediaUrl: string | null;
  approved: boolean;
  createdAt: string;
}

const TYPE_ICONS: Record<string, React.ElementType> = {
  PHOTO: ImageIcon, QUOTE: Quote, STORY: BookOpen,
};

export function UserContentModal({
  userId,
  userName,
  onClose,
}: {
  userId: string;
  userName: string;
  onClose: () => void;
}) {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    fetch(`/api/admin/users/${userId}/memories`)
      .then((r) => r.json())
      .then((data: Memory[]) => {
        setMemories(data);
        setLoading(false);
      });
  }, [userId]);

  const photos  = memories.filter((m) => m.type === "PHOTO");
  const others  = memories.filter((m) => m.type !== "PHOTO");

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-edn-mist">
          <div>
            <p className="font-display text-edn-navy font-semibold text-base">{userName}</p>
            <p className="text-xs font-body text-edn-gray">
              {loading ? "Carregando…" : `${memories.length} contribuição(ões)`}
            </p>
          </div>
          <button onClick={onClose} className="text-edn-gray/50 hover:text-edn-gray">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {loading && (
            <div className="flex items-center justify-center py-10">
              <Loader2 size={20} className="animate-spin text-edn-steel" />
            </div>
          )}

          {!loading && memories.length === 0 && (
            <p className="text-center text-edn-gray font-body text-sm py-10">
              Nenhuma contribuição ainda.
            </p>
          )}

          {photos.length > 0 && (
            <div>
              <p className="text-xs font-body font-semibold text-edn-gray uppercase tracking-wider mb-2">
                Fotos ({photos.length})
              </p>
              <div className="grid grid-cols-4 gap-2">
                {photos.map((p) => (
                  <div key={p.id} className={`relative rounded-xl overflow-hidden aspect-square ${!p.approved ? "opacity-40" : ""}`}>
                    <img src={p.mediaUrl!} alt={p.title ?? ""} className="w-full h-full object-cover" loading="lazy" />
                    {p.era && (
                      <div className="absolute top-1 left-1 bg-black/50 text-white text-[9px] px-1 rounded-full">
                        {MEMORY_ERAS.find((e) => e.value === p.era)?.emoji}
                      </div>
                    )}
                    {!p.approved && (
                      <div className="absolute bottom-1 inset-x-1 text-center">
                        <span className="text-[8px] font-body bg-orange-100 text-orange-600 px-1 rounded">removida</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {others.length > 0 && (
            <div>
              <p className="text-xs font-body font-semibold text-edn-gray uppercase tracking-wider mb-2">
                Outros ({others.length})
              </p>
              <div className="space-y-2">
                {others.map((m) => {
                  const Icon = TYPE_ICONS[m.type] ?? ImageIcon;
                  return (
                    <div key={m.id} className={`flex items-start gap-3 p-3 rounded-xl bg-edn-cloud/30 ${!m.approved ? "opacity-50" : ""}`}>
                      <Icon size={16} className="text-edn-steel mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-body text-edn-navy font-medium">
                          {m.title ?? `(${m.type.toLowerCase()})`}
                        </p>
                        {m.content && (
                          <p className="text-xs font-body text-edn-gray mt-0.5 line-clamp-2">{m.content}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
