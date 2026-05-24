// src/types/next-auth.d.ts
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id:   string;
      role: "MEMBER" | "ADMIN";
    } & DefaultSession["user"];
  }

  interface User {
    role: "MEMBER" | "ADMIN";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id:   string;
    role: "MEMBER" | "ADMIN";
  }
}
