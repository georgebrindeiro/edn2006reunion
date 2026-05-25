import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PhotoAlbumClient } from "./PhotoAlbumClient";

export default async function PhotosPage() {
  const session = await auth();
  const isAdmin = (session?.user as any)?.role === "ADMIN";

  const photos = await prisma.memory.findMany({
    where:   { approved: true, type: "PHOTO", mediaUrl: { not: null } },
    include: { user: { select: { fullName: true } } },
    orderBy: { createdAt: "desc" },
  });

  const serialized = photos.map((p) => ({
    id:        p.id,
    mediaUrl:  p.mediaUrl!,
    title:     p.title,
    era:       p.era,
    createdAt: p.createdAt.toISOString(),
    userName:  p.user.fullName,
  }));

  return (
    <div className="space-y-6">
      <div>
        <p className="text-edn-steel text-xs font-body uppercase tracking-widest mb-1">
          Álbum
        </p>
        <h1 className="font-display text-edn-navy text-3xl font-bold">Fotos</h1>
        <p className="text-edn-gray font-body text-sm mt-1">
          {serialized.length} fotos de toda a nossa história na EDN.
        </p>
      </div>
      <PhotoAlbumClient photos={serialized} isAdmin={isAdmin} />
    </div>
  );
}
