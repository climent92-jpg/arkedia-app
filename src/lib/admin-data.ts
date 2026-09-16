import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminConfigured } from "@/lib/supabase/config";
import type {
  AdminAnnouncementRow,
  AdminScheduleRow,
  AdminStudentRow,
  AdminTeacherRow,
  AdminUserRow,
} from "@/types";

// Sense tipus generats de Supabase, el client tipa qualsevol relació
// incrustada (per FK) com un array encara que sigui a un únic registre.
// Aquest helper n'extreu un camp tant si arriba com a objecte com si arriba
// com a array.
function extractRelationField<K extends string>(
  relation: unknown,
  field: K
): string | null {
  if (!relation) return null;
  const row = Array.isArray(relation) ? relation[0] : relation;
  return (row as Record<K, string> | undefined)?.[field] ?? null;
}

function extractLinkedEmail(relation: unknown): string | null {
  return extractRelationField(relation, "email");
}

function extractLinkedFullName(relation: unknown): string | null {
  return extractRelationField(relation, "full_name");
}

function extractOne<T>(relation: unknown): T | null {
  if (!relation) return null;
  return (Array.isArray(relation) ? relation[0] : relation) as T;
}

// Funcions de lectura per als Server Components del panell d'administració.
// Fan servir el client amb la service role (es salten RLS): només es criden
// des de pàgines ja protegides per requireRole("admin") al layout.

export async function getAllUsers(): Promise<AdminUserRow[]> {
  if (!isAdminConfigured()) return [];

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("users")
    .select("id, role, full_name, email, phone, created_at")
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data.map((u) => ({
    id: u.id,
    role: u.role,
    fullName: u.full_name,
    email: u.email,
    phone: u.phone,
    createdAt: u.created_at,
  }));
}

export async function getAllTeachers(): Promise<AdminTeacherRow[]> {
  if (!isAdminConfigured()) return [];

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("teachers")
    .select("id, user_id, first_name, last_name, email, instruments, bio, users(email)")
    .order("first_name", { ascending: true });

  if (error || !data) return [];

  return data.map((t) => ({
    id: t.id,
    userId: t.user_id,
    firstName: t.first_name,
    lastName: t.last_name,
    email: t.email,
    instruments: t.instruments ?? [],
    bio: t.bio,
    linkedUserEmail: extractLinkedEmail(t.users),
  }));
}

export async function getAllStudents(): Promise<AdminStudentRow[]> {
  if (!isAdminConfigured()) return [];

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("students")
    .select(
      "id, family_user_id, first_name, last_name, course, father_name, father_email, father_phone, mother_name, mother_email, mother_phone, notes, users(email), student_teachers(teacher_id)"
    )
    .order("first_name", { ascending: true });

  if (error || !data) return [];

  return data.map((s) => ({
    id: s.id,
    familyUserId: s.family_user_id,
    firstName: s.first_name,
    lastName: s.last_name,
    course: s.course,
    fatherName: s.father_name,
    fatherEmail: s.father_email,
    fatherPhone: s.father_phone,
    motherName: s.mother_name,
    motherEmail: s.mother_email,
    motherPhone: s.mother_phone,
    notes: s.notes,
    linkedUserEmail: extractLinkedEmail(s.users),
    teacherIds: ((s.student_teachers ?? []) as { teacher_id: string }[]).map(
      (st) => st.teacher_id
    ),
  }));
}

export async function getAllAnnouncements(): Promise<AdminAnnouncementRow[]> {
  if (!isAdminConfigured()) return [];

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("announcements")
    .select("id, title, body, audience, created_at, users(full_name)")
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data.map((a) => ({
    id: a.id,
    title: a.title,
    body: a.body,
    audience: a.audience,
    authorName: extractLinkedFullName(a.users),
    createdAt: a.created_at,
  }));
}

export async function getAllSchedules(): Promise<AdminScheduleRow[]> {
  if (!isAdminConfigured()) return [];

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("schedules")
    .select(
      "id, teacher_id, student_id, weekday, start_time, end_time, instrument, modality, room, teachers(first_name, last_name), students(first_name, last_name)"
    )
    .order("weekday", { ascending: true })
    .order("start_time", { ascending: true });

  if (error || !data) return [];

  return data.map((s) => {
    const teacher = extractOne<{ first_name: string; last_name: string }>(s.teachers);
    const student = extractOne<{ first_name: string; last_name: string }>(s.students);
    return {
      id: s.id,
      teacherId: s.teacher_id,
      teacherFirstName: teacher?.first_name ?? "",
      teacherLastName: teacher?.last_name ?? "",
      studentId: s.student_id,
      studentFirstName: student?.first_name ?? "",
      studentLastName: student?.last_name ?? "",
      weekday: s.weekday,
      startTime: s.start_time,
      endTime: s.end_time,
      instrument: s.instrument,
      modality: s.modality,
      room: s.room,
    };
  });
}

export interface AdminStats {
  teachers: number;
  students: number;
  schedules: number;
  users: number;
  announcements: number;
}

export async function getAdminStats(): Promise<AdminStats> {
  if (!isAdminConfigured()) {
    return { teachers: 0, students: 0, schedules: 0, users: 0, announcements: 0 };
  }

  const supabase = createAdminClient();
  const [teachers, students, schedules, users, announcements] = await Promise.all([
    supabase.from("teachers").select("id", { count: "exact", head: true }),
    supabase.from("students").select("id", { count: "exact", head: true }),
    supabase.from("schedules").select("id", { count: "exact", head: true }),
    supabase.from("users").select("id", { count: "exact", head: true }),
    supabase.from("announcements").select("id", { count: "exact", head: true }),
  ]);

  return {
    teachers: teachers.count ?? 0,
    students: students.count ?? 0,
    schedules: schedules.count ?? 0,
    users: users.count ?? 0,
    announcements: announcements.count ?? 0,
  };
}
