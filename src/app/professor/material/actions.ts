"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/supabase/auth";
import { getMyTeacherProfile } from "@/lib/professor-data";

export interface ActionResult {
  success: boolean;
  error?: string;
}

export interface MaterialInput {
  target: "student" | "all";
  studentId?: string;
  type: "partitura" | "video" | "audio";
  title: string;
  description?: string;
  storagePath: string;
}

// Desa la fila de materials després que el navegador hagi pujat el fitxer a
// Supabase Storage (bucket "materials"). target "all" (student_id null) el
// fa visible a tots els alumnes assignats a aquest professor.
export async function createMaterial(input: MaterialInput): Promise<ActionResult> {
  try {
    await requireProfile("professor");
  } catch {
    return { success: false, error: "No autoritzat." };
  }

  const teacher = await getMyTeacherProfile();
  if (!teacher) {
    return { success: false, error: "El teu compte no té cap fitxa de professor vinculada." };
  }

  if (!input.title.trim() || !input.storagePath) {
    return { success: false, error: "Falten dades del material." };
  }
  if (input.target === "student" && !input.studentId) {
    return { success: false, error: "Selecciona un alumne." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("materials").insert({
    student_id: input.target === "all" ? null : input.studentId,
    teacher_id: teacher.id,
    type: input.type,
    title: input.title.trim(),
    description: input.description?.trim() || null,
    storage_path: input.storagePath,
  });

  if (error) return { success: false, error: error.message };

  revalidatePath("/professor/material");
  revalidatePath("/alumne/material");
  return { success: true };
}

export async function deleteMaterial(materialId: string): Promise<ActionResult> {
  try {
    await requireProfile("professor");
  } catch {
    return { success: false, error: "No autoritzat." };
  }

  const supabase = await createClient();
  const { data: material } = await supabase
    .from("materials")
    .select("storage_path")
    .eq("id", materialId)
    .maybeSingle();

  const { error } = await supabase.from("materials").delete().eq("id", materialId);
  if (error) return { success: false, error: error.message };

  if (material?.storage_path) {
    await supabase.storage.from("materials").remove([material.storage_path]);
  }

  revalidatePath("/professor/material");
  revalidatePath("/alumne/material");
  return { success: true };
}
