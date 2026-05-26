import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PhotoAlbumClient } from "./PhotoAlbumClient";

export default async function PhotosPage({
  searchParams,
}: {
  searchParams: { photo?: string };
}) {
  const session = await auth();
  const isAdmin = (session?.user as any)?.role === "ADMIN";

  const [photos, classmates] = await Promise.all([
    prisma.memory.findMany({
      where:   { approved: true, type: { in: ["PHOTO", "VIDEO"] }, mediaUrl: { not: null } },
      include: {
        user: { select: { fullName: true } },
        tags: { include: { user: { select: { id: true, fullName: true, photoNow: true } } } },
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    }),
    prisma.user.findMany({
      where:   { fullName: { not: null } },
      select:  { id: true, fullName: true, photoNow: true },
      orderBy: { fullName: "asc" },
    }),
  ]);

  const serialized = photos.map((p) => ({
    id:        p.id,
    mediaUrl:  p.mediaUrl!,
    mediaType: p.type as "PHOTO" | "VIDEO",
    title:     p.title,
    era:       p.era,
    sortOrder: p.sortOrder,
    createdAt: p.createdAt.toISOString(),
    userName:  p.user.fullName,
    tags:      p.tags.map((t) => ({
      id:       t.id,
      userId:   t.userId,
      fullName: t.user.fullName,
      photoNow: t.user.photoNow,
    })),
  }));

  const classmatesList = classmates.map((c) => ({
    id:       c.id,
    fullName: c.fullName!,
    photoNow: c.photoNow,
  }));

  return (
    <div className="space-y-6">
      <div>
        <p className="text-edn-steel text-xs font-body uppercase tracking-widest mb-1">
          Álbum
        </p>
        <h1 className="font-display text-edn-navy text-3xl font-bold">Fotos & Vídeos</h1>
        <p className="text-edn-gray font-body text-sm mt-1">
          {serialized.length} item(ns) de toda a nossa história na EDN.
        </p>
      </div>
      <PhotoAlbumClient
        photos={serialized}
        classmates={classmatesList}
        isAdmin={isAdmin}
        initialPhotoId={searchParams?.photo ?? null}
      />
    </div>
  );
}
