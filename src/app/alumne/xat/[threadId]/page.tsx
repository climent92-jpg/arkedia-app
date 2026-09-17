import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { ChatThread } from "@/components/chat-thread";
import { MarkThreadRead } from "@/components/mark-thread-read";
import { getThreadIfAccessible, getThreadMessages } from "@/lib/chat-data";
import { getCurrentProfile } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AlumneXatThreadPage({
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
  const { data: teacher } = await supabase
    .from("teachers")
    .select("first_name, last_name, instruments")
    .eq("id", thread.teacher_id)
    .maybeSingle();

  const messages = await getThreadMessages(threadId, profile.id, "familia");

  return (
    <div>
      <MarkThreadRead threadId={threadId} />
      <Link
        href="/alumne/xat"
        className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-arkedia-blue"
      >
        <ChevronLeft className="size-4" />
        Totes les converses
      </Link>
      <ChatThread
        threadId={threadId}
        initialMessages={messages}
        currentAuthor="familia"
        currentAuthorName={profile.fullName}
        otherName={
          teacher
            ? `${teacher.first_name} ${teacher.last_name}${
                teacher.instruments?.[0] ? " · " + teacher.instruments[0] : ""
              }`
            : "Professor/a"
        }
      />
    </div>
  );
}
