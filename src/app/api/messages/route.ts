import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // In production: receive multipart/form-data, upload to Uploadthing, get URL
  // For now: accept a JSON body with a videoUrl (for when Uploadthing is wired up)
  let videoUrl = "";

  const contentType = req.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const body = await req.json();
    videoUrl = body.videoUrl;
  } else {
    // Multipart — placeholder until Uploadthing is configured
    // TODO: wire up @uploadthing/react upload here
    return NextResponse.json(
      { error: "Configure Uploadthing to enable video uploads. See .env.example." },
      { status: 501 }
    );
  }

  if (!videoUrl)
    return NextResponse.json({ error: "videoUrl is required" }, { status: 400 });

  const message = await prisma.videoMessage.upsert({
    where:   { userId: user.id },
    create:  { userId: user.id, videoUrl },
    update:  { videoUrl },
    include: { user: { select: { fullName: true, photoNow: true } } },
  });

  return NextResponse.json(message);
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.email)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const messages = await prisma.videoMessage.findMany({
    where:   { approved: true },
    include: { user: { select: { fullName: true, photoNow: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(messages);
}
