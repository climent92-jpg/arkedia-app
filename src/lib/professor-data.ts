import "server-only";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getSignedUrl } from "@/lib/storage-signed-url";
import type {
  AnnouncementRow,
  MyTeacherProfile,
  ProfessorAssignmentRow,
  ProfessorMaterialRow,
  ProfessorScheduleRow,
  ProfessorStudentRow,
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
      "id, weekday, start_time, end_time, instrument, modality, room, notes, student_id, students(first_name, last_name, course)"
    )
    .eq("teacher_id", teacherId);

  if (error) {
    console.error("getMySchedule: select amb 'notes' ha fallat", error);
    // Si l'esquema encara no té la columna notes, no deixem que això faci
    // desaparèixer tot l'horari del professor.
    const fallback = await supabase
      .from("schedules")
      .select(
        "id, weekday, start_time, end_time, instrument, modality, room, student_id, students(first_name, last_name, course)"
      )
      .eq("teacher_id", teacherId);

    if (fallback.error || !fallback.data) return [];

    return fallback.data.map((s) => {
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
        notes: null,
        studentId: s.student_id,
        studentFirstName: student?.first_name ?? "",
        studentLastName: student?.last_name ?? "",
        studentCourse: student?.course ?? null,
      };
    });
  }

  if (!data) return [];

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
      notes: s.notes ?? null,
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
    .select(
      "id, student_id, type, title, description, storage_path, created_at, students(first_name, last_name)"
    )
    .eq("teacher_id", teacherId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return Promise.all(
    data.map(async (m) => {
      const student = extractOne<{ first_name: string; last_name: string }>(m.students);
      return {
        id: m.id,
        studentId: m.student_id,
        studentName: student ? `${student.first_name} ${student.last_name}` : null,
        type: m.type,
        title: m.title,
        description: m.description,
        url: await getSignedUrl(supabase, "materials", m.storage_path),
        createdAt: m.created_at,
      };
    })
  );
}

// Avisos de l'administració adreçats a "tothom" o específicament al
// professorat — la policy "announcements_select_teacher" aplica el mateix
// filtre a nivell de base de dades.
export async function getMyAnnouncements(): Promise<AnnouncementRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("announcements")
    .select("id, title, body, audience, created_at")
    .in("audience", ["tothom", "professors"])
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data.map((a) => ({
    id: a.id,
    title: a.title,
    body: a.body,
    audience: a.audience,
    createdAt: a.created_at,
  }));
}

export async function getMyAssignments(teacherId: string): Promise<ProfessorAssignmentRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("assignments")
    .select(
      "id, student_id, title, description, due_date, done, submission_type, submission_video_path, submission_pdf_path, submission_note, submitted_at, teacher_feedback, feedback_at, students(first_name, last_name)"
    )
    .eq("teacher_id", teacherId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getMyAssignments: select amb submission_type ha fallat", error);
    // Si l'esquema encara no té submission_type/submission_pdf_path
    // (projecte no remigrat després d'aquesta ronda), reintentem amb les
    // columnes anteriors (requires_video) i en derivem un submissionType
    // equivalent, en lloc de fer desaparèixer tota la llista de deures.
    const legacy = await supabase
      .from("assignments")
      .select(
        "id, student_id, title, description, due_date, done, requires_video, submission_video_path, submission_note, submitted_at, teacher_feedback, feedback_at, students(first_name, last_name)"
      )
      .eq("teacher_id", teacherId)
      .order("created_at", { ascending: false });

    if (!legacy.error && legacy.data) {
      return Promise.all(
        legacy.data.map(async (a) => {
          const student = extractOne<{ first_name: string; last_name: string }>(a.students);
          return {
            id: a.id,
            studentId: a.student_id,
            studentFirstName: student?.first_name ?? "",
            studentLastName: student?.last_name ?? "",
            title: a.title,
            description: a.description,
            dueDate: a.due_date,
            done: a.done,
            submissionType: a.requires_video ? "video" : "none",
            submissionVideoUrl: a.submission_video_path
              ? await getSignedUrl(supabase, "submitted_videos", a.submission_video_path)
              : null,
            submissionPdfUrl: null,
            submissionNote: a.submission_note,
            submittedAt: a.submitted_at ?? null,
            teacherFeedback: a.teacher_feedback ?? null,
            feedbackAt: a.feedback_at ?? null,
          };
        })
      );
    }

    console.error("getMyAssignments: fallback amb requires_video també ha fallat", legacy.error);
    // Esquema encara més antic: ni tan sols requires_video existeix.
    const bare = await supabase
      .from("assignments")
      .select("id, student_id, title, description, due_date, done, students(first_name, last_name)")
      .eq("teacher_id", teacherId)
      .order("created_at", { ascending: false });

    if (bare.error || !bare.data) return [];

    return bare.data.map((a) => {
      const student = extractOne<{ first_name: string; last_name: string }>(a.students);
      return {
        id: a.id,
        studentId: a.student_id,
        studentFirstName: student?.first_name ?? "",
        studentLastName: student?.last_name ?? "",
        title: a.title,
        description: a.description,
        dueDate: a.due_date,
        done: a.done,
        submissionType: "none" as const,
        submissionVideoUrl: null,
        submissionPdfUrl: null,
        submissionNote: null,
        submittedAt: null,
        teacherFeedback: null,
        feedbackAt: null,
      };
    });
  }

  if (!data) return [];

  return Promise.all(
    data.map(async (a) => {
      const student = extractOne<{ first_name: string; last_name: string }>(a.students);
      return {
        id: a.id,
        studentId: a.student_id,
        studentFirstName: student?.first_name ?? "",
        studentLastName: student?.last_name ?? "",
        title: a.title,
        description: a.description,
        dueDate: a.due_date,
        done: a.done,
        submissionType: a.submission_type,
        submissionVideoUrl: a.submission_video_path
          ? await getSignedUrl(supabase, "submitted_videos", a.submission_video_path)
          : null,
        submissionPdfUrl: a.submission_pdf_path
          ? await getSignedUrl(supabase, "submitted_documents", a.submission_pdf_path)
          : null,
        submissionNote: a.submission_note,
        submittedAt: a.submitted_at ?? null,
        teacherFeedback: a.teacher_feedback ?? null,
        feedbackAt: a.feedback_at ?? null,
      };
    })
  );
}
