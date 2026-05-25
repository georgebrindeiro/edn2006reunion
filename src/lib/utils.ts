import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a date nicely in Brazilian Portuguese, always in BRT (America/Sao_Paulo) */
export function formatDate(date: Date | string, opts?: Intl.DateTimeFormatOptions) {
  // Date-only strings (YYYY-MM-DD) are parsed as UTC midnight by the JS engine.
  // Appending T12:00:00 makes them noon UTC = 9 AM BRT, safely on the correct calendar day.
  const d =
    typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)
      ? new Date(date + "T12:00:00")
      : new Date(date);
  return new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
    ...opts,
  }).format(d);
}

/** Generate a URL-safe random token */
export function generateToken() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  return Array.from({ length: 32 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join("");
}

/** Validate an invite token against the DB */
export async function validateInviteToken(token: string) {
  const { prisma } = await import("@/lib/prisma");
  const record = await prisma.inviteToken.findUnique({ where: { token } });
  return record?.active === true;
}

/** Strip all non-digit characters so phone numbers match regardless of formatting */
export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

/** School year range helpers */
export const SCHOOL_YEAR_START = 1985;
export const SCHOOL_YEAR_END   = 2010;

export function getAllSchoolYears() {
  return Array.from(
    { length: SCHOOL_YEAR_END - SCHOOL_YEAR_START + 1 },
    (_, i) => SCHOOL_YEAR_START + i
  );
}
