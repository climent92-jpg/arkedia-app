"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/supabase/auth";
import { getMyStudentProfile } from "@/lib/student-data";

export interface ActionResult {
  success: boolean;
  error?: string;
}

// Inclou details/hint (quan Postgres els dona) perquè l'error que es mostri
// a l'alumne sigui l'exacte de Supabase, no només un "message" genèric.
function formatDbError(error: { message: string; details?: string | null; hint?: string | null }) {
  let text = error.message;
  if (error.details) text += ` — ${error.details}`;
  if (error.hint) text += ` (${error.hint})`;
  return text;
}

// Marca (o desmarca) un deure com a fet. Només pot actuar sobre deures del
// seu propi student_id (comprovat aquí i, a més, per RLS).
export async function toggleAssignmentDone(
  assignmentId: string,
  done: boolean
): Promise<ActionResult> {
  try {
    await requireProfile("familia");
  } catch {
    return { success: false, error: "No autoritzat." };
  }

  const student = await getMyStudentProfile();
  if (!student) {
    return { success: false, error: "El teu compte no té cap fitxa d'alumne vinculada." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("assignments")
    .update({ done })
    .eq("id", assignmentId)
    .eq("student_id", student.id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/alumne/deures");
  return { success: true };
}

// Desa el vídeo de resposta d'un deure després que el navegador l'hagi pujat
// a Supabase Storage (bucket "submitted_videos", mateixa convenció de camins
// que els vídeos generals: "<student_id>/<uuid>-<filename>").
export async function submitAssignmentVideo(
  assignmentId: string,
  input: { storagePath: string; note?: string }
): Promise<ActionResult> {
  try {
    await requireProfile("familia");
  } catch {
    return { success: false, error: "No autoritzat." };
  }

  const student = await getMyStudentProfile();
  if (!student) {
    return { success: false, error: "El teu compte no té cap fitxa d'alumne vinculada." };
  }

  if (!input.storagePath) {
    return { success: false, error: "Falta el vídeo." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("assignments")
    .update({
      submission_video_path: input.storagePath,
      submission_note: input.note?.trim() || null,
      submitted_at: new Date().toISOString(),
    })
    .eq("id", assignmentId)
    .eq("student_id", student.id);

  if (error) {
    console.error("submitAssignmentVideo: update a assignments ha fallat", error);
    return { success: false, error: formatDbError(error) };
  }

  revalidatePath("/alumne/deures");
  revalidatePath("/professor/deures");
  return { success: true };
}
