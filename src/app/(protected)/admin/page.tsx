import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AdminClient } from "./AdminClient";

export default async function AdminPage() {
  const session = await auth();
  if ((session?.user as any)?.role !== "ADMIN") redirect("/dashboard");

  const [users, rsvps] = await Promise.all([
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
  ]);

  const attending = rsvps.filter((r) => r.isAttending);

  const stats = {
    total:      users.length,
    attending:  attending.length,
    notGoing:   rsvps.filter((r) => !r.isAttending).length,
    noRsvp:     users.length - rsvps.length,
    barbecue:   attending.filter((r) => r.foodPreference === "BARBECUE").length,
    vegetarian: attending.filter((r) => r.foodPreference === "VEGETARIAN").length,
    chopp:      attending.filter((r) => r.drinkPreference === "CHOPP").length,
    adults:     rsvps.reduce((acc, r) => acc + r.guestAdults.length, 0),
    children:   rsvps.reduce((acc, r) => acc + r.guestChildren.length, 0),
    withProof:  rsvps.filter((r) => !!r.paymentProofUrl).length,
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

      <AdminClient stats={stats} users={users as any} />
    </div>
  );
}
