import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const COOLDOWN_MS = 5 * 60 * 1000; // update at most once every 5 minutes

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({}, { status: 401 });

  const user = await prisma.user.findUnique({
    where:  { id: session.user.id },
    select: { lastActiveAt: true },
  });

  const now = new Date();
  const stale = !user?.lastActiveAt || now.getTime() - user.lastActiveAt.getTime() > COOLDOWN_MS;
  if (stale) {
    await prisma.user.update({
      where: { id: session.user.id },
      data:  { lastActiveAt: now },
    });
  }

  return NextResponse.json({ ok: true });
}
