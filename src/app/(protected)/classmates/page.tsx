import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { WorldMap } from "@/components/WorldMap";
import { ClassmatesGrid } from "@/components/ClassmatesGrid";

export default async function ClassmatesPage() {
  const session = await auth();
  const isAdmin = (session?.user as any)?.role === "ADMIN";

  const classmates = await prisma.user.findMany({
    where: { fullName: { not: null } },
    select: {
      id: true,
      fullName: true,
      birthday: true,
      phone: true,
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

  // Serialize dates so they pass through the server→client boundary
  const classmatesSerialized = classmates.map((c) => ({
    ...c,
    birthday: c.birthday ? c.birthday.toISOString().split("T")[0] : null,
  }));

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
      <ClassmatesGrid classmates={classmatesSerialized} isAdmin={isAdmin} />

      {classmates.length === 0 && (
        <div className="text-center py-16 text-edn-gray font-body text-sm">
          Nenhum colega cadastrado ainda.
        </div>
      )}
    </div>
  );
}
