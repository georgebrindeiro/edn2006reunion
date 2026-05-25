import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { normalizePhone } from "@/lib/utils";
import { geocodeCity } from "@/lib/geocode";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if ((session?.user as any)?.role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  const {
    fullName, birthday, phone: rawPhone,
    city, state, country,
    photoThen, photoNow,
    studyPeriods,
  } = await req.json();

  const phone = rawPhone ? normalizePhone(rawPhone) : undefined;

  const current = await prisma.user.findUnique({
    where: { id },
    select: { city: true, country: true, latitude: true, longitude: true },
  });

  if (!current) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const locationChanged = city !== current.city || country !== current.country;
  const needsGeocode = city && (locationChanged || !current.latitude);

  let geoData: { latitude?: number; longitude?: number } = {};
  if (needsGeocode) {
    // Reuse coords from another user in the same city to avoid Nominatim rate limits
    const existing = await prisma.user.findFirst({
      where: { city, country: country ?? null, latitude: { not: null }, NOT: { id } },
      select: { latitude: true, longitude: true },
    });
    if (existing?.latitude != null) {
      geoData = { latitude: existing.latitude, longitude: existing.longitude! };
    } else {
      const coords = await geocodeCity(city, country);
      if (coords) geoData = { latitude: coords.lat, longitude: coords.lng };
    }
  }

  const user = await prisma.user.update({
    where: { id },
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
