import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Any logged-in user can tag; returns current tags
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.email)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const tags = await prisma.memoryTag.findMany({
    where:   { memoryId: id },
    include: { user: { select: { id: true, fullName: true, photoNow: true } } },
  });
  return NextResponse.json(tags);
}

// POST { userId } — add a tag
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.email)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { userId } = await req.json();

  const tag = await prisma.memoryTag.upsert({
    where:  { memoryId_userId: { memoryId: id, userId } },
    create: { memoryId: id, userId },
    update: {},
    include: { user: { select: { id: true, fullName: true, photoNow: true } } },
  });
  return NextResponse.json(tag);
}

// DELETE { userId } — remove a tag
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.email)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { userId } = await req.json();

  await prisma.memoryTag.deleteMany({ where: { memoryId: id, userId } });
  return NextResponse.json({ ok: true });
}
