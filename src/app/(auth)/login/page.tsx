import { Metadata } from "next";
import { LoginForm } from "./LoginForm";
import { EdnLogo } from "@/components/logo/EdnLogo";
import { REUNION } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Entrar · EDN Reunion 2006",
};

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-edn-cloud flex flex-col relative">
      {/* Subtle mist decorative rings */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[480px] h-[480px] rounded-full border border-edn-mist/40" />
        <div className="absolute -top-20 -right-20 w-[280px] h-[280px] rounded-full border border-edn-mist/30" />
        <div className="absolute -bottom-32 -left-32 w-[400px] h-[400px] rounded-full border border-edn-mist/30" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center px-4 py-16">

        {/* Logo */}
        <div className="flex flex-col items-center mb-6 animate-fade-up">
          <EdnLogo size={110} showText={false} />
        </div>

        {/* Headline */}
        <div className="text-center mb-10 animate-fade-up animate-delay-200 opacity-0">
          <h1 className="font-display text-edn-navy text-4xl md:text-5xl font-bold leading-tight mb-4">
            EDN Class of {REUNION.classYear}
          </h1>
          <div className="inline-flex items-center gap-2 bg-edn-mist/50 rounded-full px-4 py-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-edn-steel" />
            <span className="text-edn-navy text-xs font-body tracking-widest uppercase">
              20 Anos · Reunion
            </span>
          </div>
        </div>

        {/* Form card */}
        <div className="w-full max-w-lg animate-fade-up animate-delay-400 opacity-0">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
