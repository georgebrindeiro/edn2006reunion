import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if ((session?.user as any)?.role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const user = await prisma.user.findUnique({ where: { email: session!.user!.email! } });

  const body = await req.json();
  const { ids, era, userId: newOwnerId, sortOrders } = body as {
    ids: string[];
    era?: string | null;
    userId?: string;
    sortOrders?: { id: string; sortOrder: number }[];
  };

  if (!Array.isArray(ids) || ids.length === 0)
    return NextResponse.json({ error: "ids required" }, { status: 400 });

  // Batch reorder by explicit position numbers
  if (sortOrders) {
    await Promise.all(
      sortOrders.map(({ id, sortOrder }) =>
        prisma.memory.update({ where: { id }, data: { sortOrder } })
      )
    );
    if (user) {
      await prisma.activityLog.create({
        data: {
          userId:  user.id,
          action:  "BATCH_REORDER",
          details: { count: sortOrders.length },
        },
      });
    }
    return NextResponse.json({ ok: true });
  }

  const data: Record<string, unknown> = {};
  let action = "BATCH_EDIT";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let details: any = { count: ids.length };

  if ("era" in body) {
    data.era = era ?? null;
    action   = "BATCH_ERA";
    details  = { era, count: ids.length };
  }
  if (newOwnerId) {
    data.userId = newOwnerId;
    action = "BATCH_OWNER";
    details = { newOwnerId, count: ids.length };
  }

  await prisma.memory.updateMany({ where: { id: { in: ids } }, data });

  if (user) {
    await prisma.activityLog.create({
      data: { userId: user.id, action, details },
    });
  }

  return NextResponse.json({ ok: true });
}
