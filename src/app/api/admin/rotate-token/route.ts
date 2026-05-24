import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateToken } from "@/lib/utils";

export async function POST() {
  const session = await auth();
  if ((session?.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Deactivate all existing tokens
  await prisma.inviteToken.updateMany({ data: { active: false } });

  // Create a new active token
  const token = await prisma.inviteToken.create({
    data: { token: generateToken(), active: true },
  });

  return NextResponse.json({ token: token.token });
}
