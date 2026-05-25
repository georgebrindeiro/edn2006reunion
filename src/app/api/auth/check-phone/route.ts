import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizePhone } from "@/lib/utils";

export async function POST(req: NextRequest) {
  const { phone: rawPhone, passphrase } = await req.json();

  if (!rawPhone || !passphrase) {
    return NextResponse.json({ error: "Campos obrigatórios faltando." }, { status: 400 });
  }

  const isValid =
    passphrase === process.env.LOGIN_PASSPHRASE ||
    passphrase === process.env.ADMIN_PASSPHRASE;

  if (!isValid) {
    return NextResponse.json({ error: "Senha da turma incorreta." }, { status: 401 });
  }

  const phone = normalizePhone(rawPhone);
  const user = await prisma.user.findUnique({ where: { phone } });

  return NextResponse.json({ valid: true, hasProfile: !!user?.fullName });
}
