import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const body = await req.json();

  if (Array.isArray(body.items)) {
    const created = await prisma.memory.createManyAndReturn({
      data: body.items.map((item: { mediaUrl: string; title?: string; era?: string; type?: string }) => ({
        userId:   user.id,
        type:     (item.type === "VIDEO" ? "VIDEO" : "PHOTO") as "PHOTO" | "VIDEO",
        mediaUrl: item.mediaUrl,
        title:    item.title ?? null,
        era:      item.era ?? null,
      })),
      include: { user: { select: { fullName: true } } },
    });

    await prisma.activityLog.create({
      data: {
        userId:  user.id,
        action:  "UPLOAD",
        details: { type: "PHOTO", count: created.length },
      },
    });

    return NextResponse.json(created);
  }

  const { type, title, content, mediaUrl, era, author } = body;
  const memory = await prisma.memory.create({
    data:    { userId: user.id, type, title, content, mediaUrl, era: era ?? null, author: author ?? null },
    include: { user: { select: { fullName: true } } },
  });

  await prisma.activityLog.create({
    data: {
      userId:   user.id,
      action:   "UPLOAD",
      memoryId: memory.id,
      details:  { type, title: title ?? null },
    },
  });

  return NextResponse.json(memory);
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.email)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const memories = await prisma.memory.findMany({
    where:   { approved: true },
    include: { user: { select: { fullName: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(memories);
}
