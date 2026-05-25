import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Nav } from "@/components/layout/Nav";

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

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Nav isAdmin={isAdmin} />
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
        {children}
      </main>
      <footer className="bg-edn-navy text-edn-mist/50 text-center text-xs py-4 font-body">
        Escola das Nações · Reunion 2006
      </footer>
    </div>
  );
}
