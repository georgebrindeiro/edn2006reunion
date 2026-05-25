import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { StoryComments } from "./StoryComments";

export default async function StoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const story = await prisma.memory.findUnique({
    where:   { id, type: "STORY", approved: true },
    include: {
      user:     { select: { fullName: true } },
      comments: {
        include: { user: { select: { fullName: true, photoNow: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!story) notFound();

  // Find adjacent stories
  const allStories = await prisma.memory.findMany({
    where:   { approved: true, type: "STORY" },
    orderBy: { createdAt: "desc" },
    select:  { id: true, title: true, content: true },
  });
  const idx  = allStories.findIndex((s) => s.id === id);
  const prev = idx < allStories.length - 1 ? allStories[idx + 1] : null;
  const next = idx > 0                      ? allStories[idx - 1] : null;

  const initialComments = story.comments.map((c) => ({
    id:        c.id,
    content:   c.content,
    createdAt: c.createdAt.toISOString(),
    user:      { fullName: c.user.fullName, photoNow: c.user.photoNow },
  }));

  return (
    <div className="max-w-2xl space-y-8">
      {/* Back */}
      <Link
        href="/memories/stories"
        className="inline-flex items-center gap-1 text-edn-steel text-xs font-body hover:text-edn-navy transition-colors"
      >
        <ChevronLeft size={13} /> Todas as histórias
      </Link>

      {/* Story */}
      <article className="bg-white rounded-2xl shadow-sm p-6 border-l-4 border-edn-mist">
        {story.title && (
          <h1 className="font-display text-edn-navy text-2xl font-bold mb-2">{story.title}</h1>
        )}
        <p className="text-edn-gray text-xs font-body mb-4">
          — {story.user.fullName ?? "Colega"} ·{" "}
          {new Date(story.createdAt).toLocaleDateString("pt-BR", {
            day: "numeric", month: "long", year: "numeric",
          })}
        </p>
        <p className="font-body text-edn-navy/80 text-sm leading-relaxed whitespace-pre-line">
          {story.content}
        </p>
      </article>

      {/* Prev / Next */}
      {(prev || next) && (
        <div className="flex gap-3">
          {prev && (
            <Link
              href={`/memories/stories/${prev.id}`}
              className="flex-1 bg-white rounded-xl p-4 shadow-sm border border-edn-mist hover:border-edn-steel hover:shadow-md transition-all group"
            >
              <p className="text-edn-steel text-[10px] font-body uppercase tracking-wider flex items-center gap-1 mb-1">
                <ChevronLeft size={10} /> Anterior
              </p>
              <p className="font-display text-edn-navy text-sm font-semibold line-clamp-1">
                {prev.title ?? prev.content?.slice(0, 40) + "…"}
              </p>
            </Link>
          )}
          {next && (
            <Link
              href={`/memories/stories/${next.id}`}
              className="flex-1 bg-white rounded-xl p-4 shadow-sm border border-edn-mist hover:border-edn-steel hover:shadow-md transition-all text-right"
            >
              <p className="text-edn-steel text-[10px] font-body uppercase tracking-wider flex items-center justify-end gap-1 mb-1">
                Próxima <ChevronRight size={10} />
              </p>
              <p className="font-display text-edn-navy text-sm font-semibold line-clamp-1">
                {next.title ?? next.content?.slice(0, 40) + "…"}
              </p>
            </Link>
          )}
        </div>
      )}

      {/* Comments */}
      <StoryComments memoryId={story.id} initialComments={initialComments} />
    </div>
  );
}
