import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ChevronRight } from "lucide-react";
import { AdminEditButton } from "@/components/AdminMemoryEditor";

export default async function StoriesPage() {
  const session = await auth();
  const isAdmin = (session?.user as any)?.role === "ADMIN";

  const stories = await prisma.memory.findMany({
    where:   { approved: true, type: "STORY" },
    include: { user: { select: { fullName: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <p className="text-edn-steel text-xs font-body uppercase tracking-widest mb-1">
          Histórias
        </p>
        <h1 className="font-display text-edn-navy text-3xl font-bold">Histórias da turma</h1>
        <p className="text-edn-gray font-body text-sm mt-1">
          {stories.length} hist{stories.length !== 1 ? "órias" : "ória"} compartilhadas
        </p>
      </div>

      {stories.length === 0 ? (
        <div className="text-center py-16 text-edn-gray font-body text-sm">
          Nenhuma história compartilhada ainda.
        </div>
      ) : (
        <div className="space-y-4">
          {stories.map((s) => (
            <div key={s.id} className="relative group">
              <Link
                href={`/memories/stories/${s.id}`}
                className="block bg-white rounded-2xl p-5 shadow-sm hover:shadow-md border-l-4 border-edn-mist hover:border-edn-navy transition-all"
              >
                {s.title && (
                  <h2 className="font-display text-edn-navy font-semibold text-base mb-2">
                    {s.title}
                  </h2>
                )}
                <p className="font-body text-edn-navy/70 text-sm leading-relaxed line-clamp-3">
                  {s.content}
                </p>
                <div className="flex items-center justify-between mt-3">
                  <p className="text-edn-gray text-xs font-body">
                    — {s.user.fullName ?? "Colega"} ·{" "}
                    {new Date(s.createdAt).toLocaleDateString("pt-BR", {
                      day: "numeric", month: "long", year: "numeric",
                    })}
                  </p>
                  <ChevronRight size={14} className="text-edn-steel group-hover:text-edn-navy transition-colors" />
                </div>
              </Link>
              {isAdmin && (
                <div className="absolute top-3 right-8">
                  <AdminEditButton
                    memory={{ id: s.id, type: "STORY", title: s.title, content: s.content, author: s.author }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
