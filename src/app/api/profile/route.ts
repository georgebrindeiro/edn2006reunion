import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { normalizePhone } from "@/lib/utils";
import { geocodeCity } from "@/lib/geocode";

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

  // Check if location changed so we only geocode when needed
  const current = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { city: true, country: true, latitude: true, longitude: true },
  });

  const locationChanged =
    city !== current?.city || country !== current?.country;
  const needsGeocode = city && (locationChanged || !current?.latitude);

  let geoData: { latitude?: number; longitude?: number } = {};
  if (needsGeocode) {
    const coords = await geocodeCity(city, country);
    if (coords) geoData = { latitude: coords.lat, longitude: coords.lng };
  }

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
      ...geoData,
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
