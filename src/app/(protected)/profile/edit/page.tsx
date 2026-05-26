import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ProfilePageClient } from "./ProfilePageClient";

export default async function ProfileEditPage() {
  const session = await auth();
  const user = await prisma.user.findUnique({
    where:   { email: session!.user!.email! },
    include: { studyPeriods: true },
  });

  const myMemories = await prisma.memory.findMany({
    where:   { userId: user!.id },
    orderBy: { createdAt: "desc" },
  });

  const serializedMemories = myMemories.map((m) => ({
    id:        m.id,
    type:      m.type,
    title:     m.title,
    content:   m.content,
    era:       m.era,
    mediaUrl:  m.mediaUrl,
    approved:  m.approved,
    createdAt: m.createdAt.toISOString(),
  }));

  return (
    <div>
      <div className="max-w-lg mx-auto mb-6">
        <p className="text-edn-steel text-xs font-body uppercase tracking-widest mb-1">
          Seu perfil
        </p>
        <h1 className="font-display text-edn-navy text-3xl font-bold">
          Meus Dados
        </h1>
        <p className="text-edn-gray font-body text-sm mt-1">
          Complete seu perfil e adicione suas fotos — antes e depois.
        </p>
      </div>

      <ProfilePageClient user={user as any} memories={serializedMemories} />
    </div>
  );
}
