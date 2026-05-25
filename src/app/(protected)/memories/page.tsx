import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ChevronRight } from "lucide-react";
import { ContributeForm } from "@/components/ContributeForm";
import { eraLabel } from "@/lib/memory-eras";
import { StoriesSection, QuotesSection } from "@/components/MemoryTextSections";

export default async function MemoriesPage() {
  const session = await auth();
  const isAdmin = (session?.user as any)?.role === "ADMIN";

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

  const storiesData = stories.map((s) => ({
    id:       s.id,
    title:    s.title,
    content:  s.content,
    author:   s.author,
    userName: s.user.fullName,
  }));

  const quotesData = quotes.map((q) => ({
    id:       q.id,
    content:  q.content,
    author:   q.author,
    userName: q.user.fullName,
  }));

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
          {totalPhotos > 0 && (
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
      <StoriesSection
        initialStories={storiesData}
        totalStories={totalStories}
        isAdmin={isAdmin}
      />

      {/* ── Quotes ── */}
      <QuotesSection initialQuotes={quotesData} isAdmin={isAdmin} />
    </div>
  );
}
