import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

// Genera una URL signada (temporal) per a un fitxer d'un bucket privat de
// Storage, amb el client autenticat normal — respecta les mateixes policies
// de storage.objects que la pujada. Retorna null si l'arxiu no existeix o
// l'usuari no hi té accés, perquè la UI ho pugui tractar com "no disponible"
// en lloc de trencar la pàgina.
export async function getSignedUrl(
  supabase: SupabaseClient,
  bucket: string,
  path: string,
  expiresInSeconds = 3600
): Promise<string | null> {
  if (!path) return null;
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresInSeconds);

  if (error || !data) return null;
  return data.signedUrl;
}
