import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { EVENT, REUNION } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { CalendarDays, Clock, MapPin, Users, Camera, MessageCircle } from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();

  const dbUser = await prisma.user.findUnique({
    where:  { id: session!.user!.id },
    select: { fullName: true, rsvp: { select: { isAttending: true } } },
  });

  const firstName = dbUser?.fullName?.split(" ")[0] ?? "você";
  const hasRsvp   = !!dbUser?.rsvp;

  const dateSet  = !EVENT.date.includes("XX");
  const timeSet  = !EVENT.time.includes("XX");
  const venueSet = EVENT.venueName !== "Nome do Local";

  return (
    <div className="space-y-4">

      {/* ── Event + RSVP hero ──────────────────────────── */}
      <section className="bg-edn-navy rounded-2xl overflow-hidden">
        <div className="px-6 pt-6 pb-5">

          <p className="text-edn-steel-lt font-body text-sm mb-5">
            Olá, {firstName} 👋
          </p>

          <p className="text-edn-mist/40 text-[10px] font-body uppercase tracking-[0.2em] mb-1">
            20 Year Reunion
          </p>
          <h1 className="font-display text-white text-3xl md:text-4xl font-bold leading-snug mb-6">
            EDN Class of {REUNION.classYear}
          </h1>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <CalendarDays size={15} className="text-edn-steel-lt shrink-0 mt-0.5" />
              <span className="text-edn-mist text-sm font-body">
                {dateSet ? formatDate(EVENT.date) : "Data a confirmar em breve"}
              </span>
            </div>

            {timeSet && (
              <div className="flex items-start gap-3">
                <Clock size={15} className="text-edn-steel-lt shrink-0 mt-0.5" />
                <span className="text-edn-mist text-sm font-body">{EVENT.time}</span>
              </div>
            )}

            <div className="flex items-start gap-3">
              <MapPin size={15} className="text-edn-steel-lt shrink-0 mt-0.5" />
              <span className="text-edn-mist text-sm font-body">
                {venueSet
                  ? `${EVENT.venueName} · ${EVENT.venueCity}`
                  : "Local a confirmar em breve"}
              </span>
            </div>
          </div>
        </div>

        {/* RSVP CTA */}
        <div className="px-4 pb-4">
          <Link
            href="/rsvp"
            className={`block w-full font-body font-semibold text-sm text-center py-3.5 rounded-xl transition-colors ${
              hasRsvp
                ? "bg-white/10 text-edn-mist border border-white/15 hover:bg-white/15"
                : "bg-white text-edn-navy hover:bg-edn-mist"
            }`}
          >
            {hasRsvp ? "✓  Presença confirmada · Editar" : "Confirmar presença →"}
          </Link>
        </div>
      </section>

      {/* ── Secondary links ────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        {([
          { href: "/classmates", Icon: Users,         label: "Turma" },
          { href: "/memories",   Icon: Camera,        label: "Memórias" },
          { href: "/messages",   Icon: MessageCircle, label: "Mensagens" },
        ] as const).map(({ href, Icon, label }) => (
          <Link
            key={href}
            href={href}
            className="group bg-white border border-edn-mist/60 rounded-xl py-5 flex flex-col items-center gap-2.5 hover:border-edn-navy/30 hover:shadow-sm transition-all"
          >
            <Icon size={22} className="text-edn-navy" />
            <p className="text-edn-navy text-xs font-body font-semibold">{label}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
