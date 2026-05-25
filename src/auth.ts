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
          const admin = await prisma.user.upsert({
            where:  { phone },
            update: { role: "ADMIN" },
            create: { phone, role: "ADMIN" },
          });
          return { id: admin.id, email: admin.email, role: admin.role };
        }

        if (passphrase !== process.env.LOGIN_PASSPHRASE) return null;

        const user = await prisma.user.findUnique({ where: { phone } });
        if (!user?.fullName) return null;

        return { id: user.id, email: user.email, role: user.role };
      },
    }),
  ],
});
