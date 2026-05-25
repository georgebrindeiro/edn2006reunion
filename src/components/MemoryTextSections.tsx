"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { AdminEditButton } from "./AdminMemoryEditor";

interface Story {
  id:      string;
  title:   string | null;
  content: string | null;
  author:  string | null;
  userName: string | null;
}

interface Quote {
  id:      string;
  content: string | null;
  author:  string | null;
  userName: string | null;
}

export function StoriesSection({
  initialStories,
  totalStories,
  isAdmin,
}: {
  initialStories: Story[];
  totalStories: number;
  isAdmin: boolean;
}) {
  const [stories, setStories] = useState<Story[]>(initialStories);

  function handleSaved(id: string, updated: Partial<Story>) {
    setStories((prev) => prev.map((s) => s.id === id ? { ...s, ...updated } : s));
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-edn-navy text-xl font-semibold">Histórias</h2>
          <p className="text-edn-gray text-xs font-body mt-0.5">
            {totalStories} hist{totalStories !== 1 ? "órias" : "ória"}
          </p>
        </div>
        <Link
          href="/memories/stories"
          className="flex items-center gap-1 text-xs text-edn-steel font-body hover:text-edn-navy transition-colors"
        >
          Ver todas <ChevronRight size={13} />
        </Link>
      </div>

      {stories.length === 0 ? (
        <div className="bg-edn-cloud/50 rounded-2xl p-10 text-center">
          <p className="text-edn-gray font-body text-sm">Nenhuma história ainda. Compartilhe a sua!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {stories.map((s) => (
            <div key={s.id} className="relative group bg-white rounded-2xl shadow-sm hover:shadow-md border-l-4 border-edn-mist hover:border-edn-navy transition-all">
              <Link href={`/memories/stories/${s.id}`} className="block p-5">
                {s.title && (
                  <h3 className="font-display text-edn-navy font-semibold text-base mb-1">{s.title}</h3>
                )}
                <p className="font-body text-edn-navy/70 text-sm leading-relaxed line-clamp-3">{s.content}</p>
                <p className="text-edn-gray text-xs font-body mt-2 flex items-center justify-between">
                  <span>— {s.userName ?? "Colega"}</span>
                  <span className="flex items-center gap-0.5 text-edn-steel group-hover:text-edn-navy transition-colors">
                    Ler mais <ChevronRight size={12} />
                  </span>
                </p>
              </Link>
              {isAdmin && (
                <div className="absolute top-3 right-3">
                  <AdminEditButton
                    memory={{ id: s.id, type: "STORY", title: s.title, content: s.content, author: s.author }}
                    onSaved={(updated) => handleSaved(s.id, updated as Partial<Story>)}
                  />
                </div>
              )}
            </div>
          ))}
          {totalStories > 3 && (
            <Link
              href="/memories/stories"
              className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl border border-edn-mist text-edn-steel text-sm font-body hover:border-edn-navy hover:text-edn-navy transition-colors"
            >
              Ver todas as histórias <ChevronRight size={14} />
            </Link>
          )}
        </div>
      )}
    </section>
  );
}

export function QuotesSection({
  initialQuotes,
  isAdmin,
}: {
  initialQuotes: Quote[];
  isAdmin: boolean;
}) {
  const [quotes, setQuotes] = useState<Quote[]>(initialQuotes);

  function handleSaved(id: string, updated: Partial<Quote>) {
    setQuotes((prev) => prev.map((q) => q.id === id ? { ...q, ...updated } : q));
  }

  if (quotes.length === 0) return null;

  return (
    <section className="space-y-4">
      <h2 className="font-display text-edn-navy text-xl font-semibold">Citações</h2>
      <div className="columns-1 sm:columns-2 gap-4 space-y-4">
        {quotes.map((q) => (
          <div key={q.id} className="relative group break-inside-avoid bg-edn-navy rounded-2xl p-5 mb-4">
            <blockquote className="font-display text-white text-base italic leading-relaxed mb-3">
              &ldquo;{q.content}&rdquo;
            </blockquote>
            <footer className="text-edn-mist/60 text-xs font-body">
              — {q.author ?? q.userName ?? "Anônimo"}
            </footer>
            {isAdmin && (
              <div className="absolute top-3 right-3 [&_button]:opacity-100 [&_button]:text-white/50 [&_button:hover]:text-white">
                <AdminEditButton
                  memory={{ id: q.id, type: "QUOTE", title: null, content: q.content, author: q.author }}
                  onSaved={(updated) => handleSaved(q.id, updated as Partial<Quote>)}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
