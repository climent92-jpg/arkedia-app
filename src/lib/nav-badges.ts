import "server-only";
import { createClient } from "@/lib/supabase/server";

// Punts vermells de notificació al menú/navbar. Sempre "fail safe": si
// l'esquema de Supabase encara no té alguna columna nova (perquè no s'ha
// tornat a executar supabase/schema.sql), la consulta corresponent es
// limita a no mostrar el punt en lloc de trencar el layout sencer — el
// mateix criteri de resiliència que ja es fa servir a getMyAssignments.
export interface NavBadges {
  deures: boolean;
  material: boolean;
  avisos: boolean;
  xat: boolean;
}

const NO_BADGES: NavBadges = { deures: false, material: false, avisos: false, xat: false };
const MATERIAL_RECENT_DAYS = 7;

function isMissingColumn(error: { message: string } | null) {
  return !!error && error.message.toLowerCase().includes("could not find the");
}

async function hasRecentMaterial(supabase: Awaited<ReturnType<typeof createClient>>) {
  const cutoff = new Date(Date.now() - MATERIAL_RECENT_DAYS * 24 * 60 * 60 * 1000).toISOString();
  // La RLS ("materials_select_family" / "materials_select_teacher") ja
  // limita aquesta consulta a les files que l'usuari connectat pot veure.
  const { data, error } = await supabase
    .from("materials")
    .select("id")
    .gte("created_at", cutoff)
    .limit(1);
  return !error && !!data?.length;
}

async function hasUnseenAnnouncements(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
) {
  const { data: userRow, error: userError } = await supabase
    .from("users")
    .select("avisos_last_seen_at")
    .eq("id", userId)
    .maybeSingle();

  if (isMissingColumn(userError)) return false;

  const lastSeen = userRow?.avisos_last_seen_at ?? null;
  // La RLS ("announcements_select_family" / "announcements_select_teacher")
  // ja limita aquesta consulta a l'audiència que li correspon a l'usuari.
  let query = supabase.from("announcements").select("id").limit(1);
  if (lastSeen) query = query.gt("created_at", lastSeen);

  const { data, error } = await query;
  return !error && !!data?.length;
}

async function hasUnreadMessages(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  role: "familia" | "professor"
) {
  // La RLS ("message_threads_select_participant") ja limita aquesta
  // consulta als fils on l'usuari connectat hi participa.
  const { data: threads, error } = await supabase
    .from("message_threads")
    .select("id, student_last_read_at, teacher_last_read_at");

  if (isMissingColumn(error) || error || !threads || threads.length === 0) return false;

  const threadIds = threads.map((t) => t.id);
  const { data: messages, error: messagesError } = await supabase
    .from("messages")
    .select("thread_id, sender_id, created_at")
    .in("thread_id", threadIds)
    .order("created_at", { ascending: false });

  if (messagesError || !messages) return false;

  const latestByThread = new Map<string, { sender_id: string; created_at: string }>();
  for (const m of messages) {
    if (!latestByThread.has(m.thread_id)) {
      latestByThread.set(m.thread_id, { sender_id: m.sender_id, created_at: m.created_at });
    }
  }

  return threads.some((t) => {
    const latest = latestByThread.get(t.id);
    if (!latest || latest.sender_id === userId) return false;
    const readAt = role === "familia" ? t.student_last_read_at : t.teacher_last_read_at;
    return !readAt || latest.created_at > readAt;
  });
}

export async function getStudentNavBadges(studentId: string, userId: string): Promise<NavBadges> {
  const supabase = await createClient();

  const { data: pending, error: pendingError } = await supabase
    .from("assignments")
    .select("id")
    .eq("student_id", studentId)
    .eq("done", false)
    .limit(1);

  const [material, avisos, xat] = await Promise.all([
    hasRecentMaterial(supabase),
    hasUnseenAnnouncements(supabase, userId),
    hasUnreadMessages(supabase, userId, "familia"),
  ]);

  return {
    deures: !pendingError && !!pending?.length,
    material,
    avisos,
    xat,
  };
}

export async function getTeacherNavBadges(teacherId: string, userId: string): Promise<NavBadges> {
  const supabase = await createClient();

  const { data: toReview, error: toReviewError } = await supabase
    .from("assignments")
    .select("id")
    .eq("teacher_id", teacherId)
    .not("submission_video_path", "is", null)
    .is("teacher_feedback", null)
    .limit(1);

  if (isMissingColumn(toReviewError)) return NO_BADGES;

  const [material, avisos, xat] = await Promise.all([
    hasRecentMaterial(supabase),
    hasUnseenAnnouncements(supabase, userId),
    hasUnreadMessages(supabase, userId, "professor"),
  ]);

  return {
    deures: !toReviewError && !!toReview?.length,
    material,
    avisos,
    xat,
  };
}
