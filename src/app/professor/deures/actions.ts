"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/supabase/auth";
import { getMyTeacherProfile } from "@/lib/professor-data";
import type { AssignmentSubmissionType } from "@/types";

export interface ActionResult {
  success: boolean;
  error?: string;
}

// Inclou details/hint (quan Postgres els dona) perquè l'error que es mostri
// al professor sigui l'exacte de Supabase, no només un "message" genèric.
function formatDbError(error: { message: string; details?: string | null; hint?: string | null }) {
  let text = error.message;
  if (error.details) text += ` — ${error.details}`;
  if (error.hint) text += ` (${error.hint})`;
  return text;
}

interface AssignmentInput {
  studentId: string;
  title: string;
  description?: string;
  dueDate?: string;
  submissionType: AssignmentSubmissionType;
}

export async function createAssignment(input: AssignmentInput): Promise<ActionResult> {
  try {
    await requireProfile("professor");
  } catch {
    return { success: false, error: "No autoritzat." };
  }

  const teacher = await getMyTeacherProfile();
  if (!teacher) {
    return { success: false, error: "El teu compte no té cap fitxa de professor vinculada." };
  }

  if (!input.studentId || !input.title.trim()) {
    return { success: false, error: "Cal triar un alumne i escriure un títol." };
  }

  const supabase = await createClient();

  // Si el projecte de Supabase encara no té la columna submission_type
  // (schema.sql no re-executat), reintentem amb requires_video, l'antiga
  // columna que substitueix — mai perdem la creació del deure per això.
  const attempts: Record<string, unknown>[] = [
    {
      student_id: input.studentId,
      teacher_id: teacher.id,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      due_date: input.dueDate || null,
      submission_type: input.submissionType,
      requires_video: input.submissionType === "video",
    },
    {
      student_id: input.studentId,
      teacher_id: teacher.id,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      due_date: input.dueDate || null,
      requires_video: input.submissionType === "video",
    },
  ];

  let lastError: { message: string; details?: string | null; hint?: string | null } | null = null;

  for (const payload of attempts) {
    const { error } = await supabase.from("assignments").insert(payload);
    if (!error) {
      revalidatePath("/professor/deures");
      return { success: true };
    }
    lastError = error;
    if (!error.message.toLowerCase().includes("could not find the")) break;
  }

  return {
    success: false,
    error: lastError ? formatDbError(lastError) : "No s'ha pogut crear el deure.",
  };
}

// No filtrem per teacher_id: la policy RLS "assignments_update_teacher"/
// "assignments_delete_teacher" ja restringeix l'acció als deures propis.
export async function updateAssignment(
  assignmentId: string,
  input: AssignmentInput
): Promise<ActionResult> {
  try {
    await requireProfile("professor");
  } catch {
    return { success: false, error: "No autoritzat." };
  }

  if (!input.studentId || !input.title.trim()) {
    return { success: false, error: "Cal triar un alumne i escriure un títol." };
  }

  const supabase = await createClient();

  const attempts: Record<string, unknown>[] = [
    {
      student_id: input.studentId,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      due_date: input.dueDate || null,
      submission_type: input.submissionType,
      requires_video: input.submissionType === "video",
    },
    {
      student_id: input.studentId,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      due_date: input.dueDate || null,
      requires_video: input.submissionType === "video",
    },
  ];

  let lastError: { message: string; details?: string | null; hint?: string | null } | null = null;

  for (const payload of attempts) {
    const { error } = await supabase.from("assignments").update(payload).eq("id", assignmentId);
    if (!error) {
      revalidatePath("/professor/deures");
      return { success: true };
    }
    lastError = error;
    if (!error.message.toLowerCase().includes("could not find the")) break;
  }

  return {
    success: false,
    error: lastError ? formatDbError(lastError) : "No s'ha pogut desar el deure.",
  };
}

