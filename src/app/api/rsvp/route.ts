import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const {
    isAttending,
    guestAdults    = [],
    guestChildren  = [],
    joinsBarbecue  = false,
    drinksAlcohol  = false,
    drinkPreference,
    paymentRef,
  } = body;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Upsert RSVP
  const rsvp = await prisma.rsvp.upsert({
    where:  { userId: user.id },
    create: {
      userId:         user.id,
      isAttending,
      joinsBarbecue,
      drinksAlcohol,
      drinkPreference: drinkPreference ?? null,
      paymentRef:     paymentRef ?? null,
    },
    update: {
      isAttending,
      joinsBarbecue,
      drinksAlcohol,
      drinkPreference: drinkPreference ?? null,
      paymentRef:     paymentRef ?? null,
    },
  });

  // Replace guests
  await prisma.guest.deleteMany({ where: { adultRsvpId: rsvp.id } });
  await prisma.guest.deleteMany({ where: { childRsvpId: rsvp.id } });

  if (guestAdults.length > 0) {
    await prisma.guest.createMany({
      data: guestAdults.map((g: { fullName: string }) => ({
        fullName:    g.fullName,
        adultRsvpId: rsvp.id,
      })),
    });
  }

  if (guestChildren.length > 0) {
    await prisma.guest.createMany({
      data: guestChildren.map((g: { fullName: string; age?: number }) => ({
        fullName:    g.fullName,
        age:         g.age ?? null,
        childRsvpId: rsvp.id,
      })),
    });
  }

  return NextResponse.json({ ok: true });
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where:   { email: session.user.email },
    include: { rsvp: { include: { guestAdults: true, guestChildren: true } } },
  });

  return NextResponse.json(user?.rsvp ?? null);
}
