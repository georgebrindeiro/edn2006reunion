import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const {
    fullName, birthday, phone,
    city, state, country,
    photoThen, photoNow,
    studyPeriods,
  } = await req.json();

  const user = await prisma.user.upsert({
    where:  { email: session.user.email },
    create: {
      email:    session.user.email,
      fullName, phone, city, state, country,
      photoThen: photoThen ?? null,
      photoNow:  photoNow  ?? null,
      birthday:  birthday ? new Date(birthday) : null,
    },
    update: {
      fullName, phone, city, state, country,
      photoThen: photoThen ?? null,
      photoNow:  photoNow  ?? null,
      birthday:  birthday ? new Date(birthday) : null,
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