// Desa el feedback escrit del professor sobre la resposta d'un deure i, tot
// seguit, elimina el fitxer (vídeo o PDF) del bucket corresponent (i la seva
// referència a la base de dades) perquè no en quedi cap rastre: un cop
// llegit i corregit pel professor, el fitxer ja no cal conservar-lo. Una
// resposta de text no s'esborra mai (no ocupa Storage i no hi ha el mateix
// motiu de privacitat/espai).
export async function submitTeacherFeedback(
  assignmentId: string,
  input: { feedback: string }
): Promise<ActionResult> {
  try {
    await requireProfile("professor");
  } catch {
    return { success: false, error: "No autoritzat." };
  }

  const teacher = await getMyTeacherProfile();
  if (!teacher) {
    return { success: false, error: "El teu compte no té cap fitxa de professor vinculada." };
  }

  const feedback = input.feedback.trim();
  if (!feedback) {
    return { success: false, error: "Escriu un feedback abans d'enviar-lo." };
  }

  const supabase = await createClient();

  // Els paths dels fitxers els llegim aquí, del servidor, en lloc de confiar
  // en el que enviï el client: així ens assegurem que només s'esborra el
  // fitxer que realment pertany a aquest deure (i comprovem alhora que el
  // deure és seu, via teacher_id).
  const { data: row, error: rowError } = await supabase
    .from("assignments")
    .select("submission_video_path, submission_pdf_path")
    .eq("id", assignmentId)
    .eq("teacher_id", teacher.id)
    .maybeSingle();

  if (rowError) {
    return { success: false, error: formatDbError(rowError) };
  }
  if (!row) {
    return { success: false, error: "No s'ha trobat aquest deure." };
  }

  const { submission_video_path: submissionVideoPath, submission_pdf_path: submissionPdfPath } =
    row as { submission_video_path: string | null; submission_pdf_path: string | null };

  // Esborrem els fitxers de Storage abans de tocar la fila, perquè si això
  // falla no acabem amb una fila que diu "sense fitxer" però amb el fitxer
  // encara ocupant espai al bucket (l'usuari no ho podria tornar a intentar).
  if (submissionVideoPath) {
    const { error: storageError } = await supabase.storage
      .from("submitted_videos")
      .remove([submissionVideoPath]);
    if (storageError) {
      console.error("submitTeacherFeedback: esborrat del vídeo ha fallat", storageError);
      return { success: false, error: `No s'ha pogut eliminar el vídeo: ${storageError.message}` };
    }
  }
  if (submissionPdfPath) {
    const { error: storageError } = await supabase.storage
      .from("submitted_documents")
      .remove([submissionPdfPath]);
    if (storageError) {
      console.error("submitTeacherFeedback: esborrat del PDF ha fallat", storageError);
      return { success: false, error: `No s'ha pogut eliminar el PDF: ${storageError.message}` };
    }
  }

  // Mateix patró de fallback en cascada que submitAssignmentVideo: si el
  // projecte de Supabase encara no té alguna de les columnes noves
  // (feedback_seen, submission_pdf_path...), reintentem amb un objecte més
  // petit en lloc de perdre el feedback i deixar els fitxers ja esborrats
  // sense cap constància.
  const attempts: Record<string, unknown>[] = [
    {
      teacher_feedback: feedback,
      feedback_at: new Date().toISOString(),
      feedback_seen: false,
      submission_video_path: null,
      submission_pdf_path: null,
    },
    {
      teacher_feedback: feedback,
      feedback_at: new Date().toISOString(),
      submission_video_path: null,
      submission_pdf_path: null,
    },
    {
      teacher_feedback: feedback,
      submission_video_path: null,
      submission_pdf_path: null,
    },
    {
      teacher_feedback: feedback,
      submission_video_path: null,
    },
    {
      submission_video_path: null,
    },
  ];

  let lastError: { message: string; details?: string | null; hint?: string | null } | null = null;

  for (const payload of attempts) {
    const { error } = await supabase
      .from("assignments")
      .update(payload)
      .eq("id", assignmentId)
      .eq("teacher_id", teacher.id);

    if (!error) {
      revalidatePath("/professor/deures");
      revalidatePath("/alumne/deures");
      return { success: true };
    }

    console.error("submitTeacherFeedback: update ha fallat, provant un fallback", payload, error);
    lastError = error;

    if (!error.message.toLowerCase().includes("could not find the")) break;
  }

  return {
    success: false,
    error: lastError ? formatDbError(lastError) : "No s'ha pogut desar el feedback.",
  };
}

export async function deleteAssignment(assignmentId: string): Promise<ActionResult> {
  try {
    await requireProfile("professor");
  } catch {
    return { success: false, error: "No autoritzat." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("assignments").delete().eq("id", assignmentId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/professor/deures");
  return { success: true };
}
