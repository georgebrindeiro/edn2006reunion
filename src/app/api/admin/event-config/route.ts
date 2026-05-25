import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { EVENT } from "@/lib/constants";

export async function GET() {
  const session = await auth();
  if ((session?.user as any)?.role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const config = await prisma.eventConfig.findUnique({ where: { id: "singleton" } });
  return NextResponse.json(config ?? { ...EVENT, id: "singleton" });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if ((session?.user as any)?.role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();

  const allowedFields = [
    "date", "time", "venueName", "venueAddress", "venueCity", "mapsUrl",
    "costPerPerson", "costPerPersonReduced", "costPerChild", "currency",
    "pixKey", "pixRecipientName", "pixCity", "whatsIncluded",
  ];
  const data: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (field in body) data[field] = body[field];
  }

  const config = await prisma.eventConfig.upsert({
    where:  { id: "singleton" },
    create: { id: "singleton", ...data } as any,
    update: data,
  });

  return NextResponse.json(config);
}
