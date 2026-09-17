import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { ChatThread } from "@/components/chat-thread";
import { MarkThreadRead } from "@/components/mark-thread-read";
import { getThreadIfAccessible, getThreadMessages } from "@/lib/chat-data";
import { getCurrentProfile } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ProfessorXatThreadPage({
  params,
}: {
  params: Promise<{ threadId: string }>;
}) {
  const { threadId } = await params;
  const profile = await getCurrentProfile();
  if (!profile) notFound();

  const thread = await getThreadIfAccessible(threadId);
  if (!thread) notFound();

  const supabase = await createClient();
  const { data: student } = await supabase
    .from("students")
    .select("first_name, last_name")
    .eq("id", thread.student_id)
    .maybeSingle();

  const messages = await getThreadMessages(threadId, profile.id, "professor");

  return (
    <div>
      <MarkThreadRead threadId={threadId} />
      <Link
        href="/professor/xat"
        className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-arkedia-blue"
      >
        <ChevronLeft className="size-4" />
        Totes les converses
      </Link>
      <ChatThread
        threadId={threadId}
        initialMessages={messages}
        currentAuthor="professor"
        currentAuthorName={profile.fullName}
        otherName={
          student
            ? `Família ${student.last_name.split(" ")[0]} (${student.first_name})`
            : "Família"
        }
      />
    </div>
  );
}
