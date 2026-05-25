import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { UTApi } from "uploadthing/server";

const utapi = new UTApi();

function extractFileKey(url: string): string | null {
  const match = url.match(/\/f\/([^/?#]+)/);
  return match?.[1] ?? null;
}

// Admin: update any fields on a memory (era, title, content, author)
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
  if ("era"     in body) data.era     = body.era     ?? null;
  if ("title"   in body) data.title   = body.title   ?? null;
  if ("content" in body) data.content = body.content ?? null;
  if ("author"  in body) data.author  = body.author  ?? null;

  const memory = await prisma.memory.update({ where: { id }, data });
  return NextResponse.json(memory);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if ((session?.user as any)?.role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  const memory = await prisma.memory.findUnique({ where: { id }, select: { mediaUrl: true } });

  // Delete from UploadThing before removing DB record
  if (memory?.mediaUrl) {
    const key = extractFileKey(memory.mediaUrl);
    if (key) {
      try { await utapi.deleteFiles(key); } catch { /* non-fatal */ }
    }
  }

  await prisma.memory.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
