import { notFound } from "next/navigation";
import { validateInviteToken } from "@/lib/utils";
import { EdnLogo } from "@/components/logo/EdnLogo";
import { RegisterForm } from "./RegisterForm";

interface Props {
  params: { token: string };
}

export default async function RegisterPage({ params }: Props) {
  const valid = await validateInviteToken(params.token);
  if (!valid) notFound();

  return (
    <main className="min-h-screen bg-edn-navy/85 py-12 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <EdnLogo size={72} showText={true} className="mx-auto mb-4" />
          <h1 className="font-display text-edn-white text-2xl font-bold mb-2">
            Crie seu perfil
          </h1>
          <p className="text-edn-white font-body text-sm">
            Preencha suas informações para sabermos quem você é.
          </p>
        </div>

        {/* Form card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <RegisterForm token={params.token} />
        </div>
      </div>
    </main>
  );
}
