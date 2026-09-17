"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentProfile } from "@/lib/supabase/auth";

// Aquestes dues accions només "apaguen" un punt de notificació: si fallen
// (esquema encara no migrat, sense connexió...) no cal que la pàgina ho
// sàpiga ni ho mostri — el punt simplement continuarà actiu una mica més.

// No hi ha cap policy RLS que permeti a un usuari actualitzar la seva
// pròpia fila de public.users (per evitar que pugui tocar-se el rol), així
// que aquest camp es desa amb el client d'administració. És segur perquè
// sempre apunta a profile.id, obtingut del servidor via auth.getUser(), mai
// d'un valor que enviï el client.
export async function markAvisosSeen(): Promise<void> {
  const profile = await getCurrentProfile();
  if (!profile) return;

  try {
    const admin = createAdminClient();
    await admin
      .from("users")
      .update({ avisos_last_seen_at: new Date().toISOString() })
      .eq("id", profile.id);
  } catch (error) {
    console.error("markAvisosSeen ha fallat", error);
  }
}

export async function markThreadRead(threadId: string): Promise<void> {
  const profile = await getCurrentProfile();
  if (!profile || (profile.role !== "familia" && profile.role !== "professor")) return;

  // Comprovem amb el client normal (RLS) que l'usuari realment participa en
  // aquest fil, abans d'escriure-hi amb el client d'administració.
  const supabase = await createClient();
  const { data: thread } = await supabase
    .from("message_threads")
    .select("id")
    .eq("id", threadId)
    .maybeSingle();
  if (!thread) return;

  const column = profile.role === "familia" ? "student_last_read_at" : "teacher_last_read_at";

  try {
    const admin = createAdminClient();
    await admin
      .from("message_threads")
      .update({ [column]: new Date().toISOString() })
      .eq("id", threadId);
  } catch (error) {
    console.error("markThreadRead ha fallat", error);
  }
}
