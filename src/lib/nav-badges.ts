import "server-only";
import { createClient } from "@/lib/supabase/server";

// Comptadors numèrics de notificació al menú/navbar. Sempre "fail safe": si
// l'esquema de Supabase encara no té alguna columna nova (perquè no s'ha
// tornat a executar supabase/schema.sql), o qualsevol altra consulta falla,
// el comptador corresponent es queda a 0 en lloc de trencar el layout
// sencer o, pitjor, mostrar un número inventat — el mateix criteri de
// resiliència que ja es fa servir a getMyAssignments.
export interface NavBadges {
  deures: number;
  material: number;
  avisos: number;
  xat: number;
}

const NO_BADGES: NavBadges = { deures: 0, material: 0, avisos: 0, xat: 0 };
const MATERIAL_RECENT_DAYS = 7;

function isMissingColumn(error: { message: string } | null) {
  return !!error && error.message.toLowerCase().includes("could not find the");
}

async function countRecentMaterial(supabase: Awaited<ReturnType<typeof createClient>>) {
  const cutoff = new Date(Date.now() - MATERIAL_RECENT_DAYS * 24 * 60 * 60 * 1000).toISOString();
  // La RLS ("materials_select_family" / "materials_select_teacher") ja
  // limita aquesta consulta a les files que l'usuari connectat pot veure.
  const { count, error } = await supabase
    .from("materials")
    .select("id", { count: "exact", head: true })
    .gte("created_at", cutoff);
  return error ? 0 : (count ?? 0);
}

async function countUnseenAnnouncements(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
) {
  const { data: userRow, error: userError } = await supabase
    .from("users")
    .select("avisos_last_seen_at")
    .eq("id", userId)
    .maybeSingle();

  // Important: qualsevol error aquí (no només "columna no trobada") ens
  // impedeix saber quan ha estat l'última visita — i sense aquesta dada NO
  // podem distingir "encara no ha vist res" de "ja ho ha vist tot". Donar
  // per fet que és null en cas d'error feia comptar TOTS els avisos com a
  // no vistos cada cop que aquesta consulta fallava per qualsevol motiu
  // transitori: l'origen més probable dels "avisos falsos" reportats.
  if (userError) return 0;

  const lastSeen = userRow?.avisos_last_seen_at ?? null;
  // La RLS ("announcements_select_family" / "announcements_select_teacher")
  // ja limita aquesta consulta a l'audiència que li correspon a l'usuari.
  let query = supabase.from("announcements").select("id", { count: "exact", head: true });
  if (lastSeen) query = query.gt("created_at", lastSeen);

  const { count, error } = await query;
  return error ? 0 : (count ?? 0);
}

async function countUnreadThreads(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  role: "familia" | "professor"
) {
  // La RLS ("message_threads_select_participant") ja limita aquesta
  // consulta als fils on l'usuari connectat hi participa.
  const { data: threads, error } = await supabase
    .from("message_threads")
    .select("id, student_last_read_at, teacher_last_read_at");

  if (error || !threads || threads.length === 0) return 0;

  const threadIds = threads.map((t) => t.id);
  const { data: messages, error: messagesError } = await supabase
    .from("messages")
    .select("thread_id, sender_id, created_at")
    .in("thread_id", threadIds)
    .order("created_at", { ascending: false });

  if (messagesError || !messages) return 0;

  const latestByThread = new Map<string, { sender_id: string; created_at: string }>();
  for (const m of messages) {
    if (!latestByThread.has(m.thread_id)) {
      latestByThread.set(m.thread_id, { sender_id: m.sender_id, created_at: m.created_at });
    }
  }

  // Un badge numèric per fil (no per missatge individual): és el nombre de
  // converses amb alguna cosa nova per llegir.
  return threads.reduce((total, t) => {
    const latest = latestByThread.get(t.id);
    if (!latest || latest.sender_id === userId) return total;
    const readAt = role === "familia" ? t.student_last_read_at : t.teacher_last_read_at;
    return !readAt || latest.created_at > readAt ? total + 1 : total;
  }, 0);
}

export async function getStudentNavBadges(studentId: string, userId: string): Promise<NavBadges> {
  const supabase = await createClient();

  const { count: pending, error: pendingError } = await supabase
    .from("assignments")
    .select("id", { count: "exact", head: true })
    .eq("student_id", studentId)
    .eq("done", false);

  const [material, avisos, xat] = await Promise.all([
    countRecentMaterial(supabase),
    countUnseenAnnouncements(supabase, userId),
    countUnreadThreads(supabase, userId, "familia"),
  ]);

  return {
    deures: pendingError ? 0 : (pending ?? 0),
    material,
    avisos,
    xat,
  };
}

export async function getTeacherNavBadges(teacherId: string, userId: string): Promise<NavBadges> {
  const supabase = await createClient();

  const { count: toReview, error: toReviewError } = await supabase
    .from("assignments")
    .select("id", { count: "exact", head: true })
    .eq("teacher_id", teacherId)
    .not("submission_video_path", "is", null)
    .is("teacher_feedback", null);

  if (isMissingColumn(toReviewError)) return NO_BADGES;

  const [material, avisos, xat] = await Promise.all([
    countRecentMaterial(supabase),
    countUnseenAnnouncements(supabase, userId),
    countUnreadThreads(supabase, userId, "professor"),
  ]);

  return {
    deures: toReviewError ? 0 : (toReview ?? 0),
    material,
    avisos,
    xat,
  };
}
