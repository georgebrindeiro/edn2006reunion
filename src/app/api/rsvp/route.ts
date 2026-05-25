import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const {
    isAttending,
    foodPreference  = "BARBECUE",
    drinkPreference = "NON_ALCOHOLIC",
    guestAdults     = [],
    guestChildren   = [],
    paymentProofUrl,
  } = body;

  const userId = session.user.id;

  const rsvp = await prisma.rsvp.upsert({
    where:  { userId },
    create: {
      userId,
      isAttending,
      foodPreference,
      drinkPreference,
      paymentProofUrl: paymentProofUrl ?? null,
    },
    update: {
      isAttending,
      foodPreference,
      drinkPreference,
      paymentProofUrl: paymentProofUrl ?? null,
    },
  });

  // Replace guests
  await prisma.guest.deleteMany({ where: { adultRsvpId: rsvp.id } });
  await prisma.guest.deleteMany({ where: { childRsvpId: rsvp.id } });

  if (guestAdults.length > 0) {
    await prisma.guest.createMany({
      data: guestAdults.map((g: { fullName: string; foodPreference?: string; drinkPreference?: string }) => ({
        fullName:        g.fullName,
        foodPreference:  g.foodPreference  ?? "BARBECUE",
        drinkPreference: g.drinkPreference ?? "NON_ALCOHOLIC",
        adultRsvpId:     rsvp.id,
      })),
    });
  }

  if (guestChildren.length > 0) {
    await prisma.guest.createMany({
      data: guestChildren.map((g: { fullName: string; age?: number; foodPreference?: string; drinkPreference?: string }) => ({
        fullName:        g.fullName,
        age:             g.age ?? null,
        foodPreference:  g.foodPreference  ?? "BARBECUE",
        drinkPreference: g.drinkPreference ?? "NON_ALCOHOLIC",
        childRsvpId:     rsvp.id,
      })),
    });
  }

  return NextResponse.json({ ok: true });
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where:   { id: session.user.id },
    include: { rsvp: { include: { guestAdults: true, guestChildren: true } } },
  });

  return NextResponse.json(user?.rsvp ?? null);
}
