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

// Valor per defecte quan encara no hi ha cap data de "vist per última
// vegada" (avisos_last_seen_at, material_last_seen_at, *_last_read_at
// null): una data antiga fa que TOT el que ja existeix compti com a "no
// vist", exactament com si es comparés amb COALESCE(data, '1970-01-01').
const EPOCH = new Date(0).toISOString();

function isMissingColumn(error: { message: string } | null) {
  return !!error && error.message.toLowerCase().includes("could not find the");
}

// Compta files d'una taula creades després de l'últim cop que l'usuari ha
// obert la secció corresponent (avisos_last_seen_at / material_last_seen_at
// a public.users) — el mateix mecanisme per a totes dues seccions.
async function countSinceLastSeen(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  lastSeenColumn: "avisos_last_seen_at" | "material_last_seen_at",
  table: "announcements" | "materials"
) {
  const { data: userRow, error: userError } = await supabase
    .from("users")
    .select(lastSeenColumn)
    .eq("id", userId)
    .maybeSingle();

  // Important: qualsevol error aquí (no només "columna no trobada") ens
  // impedeix saber quan ha estat l'última visita — i sense aquesta dada NO
  // podem distingir "encara no ha vist res" de "ja ho ha vist tot". Donar
  // per fet que és EPOCH en cas d'error faria comptar TOT com a no vist cada
  // cop que aquesta consulta fallava per qualsevol motiu transitori:
  // l'origen més probable dels "avisos falsos" reportats.
  if (userError) return 0;

  const lastSeen =
    (userRow as Record<string, string | null> | null)?.[lastSeenColumn] ?? EPOCH;
  // La RLS de cada taula ja limita aquesta consulta al que li correspon a
  // l'usuari (audiència d'avisos, o materials propis/generals).
  const { count, error } = await supabase
    .from(table)
    .select("id", { count: "exact", head: true })
    .gt("created_at", lastSeen);

  return error ? 0 : (count ?? 0);
}

function countUnseenAnnouncements(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
) {
  return countSinceLastSeen(supabase, userId, "avisos_last_seen_at", "announcements");
}

function countUnseenMaterial(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  return countSinceLastSeen(supabase, userId, "material_last_seen_at", "materials");
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
  // converses amb alguna cosa nova per llegir. Comptem un fil quan el seu
  // darrer missatge és posterior a EPOCH (real read_at, o l'1970-01-01 per
  // defecte si encara no s'ha llegit mai) I no l'ha enviat l'usuari mateix.
  return threads.reduce((total, t) => {
    const latest = latestByThread.get(t.id);
    if (!latest || latest.sender_id === userId) return total;
    const readAt = (role === "familia" ? t.student_last_read_at : t.teacher_last_read_at) ?? EPOCH;
    return latest.created_at > readAt ? total + 1 : total;
  }, 0);
}

// Deures de l'alumne amb feedback nou que encara no ha obert /alumne/deures
// des que el professor l'ha enviat.
async function countUnseenFeedback(
  supabase: Awaited<ReturnType<typeof createClient>>,
  studentId: string
) {
  const { count, error } = await supabase
    .from("assignments")
    .select("id", { count: "exact", head: true })
    .eq("student_id", studentId)
    .not("feedback_at", "is", null)
    .eq("feedback_seen", false);
  return error ? 0 : (count ?? 0);
}

export async function getStudentNavBadges(studentId: string, userId: string): Promise<NavBadges> {
  const supabase = await createClient();

  const [pendingResult, unseenFeedback, material, avisos, xat] = await Promise.all([
    supabase
      .from("assignments")
      .select("id", { count: "exact", head: true })
      .eq("student_id", studentId)
      .eq("done", false),
    countUnseenFeedback(supabase, studentId),
    countUnseenMaterial(supabase, userId),
    countUnseenAnnouncements(supabase, userId),
    countUnreadThreads(supabase, userId, "familia"),
  ]);

  const pending = pendingResult.error ? 0 : (pendingResult.count ?? 0);

  return {
    deures: pending + unseenFeedback,
    material,
    avisos,
    xat,
  };
}

export async function getTeacherNavBadges(teacherId: string, userId: string): Promise<NavBadges> {
  const supabase = await createClient();

  // "submitted_at" es posa en enviar qualsevol tipus de resposta (vídeo,
  // PDF o text): és el senyal genèric de "l'alumne ha entregat alguna cosa
  // que encara no s'ha corregit", independent del submission_type del deure.
  const { count: toReview, error: toReviewError } = await supabase
    .from("assignments")
    .select("id", { count: "exact", head: true })
    .eq("teacher_id", teacherId)
    .not("submitted_at", "is", null)
    .is("teacher_feedback", null);

  if (isMissingColumn(toReviewError)) return NO_BADGES;

  const [material, avisos, xat] = await Promise.all([
    countUnseenMaterial(supabase, userId),
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
