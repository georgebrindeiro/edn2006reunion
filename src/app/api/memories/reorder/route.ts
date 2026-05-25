import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Admin: save photo sort order
// Body: { ids: string[] } — ordered array of memory IDs
export async function POST(req: NextRequest) {
  const session = await auth();
  if ((session?.user as any)?.role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { ids } = await req.json() as { ids: string[] };
  if (!Array.isArray(ids)) return NextResponse.json({ error: "ids required" }, { status: 400 });

  await prisma.$transaction(
    ids.map((id, i) => prisma.memory.update({ where: { id }, data: { sortOrder: i } }))
  );

  return NextResponse.json({ ok: true });
}
