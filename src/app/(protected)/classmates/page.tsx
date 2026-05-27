import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ClassmatesView } from "@/components/ClassmatesView";

export default async function ClassmatesPage() {
  const session = await auth();
  const isAdmin = (session?.user as any)?.role === "ADMIN";

  const classmates = await prisma.user.findMany({
    where: { fullName: { not: null }, deletedAt: null },
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

  const classmatesSerialized = classmates.map((c) => ({
    ...c,
    birthday: c.birthday ? c.birthday.toISOString().split("T")[0] : null,
  }));

  return (
    <div className="space-y-6">
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

      <ClassmatesView classmates={classmatesSerialized} isAdmin={isAdmin} />
    </div>
  );
}
