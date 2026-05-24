import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ProfileForm } from "./ProfileForm";

export default async function ProfileEditPage() {
  const session = await auth();
  const user = await prisma.user.findUnique({
    where:   { email: session!.user!.email! },
    include: { studyPeriods: true },
  });

  return (
    <div className="max-w-lg mx-auto space-y-8">
      <div>
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

      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <ProfileForm user={user as any} />
      </div>
    </div>
  );
}
