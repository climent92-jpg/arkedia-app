import "server-only";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type {
  MyTeacherProfile,
  ProfessorMaterialRow,
  ProfessorScheduleRow,
  ProfessorStudentRow,
  ProfessorSubmittedVideoRow,
} from "@/types";

// Lectures per al portal de professorat (/professor), amb el client
// autenticat normal: la Row Level Security ja restringeix cada consulta a
// les dades del professor connectat (vegeu les policies "..._teacher" a
// supabase/schema.sql), i aquí, a més, filtrem explícitament pel seu
// teacher_id com a segona capa de seguretat.

function extractOne<T>(relation: unknown): T | null {
  if (!relation) return null;
  return (Array.isArray(relation) ? relation[0] : relation) as T;
}

// Retorna la fitxa de professor vinculada a l'usuari actualment autenticat,
// o null si no ha iniciat sessió, Supabase no està configurat, o el seu
// compte encara no té cap fila a public.teachers.
export async function getMyTeacherProfile(): Promise<MyTeacherProfile | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("teachers")
    .select("id, first_name, last_name, instruments")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!data) return null;

  return {
    id: data.id,
    firstName: data.first_name,
    lastName: data.last_name,
    instruments: data.instruments ?? [],
  };
}

export async function getMySchedule(teacherId: string): Promise<ProfessorScheduleRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("schedules")
    .select(
      "id, weekday, start_time, end_time, instrument, modality, room, student_id, students(first_name, last_name, course)"
    )
    .eq("teacher_id", teacherId);

  if (error || !data) return [];

  return data.map((s) => {
    const student = extractOne<{
      first_name: string;
      last_name: string;
      course: string | null;
    }>(s.students);

    return {
      id: s.id,
      weekday: s.weekday,
      startTime: s.start_time,
      endTime: s.end_time,
      instrument: s.instrument,
      modality: s.modality,
      room: s.room,
      studentId: s.student_id,
      studentFirstName: student?.first_name ?? "",
      studentLastName: student?.last_name ?? "",
      studentCourse: student?.course ?? null,
    };
  });
}

export async function getMyStudents(teacherId: string): Promise<ProfessorStudentRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("student_teachers")
    .select(
      "students(id, first_name, last_name, course, father_name, father_email, father_phone, mother_name, mother_email, mother_phone)"
    )
    .eq("teacher_id", teacherId);

  if (error || !data) return [];

  const students = data
    .map((row) =>
      extractOne<{
        id: string;
        first_name: string;
        last_name: string;
        course: string | null;
        father_name: string | null;
        father_email: string | null;
        father_phone: string | null;
        mother_name: string | null;
        mother_email: string | null;
        mother_phone: string | null;
      }>(row.students)
    )
    .filter((s): s is NonNullable<typeof s> => Boolean(s));

  return students
    .map((s) => ({
      id: s.id,
      firstName: s.first_name,
      lastName: s.last_name,
      course: s.course,
      fatherName: s.father_name,
      fatherEmail: s.father_email,
      fatherPhone: s.father_phone,
      motherName: s.mother_name,
      motherEmail: s.mother_email,
      motherPhone: s.mother_phone,
    }))
    .sort((a, b) => a.firstName.localeCompare(b.firstName));
}

export async function getMyMaterials(teacherId: string): Promise<ProfessorMaterialRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("materials")
    .select("id, student_id, type, title, description, created_at, students(first_name, last_name)")
    .eq("teacher_id", teacherId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data.map((m) => {
    const student = extractOne<{ first_name: string; last_name: string }>(m.students);
    return {
      id: m.id,
      studentId: m.student_id,
      studentName: student ? `${student.first_name} ${student.last_name}` : null,
      type: m.type,
      title: m.title,
      description: m.description,
      createdAt: m.created_at,
    };
  });
}

export async function getMySubmittedVideos(
  teacherId: string
): Promise<ProfessorSubmittedVideoRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("submitted_videos")
    .select(
      "id, student_id, title, reviewed, teacher_comment, created_at, students(first_name, last_name)"
    )
    .eq("teacher_id", teacherId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data.map((v) => {
    const student = extractOne<{ first_name: string; last_name: string }>(v.students);
    return {
      id: v.id,
      studentId: v.student_id,
      studentName: student ? `${student.first_name} ${student.last_name}` : "Alumne",
      title: v.title,
      reviewed: v.reviewed,
      teacherComment: v.teacher_comment,
      createdAt: v.created_at,
    };
  });
}
