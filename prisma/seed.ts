// prisma/seed.ts
// Run: npx ts-node prisma/seed.ts  OR  npx tsx prisma/seed.ts
//
// This creates:
//   • The first active invite token (copy the URL it prints)
//   • Nothing else — admin accounts are created on first login

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function generateToken() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  return Array.from({ length: 32 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join("");
}

async function main() {
  console.log("🌱 Seeding EDN Reunion database...\n");

  // Deactivate any existing tokens
  await prisma.inviteToken.updateMany({ data: { active: false } });

  // Create a fresh invite token
  const token = await prisma.inviteToken.create({
    data: { token: generateToken(), active: true },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  console.log("✅ Invite token created!\n");
  console.log("━".repeat(60));
  console.log("📨 Share this link with classmates:");
  console.log(`\n   ${appUrl}/register/${token.token}\n`);
  console.log("━".repeat(60));
  console.log("\n💡 To access the admin panel:");
  console.log("   1. Go to /login");
  console.log("   2. Use any email + ADMIN_PASSPHRASE from your .env.local");
  console.log("   3. You'll be automatically promoted to admin\n");
  console.log("🎉 Done! Run: npm run dev\n");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
