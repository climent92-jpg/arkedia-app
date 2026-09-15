"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/supabase/auth";
import { getMyTeacherProfile } from "@/lib/professor-data";

export interface ActionResult {
  success: boolean;
  error?: string;
}

// Marca (o desmarca) un vídeo enviat per un alumne com a revisat, amb el
// comentari del professor. Només pot actuar sobre vídeos del seu propi
// teacher_id (comprovat aquí i, a més, per RLS).
export async function updateSubmittedVideoReview(
  videoId: string,
  input: { reviewed: boolean; teacherComment: string }
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

  const supabase = await createClient();
  const { error } = await supabase
    .from("submitted_videos")
    .update({
      reviewed: input.reviewed,
      teacher_comment: input.teacherComment.trim() || null,
    })
    .eq("id", videoId)
    .eq("teacher_id", teacher.id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/professor/material");
  return { success: true };
}
