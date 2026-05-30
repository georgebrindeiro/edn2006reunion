import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Nav } from "@/components/layout/Nav";
import { ActivityPing } from "@/components/ActivityPing";
import { BirthdayTopBar } from "@/components/BirthdayTopBar";

function getThisWeekMonthDays(): Set<string> {
  const now = new Date();
  const dow = now.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const monday = new Date(now);
  monday.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1));
  monday.setHours(0, 0, 0, 0);

  const days = new Set<string>();
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    days.add(`${m}-${day}`);
  }
  return days;
}

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const isAdmin = (session.user as any)?.role === "ADMIN";

  const weekDays = getThisWeekMonthDays();

  const allWithBirthday = await prisma.user.findMany({
    where: { fullName: { not: null }, birthday: { not: null }, deletedAt: null },
    select: {
      id: true,
      fullName: true,
      birthday: true,
      phone: true,
      city: true,
      state: true,
      country: true,
      photoThen: true,
      photoNow: true,
      studyPeriods: true,
    },
    orderBy: { fullName: "asc" },
  });

  const birthdayClassmates = allWithBirthday
    .map((c) => ({ ...c, birthday: c.birthday!.toISOString().split("T")[0] }))
    .filter((c) => {
      const [, month, day] = c.birthday.split("-");
      return weekDays.has(`${month}-${day}`);
    });

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Nav isAdmin={isAdmin} />
      <BirthdayTopBar classmates={birthdayClassmates} />
      <ActivityPing />
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
        {children}
      </main>
      <footer className="bg-edn-navy text-edn-mist/50 text-center text-xs py-4 font-body">
        Escola das Nações · Reunion 2006
      </footer>
    </div>
  );
}
