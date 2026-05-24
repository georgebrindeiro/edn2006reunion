import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { VideoMessagesClient } from "./VideoMessagesClient";

export default async function MessagesPage() {
  const session  = await auth();
  const messages = await prisma.videoMessage.findMany({
    where:   { approved: true },
    include: { user: { select: { fullName: true, photoNow: true } } },
    orderBy: { createdAt: "desc" },
  });

  const myMessage = await prisma.videoMessage.findFirst({
    where: { user: { email: session!.user!.email! } },
  });

  return (
    <div className="space-y-8">
      <div>
        <p className="text-edn-steel text-xs font-body uppercase tracking-widest mb-1">
          Para quem não pôde ir — e para quem pôde
        </p>
        <h1 className="font-display text-edn-navy text-3xl font-bold">
          Mensagens em Vídeo
        </h1>
        <p className="text-edn-gray font-body text-sm mt-1">
          Grave ou envie uma mensagem de até 2 minutos para a turma.
        </p>
      </div>

      <VideoMessagesClient
        initialMessages={messages as any}
        hasExistingMessage={!!myMessage}
      />
    </div>
  );
}
