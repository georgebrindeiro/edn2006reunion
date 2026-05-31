import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// PATCH /api/admin/rsvp/[id]  — id is userId, not rsvp id
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if ((session?.user as any)?.role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();

  const data: Record<string, unknown> = {};
  if ("isAttending"      in body) data.isAttending      = body.isAttending;
  if ("foodPreference"   in body) data.foodPreference   = body.foodPreference;
  if ("drinkPreference"  in body) data.drinkPreference  = body.drinkPreference;
  if ("paymentConfirmed" in body) data.paymentConfirmed = body.paymentConfirmed;
  if ("paymentProofUrl"  in body) data.paymentProofUrl  = body.paymentProofUrl ?? null;

  const rsvp = await prisma.rsvp.upsert({
    where:  { userId: id },
    update: data,
    create: {
      userId:           id,
      isAttending:      typeof data.isAttending === "boolean" ? data.isAttending : false,
      foodPreference:   (data.foodPreference  ?? "BARBECUE")     as "BARBECUE" | "VEGETARIAN" | "NO_FOOD",
      drinkPreference:  (data.drinkPreference ?? "NON_ALCOHOLIC") as "CHOPP" | "NON_ALCOHOLIC" | "OWN_DRINKS",
      paymentConfirmed: typeof data.paymentConfirmed === "boolean" ? data.paymentConfirmed : false,
      paymentProofUrl:  "paymentProofUrl" in data ? (data.paymentProofUrl as string | null) : null,
    },
  });
  return NextResponse.json(rsvp);
}
