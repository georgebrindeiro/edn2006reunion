import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "passphrase",
      credentials: {
        email:      { label: "Email",      type: "email" },
        passphrase: { label: "Passphrase", type: "password" },
      },
      async authorize(credentials) {
        const { email, passphrase } = credentials as {
          email: string;
          passphrase: string;
        };

        if (!email || !passphrase) return null;

        // ── Admin check ──
        if (passphrase === process.env.ADMIN_PASSPHRASE) {
          // Upsert admin user
          const admin = await prisma.user.upsert({
            where:  { email },
            update: { role: "ADMIN" },
            create: { email, role: "ADMIN" },
          });
          return { id: admin.id, email: admin.email, role: admin.role };
        }

        // ── Member check ──
        if (passphrase !== process.env.LOGIN_PASSPHRASE) return null;

        // Upsert member — first login creates their record
        const user = await prisma.user.upsert({
          where:  { email },
          update: {},
          create: { email, role: "MEMBER" },
        });

        return { id: user.id, email: user.email, role: user.role };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id   = user.id;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id   = token.id as string;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },

  pages: {
    signIn: "/login",
  },

  session: { strategy: "jwt" },
});
