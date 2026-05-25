import { Metadata } from "next";
import { LoginForm } from "./LoginForm";
import { EdnLogo } from "@/components/logo/EdnLogo";
import { REUNION } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Entrar · EDN Reunion 2006",
};

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-edn-navy/85 flex flex-col relative">
      {/* Background decorative circles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-edn-navy-mid opacity-60" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-edn-navy-mid opacity-40" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-edn-navy-mid/20 blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center px-4 py-16">

        {/* Logo + title */}
        <div className="flex flex-col items-center mb-6 animate-fade-up">
          <EdnLogo size={100} showText={false} />
        </div>

        {/* Reunion headline */}
        <div className="text-center mb-10 animate-fade-up animate-delay-200 opacity-0">
          <h1 className="font-display text-white text-4xl md:text-5xl font-bold leading-tight mb-8">
            EDN Class of {REUNION.classYear}
          </h1>
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-edn-steel-lt" />
            <span className="text-edn-mist text-xs font-body tracking-widest uppercase">
              20 Anos · Reunion
            </span>
          </div>
        </div>

        {/* Login / register card */}
        <div className="w-full max-w-lg animate-fade-up animate-delay-400 opacity-0">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
