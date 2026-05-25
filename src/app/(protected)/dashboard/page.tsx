import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { EdnLogo } from "@/components/logo/EdnLogo";
import { EVENT, REUNION } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import {
  CalendarDays,
  MapPin,
  Users,
  Camera,
  MessageCircle,
  ClipboardCheck,
} from "lucide-react";

async function getStats() {
  const [totalMembers, totalRsvpYes, totalRsvpNo] = await Promise.all([
    prisma.user.count(),
    prisma.rsvp.count({ where: { isAttending: true } }),
    prisma.rsvp.count({ where: { isAttending: false } }),
  ]);
  return { totalMembers, totalRsvpYes, totalRsvpNo };
}

function Countdown({ targetDate }: { targetDate: string }) {
  // Rendered server-side as static for now; swap for a client component if you want live countdown
  if (!targetDate || targetDate.includes("XX")) {
    return (
      <p className="text-edn-mist font-body text-sm">Data a confirmar em breve</p>
    );
  }
  const diff = new Date(targetDate).getTime() - Date.now();
  const days = Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  return (
    <div className="flex items-end gap-1">
      <span className="font-display text-5xl font-bold text-white">{days}</span>
      <span className="text-edn-mist font-body mb-1.5">dias</span>
    </div>
  );
}

export default async function DashboardPage() {
  const session = await auth();
  const stats   = await getStats();

  const dbUser = await prisma.user.findUnique({
    where:  { id: session!.user!.id },
    select: { fullName: true, rsvp: { select: { isAttending: true } } },
  });

  const firstName = dbUser?.fullName?.split(" ")[0] ?? "Cidadão";
  const hasRsvp   = dbUser?.rsvp !== null;

  const QUICK_LINKS = [
    {
      href:  "/rsvp",
      icon:  <ClipboardCheck size={22} />,
      label: "Confirmar presença",
      desc:  hasRsvp ? "Sua resposta já foi registrada" : "Ainda não confirmaste",
      cta:   hasRsvp ? "Ver / editar" : "Confirmar agora",
      accent: !hasRsvp,
    },
    {
      href:  "/classmates",
      icon:  <Users size={22} />,
      label: "A turma",
      desc:  `${stats.totalMembers} colegas registrados`,
      cta:   "Ver turma",
      accent: false,
    },
    {
      href:  "/memories",
      icon:  <Camera size={22} />,
      label: "Memórias",
      desc:  "Fotos, histórias e muito mais",
      cta:   "Explorar",
      accent: false,
    },
    {
      href:  "/messages",
      icon:  <MessageCircle size={22} />,
      label: "Mensagens em vídeo",
      desc:  "Deixe uma mensagem para a turma",
      cta:   "Ver mensagens",
      accent: false,
    },
  ];

  return (
    <div className="space-y-8">

      {/* ── Hero banner ──────────────────────────────────────────── */}
      <section className="bg-edn-navy rounded-2xl p-6 md:p-10 flex flex-col md:flex-row items-center gap-8 overflow-hidden relative">
        {/* Background figures watermark */}
        <div className="absolute right-0 top-0 bottom-0 opacity-5 flex items-center pr-6 pointer-events-none">
          <EdnLogo size={220} showText={false} />
        </div>

        <div className="flex-1 relative z-10">
          <p className="text-edn-steel-lt font-body text-sm uppercase tracking-widest mb-2">
            Olá, {firstName} 👋
          </p>
          <h1 className="font-display text-white text-3xl md:text-4xl font-bold leading-tight mb-3">
            Bem-vindo ao Reencontro<br />
            <span className="text-edn-mist">da Turma de {REUNION.classYear}</span>
          </h1>
          <p className="text-edn-mist/80 font-body text-sm leading-relaxed max-w-md">
            {REUNION.yearsAgo} anos depois, os Cidadãos do Mundo se reencontram.
            Confirme sua presença e compartilhe suas memórias.
          </p>
        </div>

        {/* Countdown */}
        <div className="bg-white/10 rounded-xl p-6 text-center min-w-[160px] relative z-10">
          <p className="text-edn-steel-lt text-xs font-body uppercase tracking-wider mb-2">
            Faltam
          </p>
          <Countdown targetDate={EVENT.date} />
          <p className="text-edn-mist/60 text-xs font-body mt-1">para o evento</p>
        </div>
      </section>

      {/* ── Event info strip ─────────────────────────────────────── */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-5 flex items-center gap-4 shadow-sm">
          <div className="w-10 h-10 rounded-full bg-edn-cloud flex items-center justify-center text-edn-navy shrink-0">
            <CalendarDays size={20} />
          </div>
          <div>
            <p className="text-xs text-edn-gray font-body uppercase tracking-wide">Data</p>
            <p className="font-display text-edn-navy font-semibold">
              {EVENT.date.includes("XX") ? "A confirmar" : formatDate(EVENT.date)}
            </p>
            <p className="text-edn-gray text-sm font-body">{EVENT.time}h</p>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 flex items-center gap-4 shadow-sm">
          <div className="w-10 h-10 rounded-full bg-edn-cloud flex items-center justify-center text-edn-navy shrink-0">
            <MapPin size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-edn-gray font-body uppercase tracking-wide">Local</p>
            <p className="font-display text-edn-navy font-semibold truncate">
              {EVENT.venueName}
            </p>
            <p className="text-edn-gray text-sm font-body">{EVENT.venueCity}</p>
          </div>
        </div>
      </section>

      {/* ── Stats ────────────────────────────────────────────────── */}
      <section className="grid grid-cols-3 gap-3">
        {[
          { label: "Cadastrados",  value: stats.totalMembers },
          { label: "Confirmados",  value: stats.totalRsvpYes },
          { label: "Não vão",      value: stats.totalRsvpNo  },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl p-4 text-center shadow-sm">
            <p className="font-display text-edn-navy text-3xl font-bold">{s.value}</p>
            <p className="text-edn-gray text-xs font-body mt-0.5">{s.label}</p>
          </div>
        ))}
      </section>

      {/* ── Quick links ──────────────────────────────────────────── */}
      <section>
        <h2 className="font-display text-edn-navy text-lg font-semibold mb-4">
          O que deseja fazer?
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {QUICK_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`group bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-all flex items-start gap-4 ${
                link.accent ? "ring-2 ring-edn-navy" : ""
              }`}
            >
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                link.accent
                  ? "bg-edn-navy text-white"
                  : "bg-edn-cloud text-edn-navy group-hover:bg-edn-navy group-hover:text-white"
              }`}>
                {link.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-body font-semibold text-edn-navy text-sm">{link.label}</p>
                <p className="text-edn-gray text-xs font-body mt-0.5">{link.desc}</p>
                <p className={`text-xs font-body font-semibold mt-2 ${
                  link.accent ? "text-edn-navy" : "text-edn-steel"
                }`}>
                  {link.cta} →
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
