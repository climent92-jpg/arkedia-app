"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/supabase/auth";
import { getMyStudentProfile } from "@/lib/student-data";

export interface ActionResult {
  success: boolean;
  error?: string;
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
