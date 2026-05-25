import { prisma } from "@/lib/prisma";
import { WorldMap } from "@/components/WorldMap";

function getMapsUrl(city: string, country: string | null | undefined): string {
  const query = [city, country].filter(Boolean).join(", ");
  return `https://www.google.com/maps/search/${encodeURIComponent(query)}`;
}

export default async function ClassmatesPage() {
  const classmates = await prisma.user.findMany({
    where: { fullName: { not: null } },
    select: {
      id: true,
      fullName: true,
      city: true,
      state: true,
      country: true,
      latitude: true,
      longitude: true,
      photoThen: true,
      photoNow: true,
      studyPeriods: true,
    },
    orderBy: { fullName: "asc" },
  });

  return (
    <div className="space-y-8">
      <div>
        <p className="text-edn-steel text-xs font-body uppercase tracking-widest mb-1">
          EDN Class 2006
        </p>
        <h1 className="font-display text-edn-navy text-3xl font-bold">
          A Turma
        </h1>
        <p className="text-edn-gray font-body text-sm mt-1">
          {classmates.length} colegas cadastrados · Antes e depois
        </p>
      </div>

      {/* World map */}
      <section>
        <h2 className="font-body font-semibold text-edn-navy text-sm mb-3">
          Onde estão agora
        </h2>
        <WorldMap
          classmates={classmates}
          total={classmates.length}
        />
      </section>

      {/* Classmate cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {classmates.map((c) => (
          <div
            key={c.id}
            className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
          >
            {/* Then & Now photos */}
            <div className="grid grid-cols-2 h-40">
              <div className="bg-edn-cloud flex items-center justify-center relative overflow-hidden">
                {c.photoThen ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={c.photoThen}
                    alt={`${c.fullName} — antes`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center p-2">
                    <div className="text-3xl">🎒</div>
                    <p className="text-edn-gray/60 text-[10px] font-body mt-1">
                      Foto antiga
                    </p>
                  </div>
                )}
                <span className="absolute bottom-1 left-1 bg-black/40 text-white text-[9px] font-body px-1 rounded">
                  Antes
                </span>
              </div>
              <div className="bg-edn-cloud flex items-center justify-center relative overflow-hidden">
                {c.photoNow ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={c.photoNow}
                    alt={`${c.fullName} — hoje`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center p-2">
                    <div className="text-3xl">🙂</div>
                    <p className="text-edn-gray/60 text-[10px] font-body mt-1">
                      Foto atual
                    </p>
                  </div>
                )}
                <span className="absolute bottom-1 right-1 bg-edn-navy/60 text-white text-[9px] font-body px-1 rounded">
                  Hoje
                </span>
              </div>
            </div>

            {/* Info — no truncation so names are always visible */}
            <div className="p-3">
              <p
                className="font-body font-semibold text-edn-navy text-sm leading-snug"
                style={{ wordBreak: "break-word" }}
              >
                {c.fullName}
              </p>
              {c.city && (
                <a
                  href={getMapsUrl(c.city, c.country)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-edn-steel text-xs font-body mt-0.5 hover:text-edn-navy transition-colors inline-block leading-snug"
                  style={{ wordBreak: "break-word" }}
                >
                  📍 {c.city}
                  {c.country !== "Brasil" ? `, ${c.country}` : ""}
                </a>
              )}
              {c.studyPeriods.length > 0 && (
                <p className="text-edn-steel text-[10px] font-body mt-1">
                  EDN{" "}
                  {c.studyPeriods
                    .map((p) => `${p.yearStart}–${p.yearEnd}`)
                    .join(", ")}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {classmates.length === 0 && (
        <div className="text-center py-16 text-edn-gray font-body text-sm">
          Nenhum colega cadastrado ainda.
        </div>
      )}
    </div>
  );
}
