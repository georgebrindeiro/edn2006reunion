import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AdminClient } from "./AdminClient";
import { EventConfigEditor } from "./EventConfigEditor";
import { getEventConfig } from "@/lib/event-config";

export default async function AdminPage() {
  const session = await auth();
  if ((session?.user as any)?.role !== "ADMIN") redirect("/dashboard");

  const userQueryOptions = {
    include: {
      rsvp: { include: { guestAdults: true, guestChildren: true } },
      videoMessage: { select: { id: true } },
      _count: { select: { memoryTags: true } },
    },
    orderBy: { fullName: "asc" } as const,
  };

  const [activeUsers, deletedUsers, memoryCounts, eventConfig] = await Promise.all([
    prisma.user.findMany({ where: { deletedAt: null }, ...userQueryOptions }),
    prisma.user.findMany({ where: { deletedAt: { not: null } }, ...userQueryOptions }),
    prisma.memory.groupBy({ by: ["userId", "type"], _count: { _all: true } }),
    getEventConfig(),
  ]);

  // Build map: userId → { PHOTO: n, QUOTE: n, STORY: n, VIDEO: n }
  const memMap: Record<string, Record<string, number>> = {};
  for (const row of memoryCounts) {
    if (!memMap[row.userId]) memMap[row.userId] = {};
    memMap[row.userId][row.type] = row._count._all;
  }

  function toRow(u: (typeof activeUsers)[number]) {
    return {
      id:           u.id,
      fullName:     u.fullName,
      email:        u.email,
      phone:        u.phone,
      city:         u.city,
      state:        u.state,
      country:      u.country,
      lastActiveAt: u.lastActiveAt?.toISOString() ?? null,
      deletedAt:    u.deletedAt?.toISOString() ?? null,
      rsvp:         u.rsvp,
      metrics: {
        photos:        memMap[u.id]?.PHOTO ?? 0,
        quotes:        memMap[u.id]?.QUOTE ?? 0,
        stories:       memMap[u.id]?.STORY ?? 0,
        videoMessages: u.videoMessage ? 1 : 0,
        taggedIn:      u._count.memoryTags,
      },
    };
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-yellow-600 text-xs font-body uppercase tracking-widest mb-1">
          ⚙️ Painel admin
        </p>
        <h1 className="font-display text-edn-navy text-3xl font-bold">Administração</h1>
      </div>

      <AdminClient
        users={activeUsers.map(toRow) as any}
        deletedUsers={deletedUsers.map(toRow) as any}
      />
      <EventConfigEditor initialConfig={eventConfig} />
    </div>
  );
}
