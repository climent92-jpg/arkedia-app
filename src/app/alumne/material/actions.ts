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
// fitxer a Supabase Storage (bucket "submitted_videos"). Només crea la fila:
// requireix que storagePath ja existeixi al bucket sota la carpeta del propi
// alumne, tal com exigeix la policy submitted_videos_storage_insert_family.
// teacherId és opcional: si l'alumne encara no té cap professor assignat, es
// desa amb teacher_id nul en lloc de bloquejar la pujada — la policy
// "submitted_videos_select_teacher" es basa en student_teachers, no en
// aquest camp, així que el vídeo ja apareixerà al professor que se li
// assigni més endavant.
export async function submitVideo(input: {
  title: string;
  note?: string;
  storagePath: string;
  teacherId?: string;
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

  if (!input.title.trim() || !input.storagePath) {
    return { success: false, error: "Falten dades del vídeo." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("submitted_videos").insert({
    student_id: student.id,
    teacher_id: input.teacherId || null,
    title: input.title.trim(),
    student_note: input.note?.trim() || null,
    storage_path: input.storagePath,
  });

  if (error) return { success: false, error: error.message };

  revalidatePath("/alumne/material");
  revalidatePath("/professor/material");
  return { success: true };
}

// No cal filtrar per student_id: la policy RLS "submitted_videos_delete_family"
// ja restringeix l'acció als vídeos del propi alumne.
export async function deleteSubmittedVideo(videoId: string): Promise<ActionResult> {
  try {
    await requireProfile("familia");
  } catch {
    return { success: false, error: "No autoritzat." };
  }

  const supabase = await createClient();
  const { data: video } = await supabase
    .from("submitted_videos")
    .select("storage_path")
    .eq("id", videoId)
    .maybeSingle();

  const { error } = await supabase.from("submitted_videos").delete().eq("id", videoId);
  if (error) return { success: false, error: error.message };

  if (video?.storage_path) {
    await supabase.storage.from("submitted_videos").remove([video.storage_path]);
  }

  revalidatePath("/alumne/material");
  revalidatePath("/professor/material");
  return { success: true };
}
