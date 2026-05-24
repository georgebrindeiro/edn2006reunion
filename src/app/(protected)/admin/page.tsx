import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AdminClient } from "./AdminClient";

export default async function AdminPage() {
  const session = await auth();
  if ((session?.user as any)?.role !== "ADMIN") redirect("/dashboard");

  const [users, rsvps, token] = await Promise.all([
    prisma.user.findMany({
      include: {
        rsvp: { include: { guestAdults: true, guestChildren: true } },
        studyPeriods: true,
      },
      orderBy: { fullName: "asc" },
    }),
    prisma.rsvp.findMany({
      include: { guestAdults: true, guestChildren: true },
    }),
    prisma.inviteToken.findFirst({ where: { active: true }, orderBy: { createdAt: "desc" } }),
  ]);

  const stats = {
    total:      users.length,
    attending:  rsvps.filter((r) => r.isAttending).length,
    notGoing:   rsvps.filter((r) => !r.isAttending).length,
    noRsvp:     users.length - rsvps.length,
    barbecue:   rsvps.filter((r) => r.joinsBarbecue).length,
    alcohol:    rsvps.filter((r) => r.drinksAlcohol).length,
    adults:     rsvps.reduce((acc, r) => acc + r.guestAdults.length, 0),
    children:   rsvps.reduce((acc, r) => acc + r.guestChildren.length, 0),
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-yellow-600 text-xs font-body uppercase tracking-widest mb-1">
            ⚙️ Painel admin
          </p>
          <h1 className="font-display text-edn-navy text-3xl font-bold">
            Administração
          </h1>
        </div>
      </div>

      <AdminClient
        stats={stats}
        users={users as any}
        currentToken={token?.token ?? null}
      />
    </div>
  );
}
