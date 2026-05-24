import { Metadata } from "next";
import { LoginForm } from "./LoginForm";
import { EdnLogo } from "@/components/logo/EdnLogo";
import { REUNION } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Entrar · EDN Reencontro 2006",
};

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-edn-navy flex flex-col relative overflow-hidden">
      {/* Background decorative circles */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-edn-navy-mid opacity-60" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-edn-navy-mid opacity-40" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-edn-navy-mid/20 blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center flex-1 px-4 py-16">

        {/* Logo + title */}
        <div className="flex flex-col items-center mb-10 animate-fade-up">
          <EdnLogo size={100} variant="white" showText={true} />
        </div>

        {/* Reunion headline */}
        <div className="text-center mb-10 animate-fade-up animate-delay-200 opacity-0">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-edn-steel-lt" />
            <span className="text-edn-mist text-xs font-body tracking-widest uppercase">
              20 Anos · Turma de {REUNION.classYear}
            </span>
          </div>
          <h1 className="font-display text-white text-4xl md:text-5xl font-bold leading-tight mb-3">
            Reencontro
          </h1>
          <p className="font-body text-edn-mist text-lg max-w-sm mx-auto leading-relaxed">
            Vinte anos depois, os Cidadãos do Mundo se reúnem de novo.
          </p>
        </div>

        {/* Login card */}
        <div className="w-full max-w-sm animate-fade-up animate-delay-400 opacity-0">
          <LoginForm />
        </div>

        {/* School quote */}
        <blockquote className="mt-12 text-center max-w-md animate-fade-up animate-delay-500 opacity-0">
          <p className="font-display text-edn-mist/70 text-sm italic leading-relaxed">
            &ldquo;{REUNION.schoolQuote}&rdquo;
          </p>
          <footer className="mt-2 text-edn-steel-lt/60 text-xs font-body tracking-widest uppercase">
            — {REUNION.quoteAuthor}
          </footer>
        </blockquote>
      </div>

      {/* Footer */}
      <div className="relative z-10 text-center pb-6">
        <p className="text-edn-steel-lt/40 text-xs font-body">
          Fundada em 01 de Setembro de 1980
        </p>
      </div>
    </main>
  );
}
