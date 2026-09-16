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

  // Anem provant objectes d'UPDATE cada cop més petits: si el projecte de
  // Supabase encara no té alguna de les columnes noves (submitted_at,
  // submission_note...), PostgREST respon "Could not find the X column" i
  // fa fallar l'update sencer. En lloc de perdre el vídeo ja pujat a Storage,
  // reintentem sense els camps més recents fins que en quedi un que sí
  // existeixi — storage_path (la referència al vídeo) és l'únic
  // imprescindible i sempre és l'últim que descartem.
  const attempts: Record<string, unknown>[] = [
    {
      submission_video_path: input.storagePath,
      submission_note: input.note?.trim() || null,
      submitted_at: new Date().toISOString(),
      done: true,
    },
    {
      submission_video_path: input.storagePath,
      submission_note: input.note?.trim() || null,
      done: true,
    },
    {
      submission_video_path: input.storagePath,
      done: true,
    },
    {
      submission_video_path: input.storagePath,
    },
  ];

  let lastError: { message: string; details?: string | null; hint?: string | null } | null = null;

  for (const payload of attempts) {
    const { error } = await supabase
      .from("assignments")
      .update(payload)
      .eq("id", assignmentId)
      .eq("student_id", student.id);

    if (!error) {
      revalidatePath("/alumne/deures");
      revalidatePath("/professor/deures");
      return { success: true };
    }

    console.error("submitAssignmentVideo: update ha fallat, provant un fallback", payload, error);
    lastError = error;

    // Si l'error no és "columna no trobada" (p. ex. permisos, xarxa), no té
    // sentit seguir provant fallbacks amb menys camps: sempre fallarà igual.
    // PostgREST torna aquest missatge exacte quan li demanes una columna
    // que no existeix al seu "schema cache" (esquema no actualitzat).
    if (!error.message.toLowerCase().includes("could not find the")) break;
  }

  return {
    success: false,
    error: lastError ? formatDbError(lastError) : "No s'ha pogut desar el vídeo del deure.",
  };
}
