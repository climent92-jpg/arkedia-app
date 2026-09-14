import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { ChatThread } from "@/components/chat-thread";
import { chatMessages, chatThreads, getStudentById } from "@/lib/mock-data";

export default async function ProfessorXatThreadPage({
  params,
}: {
  params: Promise<{ threadId: string }>;
}) {
  const { threadId } = await params;
  const thread = chatThreads.find((t) => t.id === threadId);
  if (!thread) notFound();

  const student = getStudentById(thread.studentId);
  const messages = chatMessages.filter((m) => m.threadId === threadId);

  return (
    <div>
      <Link
        href="/professor/xat"
        className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-arkedia-blue"
      >
        <ChevronLeft className="size-4" />
        Totes les converses
      </Link>
      <ChatThread
        initialMessages={messages}
        currentAuthor="professor"
        currentAuthorName="Noelia"
        otherName={`Família ${student?.cognoms.split(" ")[0]} (${student?.nom})`}
      />
    </div>
  );
}
