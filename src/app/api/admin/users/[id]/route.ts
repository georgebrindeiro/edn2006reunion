import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if ((session?.user as any)?.role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();

  const data: Record<string, unknown> = {};
  if ("fullName" in body) data.fullName = body.fullName || null;
  if ("email"    in body) data.email    = body.email    || null;
  if ("phone"    in body) data.phone    = body.phone    || null;
  if ("city"     in body) data.city     = body.city     || null;
  if ("state"    in body) data.state    = body.state    || null;
  if ("country"  in body) data.country  = body.country  || null;
  if ("birthday" in body) data.birthday = body.birthday ? new Date(body.birthday) : null;

  const user = await prisma.user.update({ where: { id }, data });
  return NextResponse.json(user);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if ((session?.user as any)?.role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  if ((session!.user as any)?.id === id)
    return NextResponse.json({ error: "Cannot delete your own profile" }, { status: 400 });

  const admin = await prisma.user.findUnique({ where: { email: session!.user!.email! } });

  const target = await prisma.user.update({
    where: { id },
    data: { deletedAt: new Date() },
    select: { fullName: true },
  });

  if (admin) {
    await prisma.activityLog.create({
      data: {
        userId:  admin.id,
        action:  "USER_SOFT_DELETE",
        details: { targetUserId: id, targetName: target.fullName },
      },
    });
  }

  return NextResponse.json({ ok: true });
}

