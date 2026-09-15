"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/supabase/auth";
import { getMyTeacherProfile } from "@/lib/professor-data";

export interface ActionResult {
  success: boolean;
  error?: string;
}

export async function createAssignment(input: {
  studentId: string;
  title: string;
  description?: string;
  dueDate?: string;
}): Promise<ActionResult> {
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
  const { error } = await supabase.from("assignments").insert({
    student_id: input.studentId,
    teacher_id: teacher.id,
    title: input.title.trim(),
    description: input.description?.trim() || null,
    due_date: input.dueDate || null,
  });

  if (error) return { success: false, error: error.message };

  revalidatePath("/professor/deures");
  return { success: true };
}
