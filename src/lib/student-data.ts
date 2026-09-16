import "server-only";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getSignedUrl } from "@/lib/storage-signed-url";
import type {
  MyStudentProfile,
  StudentAssignmentRow,
  StudentMaterialRow,
  StudentScheduleRow,
  StudentSubmittedVideoRow,
  StudentTeacherRow,
} from "@/types";

// Lectures per al portal de l'alumne (/alumne), amb el client autenticat
// normal: la Row Level Security ja restringeix cada consulta a les dades de
// l'alumne connectat (vegeu les policies "..._select_family" a
// supabase/schema.sql), i aquí, a més, filtrem explícitament pel seu
// student_id com a segona capa de seguretat.

function extractOne<T>(relation: unknown): T | null {
  if (!relation) return null;
  return (Array.isArray(relation) ? relation[0] : relation) as T;
}

// Retorna la fitxa de l'alumne vinculada a l'usuari actualment autenticat
// (family_user_id = auth.uid()), o null si no ha iniciat sessió, Supabase no
// està configurat, o el seu compte encara no té cap fila a public.students.
export async function getMyStudentProfile(): Promise<MyStudentProfile | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("students")
    .select("id, first_name, last_name, course")
    .eq("family_user_id", user.id)
    .maybeSingle();

  if (!data) return null;

  return {
    id: data.id,
    firstName: data.first_name,
    lastName: data.last_name,
    course: data.course,
  };
}

export async function getMySchedule(studentId: string): Promise<StudentScheduleRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("schedules")
    .select(
      "id, weekday, start_time, end_time, instrument, modality, room, teacher_id, teachers(first_name, last_name)"
    )
    .eq("student_id", studentId);

  if (error || !data) return [];

  return data.map((s) => {
    const teacher = extractOne<{ first_name: string; last_name: string }>(s.teachers);
    return {
      id: s.id,
      weekday: s.weekday,
      startTime: s.start_time,
      endTime: s.end_time,
      instrument: s.instrument,
      modality: s.modality,
      room: s.room,
      teacherId: s.teacher_id,
      teacherFirstName: teacher?.first_name ?? "",
      teacherLastName: teacher?.last_name ?? "",
    };
  });
}

export async function getMyTeachers(studentId: string): Promise<StudentTeacherRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("student_teachers")
    .select("teachers(id, first_name, last_name, instruments)")
    .eq("student_id", studentId);

  if (error || !data) return [];

  return data
    .map((row) =>
      extractOne<{
        id: string;
        first_name: string;
        last_name: string;
        instruments: string[];
      }>(row.teachers)
    )
    .filter((t): t is NonNullable<typeof t> => Boolean(t))
    .map((t) => ({
      id: t.id,
      firstName: t.first_name,
      lastName: t.last_name,
      instruments: t.instruments ?? [],
    }));
}

export async function getMyAssignments(studentId: string): Promise<StudentAssignmentRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("assignments")
    .select("id, title, description, due_date, done, teachers(first_name)")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data.map((a) => {
    const teacher = extractOne<{ first_name: string }>(a.teachers);
    return {
      id: a.id,
      title: a.title,
      description: a.description,
      teacherFirstName: teacher?.first_name ?? "",
      dueDate: a.due_date,
      done: a.done,
    };
  });
}

// Materials propis de l'alumne + materials generals (student_id null) dels
// seus professors — la policy materials_select_family ja aplica aquest
// mateix criteri a nivell de base de dades.
export async function getMyMaterials(
  studentId: string,
  teacherIds: string[]
): Promise<StudentMaterialRow[]> {
  const supabase = await createClient();
  let query = supabase
    .from("materials")
    .select(
      "id, type, title, description, student_id, storage_path, teachers(first_name, last_name)"
    );

  if (teacherIds.length > 0) {
    const teacherList = teacherIds.join(",");
    query = query.or(
      `student_id.eq.${studentId},and(student_id.is.null,teacher_id.in.(${teacherList}))`
    );
  } else {
    query = query.eq("student_id", studentId);
  }

  const { data, error } = await query.order("created_at", { ascending: false });
  if (error || !data) return [];

  return Promise.all(
    data.map(async (m) => {
      const teacher = extractOne<{ first_name: string; last_name: string }>(m.teachers);
      return {
        id: m.id,
        type: m.type,
        title: m.title,
        description: m.description,
        teacherFirstName: teacher?.first_name ?? "",
        teacherLastName: teacher?.last_name ?? "",
        url: await getSignedUrl(supabase, "materials", m.storage_path),
      };
    })
  );
}

export async function getMySubmittedVideos(
  studentId: string
): Promise<StudentSubmittedVideoRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("submitted_videos")
    .select("id, title, student_note, storage_path, reviewed, teacher_comment, created_at")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return Promise.all(
    data.map(async (v) => ({
      id: v.id,
      title: v.title,
      studentNote: v.student_note,
      reviewed: v.reviewed,
      teacherComment: v.teacher_comment,
      url: await getSignedUrl(supabase, "submitted-videos", v.storage_path),
      createdAt: v.created_at,
    }))
  );
}
