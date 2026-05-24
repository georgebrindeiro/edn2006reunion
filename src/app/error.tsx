"use client";

import { useEffect } from "react";
import { EdnLogo } from "@/components/logo/EdnLogo";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-edn-navy flex flex-col items-center justify-center px-4 text-center">
        <EdnLogo size={72} variant="white" showText={false} className="mb-8 opacity-60" />
        <h1 className="font-display text-white text-2xl font-bold mb-2">
          Algo deu errado
        </h1>
        <p className="font-body text-edn-mist/70 text-sm max-w-sm mb-6">
          Ocorreu um erro inesperado. Tente novamente.
        </p>
        <button onClick={reset}
          className="bg-white text-edn-navy font-body font-semibold text-sm px-6 py-3 rounded-xl hover:bg-edn-mist transition-colors">
          Tentar novamente
        </button>
      </body>
    </html>
  );
}
