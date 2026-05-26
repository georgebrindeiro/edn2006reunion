import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if ((session?.user as any)?.role !== "ADMIN") return NextResponse.json({}, { status: 403 });

  const videos = await prisma.memory.findMany({
    where:   { type: "VIDEO", mediaUrl: { not: null } },
    include: { user: { select: { fullName: true, id: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    videos.map((v) => ({
      id:        v.id,
      mediaUrl:  v.mediaUrl!,
      title:     v.title,
      era:       v.era,
      approved:  v.approved,
      createdAt: v.createdAt.toISOString(),
      userId:    v.userId,
      userName:  v.user.fullName,
    }))
  );
}
