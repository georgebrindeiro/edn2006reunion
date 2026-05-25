"use client";

import { useState, useEffect } from "react";
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

export function CommentThread({ memoryId }: { memoryId: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [text,     setText]     = useState("");
  const [loading,  setLoading]  = useState(true);
  const [posting,  setPosting]  = useState(false);

  useEffect(() => {
    fetch(`/api/memories/${memoryId}/comments`)
      .then((r) => r.json())
      .then(setComments)
      .finally(() => setLoading(false));
  }, [memoryId]);

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
    <div className="flex flex-col flex-1 min-h-0">
      {/* Comment list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {loading ? (
          <div className="flex justify-center py-4">
            <Loader2 size={16} className="animate-spin text-edn-steel" />
          </div>
        ) : comments.length === 0 ? (
          <p className="text-edn-gray text-xs font-body text-center py-4">
            Seja o primeiro a comentar.
          </p>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="flex gap-2">
              {c.user.photoNow ? (
                <img
                  src={c.user.photoNow}
                  alt=""
                  className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-edn-steel flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-[9px] font-semibold">
                    {getInitials(c.user.fullName)}
                  </span>
                </div>
              )}
              <div>
                <p className="text-edn-navy text-[11px] font-body font-semibold leading-none mb-0.5">
                  {c.user.fullName ?? "Colega"}
                </p>
                <p className="text-edn-navy/80 text-xs font-body leading-snug">{c.content}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Input */}
      <form onSubmit={submit} className="border-t border-edn-mist p-3 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Escreva um comentário..."
          className="flex-1 text-xs font-body border border-edn-mist rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-edn-steel"
        />
        <button
          type="submit"
          disabled={posting || !text.trim()}
          className="bg-edn-navy text-white p-1.5 rounded-lg disabled:opacity-40 hover:bg-edn-navy/90"
        >
          {posting ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
        </button>
      </form>
    </div>
  );
}
