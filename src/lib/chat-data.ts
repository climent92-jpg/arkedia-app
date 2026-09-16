import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { ChatMessage, ChatThreadRow } from "@/types";

type ChatClient = Awaited<ReturnType<typeof createClient>>;

// Retorna l'id del fil entre aquest alumne i aquest professor, creant-lo si
// encara no existeix (la primera vegada que qualsevol de les dues bandes
// obre el xat). Les policies "message_threads_insert_participant" permeten
// crear-lo tant a la família com al professor.
async function ensureThread(
  supabase: ChatClient,
  studentId: string,
  teacherId: string
): Promise<string | null> {
  const { data: existing } = await supabase
    .from("message_threads")
    .select("id")
    .eq("student_id", studentId)
    .eq("teacher_id", teacherId)
    .maybeSingle();

  if (existing) return existing.id;

  const { data: inserted, error } = await supabase
    .from("message_threads")
    .insert({ student_id: studentId, teacher_id: teacherId })
    .select("id")
    .single();

  if (inserted) return inserted.id;

  // Dues peticions simultànies poden intentar crear el mateix fil (l'alumne
  // i el professor obrint el xat alhora): si l'insert falla, no ho donem
  // per perdut, tornem a consultar-lo per si l'altra petició ja l'ha creat.
  if (error) {
    const { data: retried } = await supabase
      .from("message_threads")
      .select("id")
      .eq("student_id", studentId)
      .eq("teacher_id", teacherId)
      .maybeSingle();
    if (retried) return retried.id;
    console.error("No s'ha pogut crear el fil de xat:", error.message);
  }

  return null;
}

async function lastMessageOf(supabase: ChatClient, threadId: string) {
  const { data } = await supabase
    .from("messages")
    .select("body, created_at")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data ?? null;
}

// Una conversa per a cada professor assignat a l'alumne (creant el fil si
// encara no s'havia parlat mai).
export async function getThreadsForStudent(
  studentId: string,
  teachers: { id: string; firstName: string; lastName: string }[]
): Promise<ChatThreadRow[]> {
  const supabase = await createClient();

  const rows = await Promise.all(
    teachers.map(async (teacher) => {
      const threadId = await ensureThread(supabase, studentId, teacher.id);
      if (!threadId) return null;
      const last = await lastMessageOf(supabase, threadId);
      return {
        id: threadId,
        studentId,
        studentFirstName: "",
        studentLastName: "",
        teacherId: teacher.id,
        teacherFirstName: teacher.firstName,
        teacherLastName: teacher.lastName,
        lastMessage: last?.body ?? null,
        lastMessageAt: last?.created_at ?? null,
      };
    })
  );

  return rows.filter((r): r is NonNullable<typeof r> => r !== null);
}

// Una conversa per a cada alumne assignat al professor.
export async function getThreadsForTeacher(
  teacherId: string,
  students: { id: string; firstName: string; lastName: string }[]
): Promise<ChatThreadRow[]> {
  const supabase = await createClient();

  const rows = await Promise.all(
    students.map(async (student) => {
      const threadId = await ensureThread(supabase, student.id, teacherId);
      if (!threadId) return null;
      const last = await lastMessageOf(supabase, threadId);
      return {
        id: threadId,
        studentId: student.id,
        studentFirstName: student.firstName,
        studentLastName: student.lastName,
        teacherId,
        teacherFirstName: "",
        teacherLastName: "",
        lastMessage: last?.body ?? null,
        lastMessageAt: last?.created_at ?? null,
      };
    })
  );

  return rows.filter((r): r is NonNullable<typeof r> => r !== null);
}

// Retorna el fil si l'usuari hi té accés (via RLS; si no, "select" ja
// retorna null) — perquè la pàgina pugui fer notFound() si algú prova
// d'obrir un threadId que no és seu.
export async function getThreadIfAccessible(threadId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("message_threads")
    .select("id, student_id, teacher_id")
    .eq("id", threadId)
    .maybeSingle();
  return data;
}

// Els missatges d'un fil. Com que només hi ha dues bandes possibles en una
// conversa (la família de l'alumne i el professor), en sabem prou comparant
// sender_id amb l'usuari actual — evitem així haver de fer un join a
// public.users/teachers, que la RLS d'aquestes taules bloquejaria per a
// l'altra banda de la conversa.
export async function getThreadMessages(
  threadId: string,
  currentUserId: string,
  viewerRole: "familia" | "professor"
): Promise<ChatMessage[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("messages")
    .select("id, sender_id, body, created_at")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });

  if (error || !data) return [];

  const otherRole = viewerRole === "familia" ? "professor" : "familia";

  return data.map((m) => ({
    id: m.id,
    threadId,
    autor: m.sender_id === currentUserId ? viewerRole : otherRole,
    autorNom: "",
    text: m.body,
    data: m.created_at,
  }));
}
