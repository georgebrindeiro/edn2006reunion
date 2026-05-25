import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ChevronRight } from "lucide-react";
import { ContributeForm } from "@/components/ContributeForm";
import { eraLabel } from "@/lib/memory-eras";

export default async function MemoriesPage() {
  const [photos, stories, quotes] = await Promise.all([
    prisma.memory.findMany({
      where:   { approved: true, type: "PHOTO", mediaUrl: { not: null } },
      orderBy: { createdAt: "desc" },
      take:    20,
      include: { user: { select: { fullName: true } } },
    }),
    prisma.memory.findMany({
      where:   { approved: true, type: "STORY" },
      orderBy: { createdAt: "desc" },
      take:    3,
      include: { user: { select: { fullName: true } } },
    }),
    prisma.memory.findMany({
      where:   { approved: true, type: "QUOTE" },
      orderBy: { createdAt: "desc" },
      include: { user: { select: { fullName: true } } },
    }),
  ]);

  const totalPhotos = await prisma.memory.count({
    where: { approved: true, type: "PHOTO" },
  });

  const totalStories = await prisma.memory.count({
    where: { approved: true, type: "STORY" },
  });

  return (
    <div className="space-y-10">
      {/* Header */}
      <div>
        <p className="text-edn-steel text-xs font-body uppercase tracking-widest mb-1">
          Arquivo da turma
        </p>
        <h1 className="font-display text-edn-navy text-3xl font-bold">Memórias</h1>
        <p className="text-edn-gray font-body text-sm mt-1">
          Fotos, histórias e citações da nossa época na EDN.
        </p>
      </div>

      {/* ── Contribute CTA ── */}
      <ContributeForm />

      {/* ── Photos ── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-edn-navy text-xl font-semibold">Fotos</h2>
            <p className="text-edn-gray text-xs font-body mt-0.5">{totalPhotos} fotos</p>
          </div>
          {totalPhotos > 20 && (
            <Link
              href="/memories/photos"
              className="flex items-center gap-1 text-xs text-edn-steel font-body hover:text-edn-navy transition-colors"
            >
              Ver todas <ChevronRight size={13} />
            </Link>
          )}
        </div>

        {photos.length === 0 ? (
          <div className="bg-edn-cloud/50 rounded-2xl p-10 text-center">
            <p className="text-edn-gray font-body text-sm">Nenhuma foto ainda. Seja o primeiro!</p>
          </div>
        ) : (
          <>
            <div className="columns-2 sm:columns-3 md:columns-4 gap-2 space-y-2">
              {photos.map((photo) => (
                <Link
                  key={photo.id}
                  href="/memories/photos"
                  className="block break-inside-avoid overflow-hidden rounded-xl group relative"
                >
                  <img
                    src={photo.mediaUrl!}
                    alt={photo.title ?? ""}
                    className="w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  {photo.era && (
                    <div className="absolute top-1.5 left-1.5 bg-black/40 text-white text-[10px] font-body px-1.5 py-0.5 rounded-full">
                      {eraLabel(photo.era)}
                    </div>
                  )}
                </Link>
              ))}
            </div>
            <Link
              href="/memories/photos"
              className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl border border-edn-mist text-edn-steel text-sm font-body hover:border-edn-navy hover:text-edn-navy transition-colors"
            >
              Ver álbum completo <ChevronRight size={14} />
            </Link>
          </>
        )}
      </section>

      {/* ── Stories ── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-edn-navy text-xl font-semibold">Histórias</h2>
            <p className="text-edn-gray text-xs font-body mt-0.5">{totalStories} hist{totalStories !== 1 ? "órias" : "ória"}</p>
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
              <Link
                key={s.id}
                href={`/memories/stories/${s.id}`}
                className="block bg-white rounded-2xl p-5 shadow-sm hover:shadow-md border-l-4 border-edn-mist hover:border-edn-navy transition-all group"
              >
                {s.title && (
                  <h3 className="font-display text-edn-navy font-semibold text-base mb-1">
                    {s.title}
                  </h3>
                )}
                <p className="font-body text-edn-navy/70 text-sm leading-relaxed line-clamp-3">
                  {s.content}
                </p>
                <p className="text-edn-gray text-xs font-body mt-2 flex items-center justify-between">
                  <span>— {s.user.fullName ?? "Colega"}</span>
                  <span className="flex items-center gap-0.5 text-edn-steel group-hover:text-edn-navy transition-colors">
                    Ler mais <ChevronRight size={12} />
                  </span>
                </p>
              </Link>
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

      {/* ── Quotes ── */}
      {quotes.length > 0 && (
        <section className="space-y-4">
          <h2 className="font-display text-edn-navy text-xl font-semibold">Citações</h2>
          <div className="columns-1 sm:columns-2 gap-4 space-y-4">
            {quotes.map((q) => (
              <div key={q.id} className="break-inside-avoid bg-edn-navy rounded-2xl p-5 mb-4">
                <blockquote className="font-display text-white text-base italic leading-relaxed mb-3">
                  &ldquo;{q.content}&rdquo;
                </blockquote>
                <footer className="text-edn-mist/60 text-xs font-body">
                  — {q.user.fullName ?? "Colega"}
                </footer>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
