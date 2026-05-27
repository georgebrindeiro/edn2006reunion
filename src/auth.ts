import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "@/auth.config";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "passphrase",
      credentials: {
        phone:      { label: "Phone",      type: "tel" },
        passphrase: { label: "Passphrase", type: "password" },
      },
      async authorize(credentials) {
        const { prisma } = await import("@/lib/prisma");
        const { normalizePhone } = await import("@/lib/utils");
        const { phone: rawPhone, passphrase } = credentials as {
          phone: string;
          passphrase: string;
        };

        if (!rawPhone || !passphrase) return null;
        const phone = normalizePhone(rawPhone);
        if (!phone) return null;

        if (passphrase === process.env.ADMIN_PASSPHRASE) {
          const existing = await prisma.user.findUnique({ where: { phone }, select: { lastLoginAt: true } });
          const admin = await prisma.user.upsert({
            where:  { phone },
            update: { role: "ADMIN", previousLoginAt: existing?.lastLoginAt ?? null, lastLoginAt: new Date() },
            create: { phone, role: "ADMIN", lastLoginAt: new Date() },
          });
          return { id: admin.id, email: admin.email, role: admin.role };
        }

        if (passphrase !== process.env.LOGIN_PASSPHRASE) return null;

        const user = await prisma.user.findUnique({ where: { phone } });
        if (!user?.fullName) return null;
        if (user.deletedAt)  return null;

        await prisma.user.update({
          where: { id: user.id },
          data:  { previousLoginAt: user.lastLoginAt ?? null, lastLoginAt: new Date() },
        });

        return { id: user.id, email: user.email, role: user.role };
      },
    }),
  ],
});
