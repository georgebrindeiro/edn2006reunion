import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if ((session?.user as any)?.role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const photos = await prisma.memory.findMany({
    where:   { type: "PHOTO" },
    include: { user: { select: { id: true, fullName: true } } },
    orderBy: [{ era: "asc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(photos);
}
