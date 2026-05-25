import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizePhone } from "@/lib/utils";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { passphrase, fullName, birthday, phone: rawPhone, email, city, state, country, studyPeriods } = body;

  if (passphrase !== process.env.LOGIN_PASSPHRASE) {
    return NextResponse.json({ error: "Senha da turma incorreta." }, { status: 403 });
  }

  const phone = rawPhone ? normalizePhone(rawPhone) : "";
  if (!phone || !fullName) {
    return NextResponse.json({ error: "Nome e telefone são obrigatórios." }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { phone } });
  if (existing?.fullName) {
    return NextResponse.json({ error: "Este número já está cadastrado." }, { status: 409 });
  }

  const user = await prisma.user.upsert({
    where:  { phone },
    create: {
      phone,
      fullName,
      birthday: birthday ? new Date(birthday) : null,
      email:    email || null,
      city:     city || null,
      state:    state || null,
      country:  country || null,
    },
    update: {
      fullName,
      birthday: birthday ? new Date(birthday) : null,
      email:    email || undefined,
      city:     city || undefined,
      state:    state || undefined,
      country:  country || undefined,
    },
  });

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
