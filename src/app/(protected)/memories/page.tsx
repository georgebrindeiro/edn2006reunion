import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { GOOGLE_PHOTOS_ALBUM_URL } from "@/lib/constants";
import { MemoriesClient } from "./MemoriesClient";

export default async function MemoriesPage() {
  const session  = await auth();
  const memories = await prisma.memory.findMany({
    where:   { approved: true },
    include: { user: { select: { fullName: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-10">
      {/* Header */}
      <div>
        <p className="text-edn-steel text-xs font-body uppercase tracking-widest mb-1">
          Arquivo da turma
        </p>
        <h1 className="font-display text-edn-navy text-3xl font-bold">
          Memórias
        </h1>
        <p className="text-edn-gray font-body text-sm mt-1">
          Fotos, vídeos, histórias e citações da nossa época na EDN.
        </p>
      </div>

      {/* Google Photos album */}
      <section>
        <h2 className="font-display text-edn-navy text-lg font-semibold mb-4">
          📷 Álbum de fotos
        </h2>
        {GOOGLE_PHOTOS_ALBUM_URL.includes("REPLACE") ? (
          <div className="bg-edn-cloud rounded-2xl p-8 text-center">
            <p className="text-edn-gray font-body text-sm">
              Álbum de fotos ainda não configurado.
            </p>
            <p className="text-edn-gray/60 font-body text-xs mt-1">
              Adicione o link do Google Photos em <code>src/lib/constants.ts</code>
            </p>
          </div>
        ) : (
          <div className="rounded-2xl overflow-hidden bg-edn-cloud">
            <iframe
              src={`${GOOGLE_PHOTOS_ALBUM_URL}?authuser=0`}
              className="w-full"
              style={{ height: "500px", border: "none" }}
              allowFullScreen
              title="Álbum de fotos — Escola das Nações"
            />
            <div className="p-3 text-center">
              <a
                href={GOOGLE_PHOTOS_ALBUM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-edn-steel text-xs font-body underline"
              >
                Abrir álbum completo no Google Fotos →
              </a>
            </div>
          </div>
        )}
      </section>

      {/* User memories — client component handles uploads */}
      <MemoriesClient
        initialMemories={memories as any}
        userEmail={session!.user!.email!}
      />
    </div>
  );
}
