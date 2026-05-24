import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateInviteToken } from "@/lib/utils";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { token, fullName, birthday, phone, email, city, state, country, studyPeriods } = body;

  // Validate token
  const valid = await validateInviteToken(token);
  if (!valid) {
    return NextResponse.json({ error: "Link de convite inválido ou expirado." }, { status: 403 });
  }

  if (!email || !fullName) {
    return NextResponse.json({ error: "Campos obrigatórios faltando." }, { status: 400 });
  }

  // Check if email already registered
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing?.fullName) {
    return NextResponse.json({ error: "Este e-mail já está cadastrado." }, { status: 409 });
  }

  // Upsert user profile
  const user = await prisma.user.upsert({
    where:  { email },
    create: {
      email,
      fullName,
      birthday:  birthday ? new Date(birthday) : null,
      phone,
      city,
      state,
      country,
    },
    update: {
      fullName,
      birthday:  birthday ? new Date(birthday) : null,
      phone,
      city,
      state,
      country,
    },
  });

  // Replace study periods
  await prisma.studyPeriod.deleteMany({ where: { userId: user.id } });
  if (studyPeriods?.length > 0) {
    await prisma.studyPeriod.createMany({
      data: studyPeriods.map((p: { yearStart: number; yearEnd: number }) => ({
        userId:    user.id,
        yearStart: p.yearStart,
        yearEnd:   p.yearEnd,
      })),
      skipDuplicates: true,
    });
  }

  return NextResponse.json({ ok: true });
}
