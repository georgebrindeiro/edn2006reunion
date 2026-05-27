import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if ((session?.user as any)?.role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  const admin = await prisma.user.findUnique({ where: { email: session!.user!.email! } });

  const target = await prisma.user.update({
    where: { id },
    data: { deletedAt: null },
    select: { fullName: true },
  });

  if (admin) {
    await prisma.activityLog.create({
      data: {
        userId:  admin.id,
        action:  "USER_RESTORE",
        details: { targetUserId: id, targetName: target.fullName },
      },
    });
  }

  return NextResponse.json({ ok: true });
}
