import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { REUNION } from "@/lib/constants";
import { getEventConfig } from "@/lib/event-config";
import { formatDate } from "@/lib/utils";
import { RsvpForm } from "./RsvpForm";
import { MapPin, CalendarDays, Info } from "lucide-react";

export default async function RsvpPage() {
  const session = await auth();
  const [user, EVENT] = await Promise.all([
    prisma.user.findUnique({
      where:   { id: session!.user!.id },
      include: { rsvp: { include: { guestAdults: true, guestChildren: true } } },
    }),
    getEventConfig(),
  ]);

  const eventReady = !EVENT.date.includes("XX");

  return (
    <div className="space-y-8 max-w-2xl mx-auto">

      {/* ── Page header ──────────────────────────────────────────── */}
      <div>
        <p className="text-edn-steel text-xs font-body uppercase tracking-widest mb-1">
          Reencontro {REUNION.classYear}
        </p>
        <h1 className="font-display text-edn-navy text-3xl font-bold">
          Confirmação de Presença
        </h1>
        <p className="text-edn-gray font-body text-sm mt-1">
          Confirme se você vai ao evento e traga seus convidados.
        </p>
      </div>

      {/* ── Event details card ───────────────────────────────────── */}
      <div className="bg-edn-navy rounded-2xl p-6 text-white space-y-4">
        <h2 className="font-display text-lg font-semibold">Detalhes do Evento</h2>

        <div className="grid gap-3">
          <div className="flex items-start gap-3">
            <CalendarDays size={18} className="text-edn-steel-lt mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-body font-medium">
                {eventReady ? formatDate(EVENT.date) : "Data a confirmar"}
              </p>
              {EVENT.time && !EVENT.time.includes("X") && (
                <p className="text-edn-mist/70 text-xs">{EVENT.time}</p>
              )}
            </div>
          </div>

          <div className="flex items-start gap-3">
            <MapPin size={18} className="text-edn-steel-lt mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-body font-medium">{EVENT.venueName}</p>
              <p className="text-edn-mist/70 text-xs">{EVENT.venueAddress}</p>
              <p className="text-edn-mist/70 text-xs">{EVENT.venueCity}</p>
              {EVENT.mapsUrl && !EVENT.mapsUrl.includes("...") && (
                <a
                  href={EVENT.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-edn-steel-lt text-xs underline mt-0.5 inline-block"
                >
                  Ver no mapa →
                </a>
              )}
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="text-edn-steel-lt mt-0.5 shrink-0 text-base leading-none">R$</div>
            <div>
              <p className="text-sm font-body font-medium">
                {EVENT.costPerPerson > 0
                  ? `R$ ${EVENT.costPerPerson} por adulto · R$ ${EVENT.costPerChild} por criança · R$ ${EVENT.costPerPersonReduced} se não for comer/beber`
                  : "Valor a confirmar"}
              </p>
              <p className="text-edn-mist/70 text-xs">Pagamento via PIX</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── RSVP Form ────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-5">
          <Info size={16} className="text-edn-steel" />
          <p className="text-edn-gray text-xs font-body">
            Você pode voltar e editar sua confirmação a qualquer momento.
          </p>
        </div>
        <RsvpForm existingRsvp={user?.rsvp as any} event={EVENT} />
      </div>
    </div>
  );
}
