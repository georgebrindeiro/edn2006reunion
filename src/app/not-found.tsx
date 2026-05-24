import Link from "next/link";
import { EdnLogo } from "@/components/logo/EdnLogo";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-edn-navy flex flex-col items-center justify-center px-4 text-center">
      <EdnLogo size={80} variant="white" showText={false} className="mb-8 opacity-60" />

      <h1 className="font-display text-white text-5xl font-bold mb-2">404</h1>
      <p className="font-display text-edn-mist text-xl mb-4">
        Página não encontrada
      </p>
      <p className="font-body text-edn-mist/60 text-sm max-w-sm leading-relaxed mb-8">
        Se você estava tentando acessar um link de convite, ele pode ter sido rotacionado
        ou é inválido. Peça um novo link ao organizador.
      </p>

      <Link href="/login"
        className="bg-white text-edn-navy font-body font-semibold text-sm px-6 py-3 rounded-xl hover:bg-edn-mist transition-colors">
        Ir para o login
      </Link>
    </main>
  );
}
