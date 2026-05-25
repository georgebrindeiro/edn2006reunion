"use client";

import { useState } from "react";
import { Loader2, Send } from "lucide-react";

interface Comment {
  id:        string;
  content:   string;
  createdAt: string;
  user: { fullName: string | null; photoNow: string | null };
}

function getInitials(name: string | null): string {
  if (!name) return "?";
  return name.split(" ").filter(Boolean).map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

export function StoryComments({
  memoryId,
  initialComments,
}: {
  memoryId: string;
  initialComments: Comment[];
}) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [text,     setText]     = useState("");
  const [posting,  setPosting]  = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setPosting(true);
    const res = await fetch(`/api/memories/${memoryId}/comments`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ content: text.trim() }),
    });
    if (res.ok) {
      const c = await res.json();
      setComments((prev) => [...prev, c]);
      setText("");
    }
    setPosting(false);
  }

  return (
    <section className="space-y-4">
      <h2 className="font-display text-edn-navy text-lg font-semibold">
        Comentários ({comments.length})
      </h2>

      {comments.map((c) => (
        <div key={c.id} className="flex gap-3">
          {c.user.photoNow ? (
            <img
              src={c.user.photoNow}
              alt=""
              className="w-9 h-9 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-edn-steel flex items-center justify-center flex-shrink-0">
              <span className="text-white text-[11px] font-semibold">
                {getInitials(c.user.fullName)}
              </span>
            </div>
          )}
          <div className="flex-1 bg-white rounded-xl p-3 shadow-sm">
            <p className="text-edn-navy text-xs font-body font-semibold mb-1">
              {c.user.fullName ?? "Colega"}
              <span className="text-edn-gray/60 font-normal ml-1.5">
                · {new Date(c.createdAt).toLocaleDateString("pt-BR")}
              </span>
            </p>
            <p className="text-edn-navy/80 text-sm font-body leading-relaxed">{c.content}</p>
          </div>
        </div>
      ))}

      {comments.length === 0 && (
        <p className="text-edn-gray text-sm font-body text-center py-4">
          Nenhum comentário ainda. Seja o primeiro!
        </p>
      )}

      <form onSubmit={submit} className="flex gap-3 pt-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Escreva um comentário..."
          className="flex-1 border border-edn-mist rounded-xl px-4 py-2.5 text-sm font-body text-edn-navy focus:outline-none focus:border-edn-steel"
        />
        <button
          type="submit"
          disabled={posting || !text.trim()}
          className="bg-edn-navy text-white px-4 py-2.5 rounded-xl disabled:opacity-40 hover:bg-edn-navy/90 flex items-center gap-1.5"
        >
          {posting ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
        </button>
      </form>
    </section>
  );
}
