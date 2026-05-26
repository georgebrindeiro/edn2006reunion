import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { UTApi } from "uploadthing/server";
import { NextResponse } from "next/server";

const utapi = new UTApi();

function extractFileKey(url: string): string | null {
  const match = url.match(/\/f\/([^/?#]+)/);
  return match?.[1] ?? null;
}

export async function GET() {
  const session = await auth();
  if ((session?.user as any)?.role !== "ADMIN") return NextResponse.json({}, { status: 403 });

  const [videos, fileList] = await Promise.all([
    prisma.memory.findMany({
      where:   { type: "VIDEO", mediaUrl: { not: null } },
      include: { user: { select: { fullName: true, id: true } } },
      orderBy: { createdAt: "desc" },
    }),
    utapi.listFiles({ limit: 2000 }).catch(() => ({ files: [] })),
  ]);

  // Build key → original filename map
  const nameMap = new Map<string, string>(
    (fileList.files ?? []).map((f: { key: string; name: string }) => [f.key, f.name])
  );

  return NextResponse.json(
    videos.map((v) => {
      const key      = v.mediaUrl ? extractFileKey(v.mediaUrl) : null;
      const fileName = key ? (nameMap.get(key) ?? null) : null;
      return {
        id:        v.id,
        mediaUrl:  v.mediaUrl!,
        title:     v.title,
        era:       v.era,
        approved:  v.approved,
        createdAt: v.createdAt.toISOString(),
        userId:    v.userId,
        userName:  v.user.fullName,
        fileName,
      };
    })
  );
}
