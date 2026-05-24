import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "@/auth.config";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "passphrase",
      credentials: {
        email:      { label: "Email",      type: "email" },
        passphrase: { label: "Passphrase", type: "password" },
      },
      async authorize(credentials) {
        const { prisma } = await import("@/lib/prisma");
        const { email, passphrase } = credentials as {
          email: string;
          passphrase: string;
        };

        if (!email || !passphrase) return null;

        if (passphrase === process.env.ADMIN_PASSPHRASE) {
          const admin = await prisma.user.upsert({
            where:  { email },
            update: { role: "ADMIN" },
            create: { email, role: "ADMIN" },
          });
          return { id: admin.id, email: admin.email, role: admin.role };
        }

        if (passphrase !== process.env.LOGIN_PASSPHRASE) return null;

        const user = await prisma.user.upsert({
          where:  { email },
          update: {},
          create: { email, role: "MEMBER" },
        });

        return { id: user.id, email: user.email, role: user.role };
      },
    }),
  ],
});
