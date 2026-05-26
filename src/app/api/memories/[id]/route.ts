import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { UTApi } from "uploadthing/server";

const utapi = new UTApi();

function extractFileKey(url: string): string | null {
  const match = url.match(/\/f\/([^/?#]+)/);
  return match?.[1] ?? null;
}

// Users can edit their own memories (title, era); admins can edit any field
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.email)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { id } = await params;
  const memory = await prisma.memory.findUnique({ where: { id } });
  if (!memory) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isAdmin  = (session.user as any)?.role === "ADMIN";
  const isOwner  = memory.userId === user.id;
  if (!isAdmin && !isOwner)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const data: Record<string, unknown> = {};

  if ("era"      in body) data.era      = body.era      ?? null;
  if ("title"    in body) data.title    = body.title    ?? null;
  if ("approved" in body && (isAdmin || isOwner)) data.approved = body.approved;

  // Admin-only fields
  if (isAdmin) {
    if ("content"   in body) data.content   = body.content   ?? null;
    if ("author"    in body) data.author    = body.author    ?? null;
    if ("userId"    in body) data.userId    = body.userId;
    if ("sortOrder" in body) data.sortOrder = body.sortOrder;
    if ("mediaUrl"  in body) data.mediaUrl  = body.mediaUrl  ?? null;
  }

  const updated = await prisma.memory.update({ where: { id }, data });

  // Log activity
  const action = "approved" in body && body.approved === false ? "SOFT_DELETE"
    : "approved" in body && body.approved === true ? "RESTORE"
    : "EDIT";
  await prisma.activityLog.create({
    data: {
      userId:   user.id,
      action,
      memoryId: id,
      details:  { fields: Object.keys(data) },
    },
  });

  return NextResponse.json(updated);
}

// Admin-only hard delete; removes from UploadThing too
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if ((session?.user as any)?.role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const user = await prisma.user.findUnique({ where: { email: session!.user!.email! } });

  const { id } = await params;
  const memory = await prisma.memory.findUnique({ where: { id }, select: { mediaUrl: true } });

  if (memory?.mediaUrl) {
    const key = extractFileKey(memory.mediaUrl);
    if (key) {
      try { await utapi.deleteFiles(key); } catch { /* non-fatal */ }
    }
  }

  await prisma.memory.delete({ where: { id } });

  if (user) {
    await prisma.activityLog.create({
      data: { userId: user.id, action: "ADMIN_DELETE", memoryId: id },
    });
  }

  return NextResponse.json({ ok: true });
}
