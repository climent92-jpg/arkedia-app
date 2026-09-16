"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/supabase/auth";
import { getMyStudentProfile } from "@/lib/student-data";

export interface ActionResult {
  success: boolean;
  error?: string;
}

// Desa la fila de submitted_videos després que el navegador hagi pujat el
// fitxer a Supabase Storage (bucket "submitted-videos"). Només crea la fila:
// requireix que storagePath ja existeixi al bucket sota la carpeta del propi
// alumne, tal com exigeix la policy submitted_videos_storage_insert_family.
export async function submitVideo(input: {
  title: string;
  note?: string;
  storagePath: string;
  teacherId: string;
}): Promise<ActionResult> {
  try {
    await requireProfile("familia");
  } catch {
    return { success: false, error: "No autoritzat." };
  }

  const student = await getMyStudentProfile();
  if (!student) {
    return { success: false, error: "El teu compte no té cap fitxa d'alumne vinculada." };
  }

  if (!input.title.trim() || !input.storagePath || !input.teacherId) {
    return { success: false, error: "Falten dades del vídeo." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("submitted_videos").insert({
    student_id: student.id,
    teacher_id: input.teacherId,
    title: input.title.trim(),
    student_note: input.note?.trim() || null,
    storage_path: input.storagePath,
  });

  if (error) return { success: false, error: error.message };

  revalidatePath("/alumne/material");
  return { success: true };
}
