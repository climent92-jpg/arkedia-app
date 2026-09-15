import { ChatThread } from "@/components/chat-thread";
import { DEMO_TEACHER_ID } from "@/lib/demo-session";
import { chatMessages, getTeacherById } from "@/lib/mock-data";

export default function FamiliaXatPage() {
  const teacher = getTeacherById(DEMO_TEACHER_ID)!;
  const messages = chatMessages.filter((m) => m.threadId === "th-1");

  return (
    <ChatThread
      initialMessages={messages}
      currentAuthor="familia"
      currentAuthorName="Família Ramírez Alegría"
      otherName={`${teacher.nom} ${teacher.cognoms} · ${teacher.instruments[0]}`}
    />
  );
}
