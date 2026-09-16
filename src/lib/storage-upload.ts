"use client";

import { createClient } from "@/lib/supabase/client";

export interface UploadResult {
  path: string | null;
  error: string | null;
}

// Puja un fitxer a un bucket de Supabase Storage des del navegador. El
// "folder" ha de ser l'identificador (teacher_id o student_id) que les
// policies de storage.objects fan servir per decidir qui hi té accés —
// vegeu supabase/schema.sql, seccions "materials_storage_*" i
// "submitted_videos_storage_*".
export async function uploadToStorage(
  bucket: string,
  folder: string,
  file: File
): Promise<UploadResult> {
  const supabase = createClient();
  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const path = `${folder}/${crypto.randomUUID()}-${safeName}`;

  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) return { path: null, error: error.message };
  return { path, error: null };
}
