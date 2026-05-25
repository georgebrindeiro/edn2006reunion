import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { normalizePhone } from "@/lib/utils";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const {
    fullName, birthday, phone: rawPhone,
    city, state, country,
    photoThen, photoNow,
    studyPeriods,
  } = await req.json();

  const phone = rawPhone ? normalizePhone(rawPhone) : undefined;

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      fullName,
      ...(phone ? { phone } : {}),
      city,
      state,
      country,
      photoThen: photoThen ?? null,
      photoNow:  photoNow  ?? null,
      birthday:  birthday ? new Date(birthday) : null,
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
