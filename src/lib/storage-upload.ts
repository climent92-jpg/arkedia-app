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
//
// "fallbackContentType" es fa servir quan el navegador no sap detectar el
// tipus del fitxer (per exemple un vídeo gravat amb la càmera del mòbil, on
// file.type sovint arriba buit): sense un Content-Type de vídeo/àudio
// correcte a Storage, el <video> es reprodueix només amb so, sense imatge.
export async function uploadToStorage(
  bucket: string,
  folder: string,
  file: File,
  fallbackContentType?: string
): Promise<UploadResult> {
  const supabase = createClient();
  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const path = `${folder}/${crypto.randomUUID()}-${safeName}`;

  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    upsert: true,
    contentType: file.type || fallbackContentType || "application/octet-stream",
  });

  if (error) {
    // Inclou el codi/estat de Supabase Storage (ex: "Bucket not found") a
    // més del missatge, perquè qui rep l'error vegi exactament què ha
    // passat, no un "No s'ha pogut pujar el vídeo" genèric.
    const code = "statusCode" in error ? (error as { statusCode?: string }).statusCode : undefined;
    return { path: null, error: code ? `${error.message} (${code})` : error.message };
  }
  return { path, error: null };
}
