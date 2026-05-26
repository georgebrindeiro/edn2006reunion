import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if ((session?.user as any)?.role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId") ?? undefined;
  const limit  = Math.min(parseInt(searchParams.get("limit") ?? "100"), 500);

  const logs = await prisma.activityLog.findMany({
    where:   userId ? { userId } : undefined,
    include: {
      user: { select: { id: true, fullName: true } },
    },
    orderBy: { createdAt: "desc" },
    take:    limit,
  });

  // Attach memory info for logs that reference a memory
  const memoryIds = logs.map((l) => l.memoryId).filter(Boolean) as string[];
  const memories  = memoryIds.length
    ? await prisma.memory.findMany({
        where:  { id: { in: memoryIds } },
        select: { id: true, type: true, title: true, mediaUrl: true },
      })
    : [];
  const memMap = new Map(memories.map((m) => [m.id, m]));

  const enriched = logs.map((l) => ({
    ...l,
    memory: l.memoryId ? (memMap.get(l.memoryId) ?? null) : null,
  }));

  return NextResponse.json(enriched);
}
