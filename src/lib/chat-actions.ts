"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/auth";

export interface ActionResult {
  success: boolean;
  error?: string;
}

// Envia un missatge a un fil (família o professor, indistintament — la RLS
// "messages_insert_participant" ja comprova que qui truca sigui una de les
// dues bandes d'aquest fil).
export async function sendMessage(threadId: string, body: string): Promise<ActionResult> {
  const profile = await getCurrentProfile();
  if (!profile) return { success: false, error: "No autoritzat." };

  const trimmed = body.trim();
  if (!trimmed) return { success: false, error: "El missatge és buit." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("messages")
    .insert({ thread_id: threadId, sender_id: profile.id, body: trimmed });

  if (error) return { success: false, error: error.message };
  return { success: true };
}

// Elimina la conversa sencera (i, en cascada, tots els seus missatges) per a
// totes dues bandes — la RLS "message_threads_delete_participant" ja
// comprova que qui truca sigui una de les dues bandes d'aquest fil.
export async function deleteThread(threadId: string): Promise<ActionResult> {
  const profile = await getCurrentProfile();
  if (!profile) return { success: false, error: "No autoritzat." };

  const supabase = await createClient();
  const { error } = await supabase.from("message_threads").delete().eq("id", threadId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/professor/xat");
  revalidatePath("/alumne/xat");
  return { success: true };
}
