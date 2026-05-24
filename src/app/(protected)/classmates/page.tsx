import { prisma } from "@/lib/prisma";

export default async function ClassmatesPage() {
  const classmates = await prisma.user.findMany({
    where:   { fullName: { not: null } },
    include: { studyPeriods: true },
    orderBy: { fullName: "asc" },
  });

  return (
    <div className="space-y-8">
      <div>
        <p className="text-edn-steel text-xs font-body uppercase tracking-widest mb-1">
          Turma de 2006
        </p>
        <h1 className="font-display text-edn-navy text-3xl font-bold">
          A Turma
        </h1>
        <p className="text-edn-gray font-body text-sm mt-1">
          {classmates.length} colegas cadastrados · Antes e depois
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {classmates.map((c) => (
          <div key={c.id} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            {/* Then & Now photos */}
            <div className="grid grid-cols-2 h-40">
              <div className="bg-edn-cloud flex items-center justify-center relative overflow-hidden">
                {c.photoThen ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.photoThen} alt={`${c.fullName} — antes`}
                    className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center p-2">
                    <div className="text-3xl">🎒</div>
                    <p className="text-edn-gray/60 text-[10px] font-body mt-1">Foto antiga</p>
                  </div>
                )}
                <span className="absolute bottom-1 left-1 bg-black/40 text-white text-[9px] font-body px-1 rounded">
                  Antes
                </span>
              </div>
              <div className="bg-edn-cloud flex items-center justify-center relative overflow-hidden">
                {c.photoNow ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.photoNow} alt={`${c.fullName} — hoje`}
                    className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center p-2">
                    <div className="text-3xl">🙂</div>
                    <p className="text-edn-gray/60 text-[10px] font-body mt-1">Foto atual</p>
                  </div>
                )}
                <span className="absolute bottom-1 right-1 bg-edn-navy/60 text-white text-[9px] font-body px-1 rounded">
                  Hoje
                </span>
              </div>
            </div>

            {/* Info */}
            <div className="p-3">
              <p className="font-body font-semibold text-edn-navy text-sm truncate">
                {c.fullName}
              </p>
              {c.city && (
                <p className="text-edn-gray text-xs font-body truncate mt-0.5">
                  📍 {c.city}{c.country !== "Brasil" ? `, ${c.country}` : ""}
                </p>
              )}
              {c.studyPeriods.length > 0 && (
                <p className="text-edn-steel text-[10px] font-body mt-1">
                  EDN {c.studyPeriods.map((p) => `${p.yearStart}–${p.yearEnd}`).join(", ")}
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
