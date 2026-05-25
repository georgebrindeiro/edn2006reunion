import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { REUNION } from "@/lib/constants";
import { getEventConfig } from "@/lib/event-config";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { CalendarDays, Clock, MapPin, Users, Camera, MessageCircle, ExternalLink } from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();

  const [dbUser, EVENT] = await Promise.all([
    prisma.user.findUnique({
      where:  { id: session!.user!.id },
      select: {
        fullName: true,
        rsvp: {
          select: {
            isAttending:     true,
            paymentProofUrl: true,
            paymentConfirmed: true,
          },
        },
      },
    }),
    getEventConfig(),
  ]);

  const firstName = dbUser?.fullName?.split(" ")[0] ?? "você";
  const rsvp      = dbUser?.rsvp;
  const hasRsvp   = !!rsvp;

  const dateSet  = !EVENT.date.includes("XX");
  const timeSet  = !EVENT.time.includes("XX");
  const venueSet = !!EVENT.venueName && EVENT.venueName !== "Nome do Local";
  const mapsSet  = !!EVENT.mapsUrl && !EVENT.mapsUrl.includes("...");

  // RSVP status buckets
  const noRsvp         = !hasRsvp;
  const notAttending   = hasRsvp && !rsvp!.isAttending;
  const attending      = hasRsvp && rsvp!.isAttending;
  const paymentPending = attending && !rsvp!.paymentProofUrl;
  const paymentDone    = attending && !!rsvp!.paymentProofUrl;

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
              <div>
                <span className="text-edn-mist text-sm font-body">
                  {dateSet ? formatDate(EVENT.date) : "Data a confirmar em breve"}
                </span>
                {timeSet && (
                  <span className="text-edn-mist/60 text-sm font-body"> · {EVENT.time}</span>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin size={15} className="text-edn-steel-lt shrink-0 mt-0.5" />
              {venueSet ? (
                <div className="space-y-0.5">
                  <p className="text-edn-mist text-sm font-body font-medium">{EVENT.venueName}</p>
                  {EVENT.venueAddress && (
                    <p className="text-edn-mist/60 text-xs font-body">{EVENT.venueAddress}</p>
                  )}
                  <p className="text-edn-mist/60 text-xs font-body">{EVENT.venueCity}</p>
                  {mapsSet && (
                    <a
                      href={EVENT.mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-edn-steel-lt text-xs font-body hover:text-white transition-colors mt-0.5"
                    >
                      Ver no mapa <ExternalLink size={11} />
                    </a>
                  )}
                </div>
              ) : (
                <span className="text-edn-mist text-sm font-body">Local a confirmar em breve</span>
              )}
            </div>
          </div>
        </div>

        {/* ── RSVP status strip ──────────────────────────────────── */}
        <div className="px-4 pb-4 space-y-2">

          {/* No RSVP — urgent yellow CTA */}
          {noRsvp && (
            <Link
              href="/rsvp"
              className="block w-full font-body font-bold text-sm text-center py-3.5 rounded-xl transition-colors bg-yellow-400 text-yellow-900 hover:bg-yellow-300 shadow-lg"
            >
              ⚠️ Confirmar presença — não perca o prazo!
            </Link>
          )}

          {/* Not attending */}
          {notAttending && (
            <Link
              href="/rsvp"
              className="block w-full font-body font-semibold text-sm text-center py-3.5 rounded-xl transition-colors bg-white/10 text-edn-mist border border-white/15 hover:bg-white/15"
            >
              ✗ Não vou comparecer · Editar
            </Link>
          )}

          {/* Attending — payment pending */}
          {paymentPending && (
            <>
              <Link
                href="/rsvp"
                className="block w-full font-body font-bold text-sm text-center py-3.5 rounded-xl transition-colors bg-white text-edn-navy hover:bg-edn-mist shadow"
              >
                ✅ Presença confirmada · Editar
              </Link>
              <Link
                href="/rsvp"
                className="block w-full font-body font-semibold text-xs text-center py-2.5 rounded-xl bg-yellow-400/20 text-yellow-200 border border-yellow-400/30 hover:bg-yellow-400/30 transition-colors"
              >
                ⚠️ Pagamento pendente — envie o comprovante
              </Link>
            </>
          )}

          {/* Attending — payment proof sent */}
          {paymentDone && (
            <Link
              href="/rsvp"
              className="block w-full font-body font-semibold text-sm text-center py-3.5 rounded-xl transition-colors bg-white text-edn-navy hover:bg-edn-mist shadow"
            >
              {rsvp!.paymentConfirmed
                ? "✅ Presença confirmada · Pago ✓"
                : "✅ Presença confirmada · Comprovante enviado"}
            </Link>
          )}
        </div>
      </section>

      {/* ── Secondary links ────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        {([
          { href: "/classmates", Icon: Users,         label: "Turma"     },
          { href: "/memories",   Icon: Camera,        label: "Memórias"  },
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
