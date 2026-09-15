"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminProfile } from "@/lib/supabase/auth";

export interface ActionResult {
  success: boolean;
  error?: string;
}

function ok(): ActionResult {
  return { success: true };
}

function fail(error: string): ActionResult {
  return { success: false, error };
}

function revalidateAvisos() {
  revalidatePath("/admin/avisos");
}

export interface AnnouncementInput {
  title: string;
  body: string;
  audience: "tothom" | "professors" | "families";
}

export async function createAnnouncement(input: AnnouncementInput): Promise<ActionResult> {
  let caller;
  try {
    caller = await requireAdminProfile();
  } catch {
    return fail("No autoritzat.");
  }

  if (!input.title.trim() || !input.body.trim()) {
    return fail("El títol i el missatge són obligatoris.");
  }

  const admin = createAdminClient();
  const { error } = await admin.from("announcements").insert({
    author_id: caller.id,
    title: input.title.trim(),
    body: input.body.trim(),
    audience: input.audience,
  });

  if (error) return fail(error.message);

  revalidateAvisos();
  return ok();
}

export async function updateAnnouncement(
  id: string,
  input: AnnouncementInput
): Promise<ActionResult> {
  try {
    await requireAdminProfile();
  } catch {
    return fail("No autoritzat.");
  }

  if (!input.title.trim() || !input.body.trim()) {
    return fail("El títol i el missatge són obligatoris.");
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("announcements")
    .update({
      title: input.title.trim(),
      body: input.body.trim(),
      audience: input.audience,
    })
    .eq("id", id);

  if (error) return fail(error.message);

  revalidateAvisos();
  return ok();
}

export async function deleteAnnouncement(id: string): Promise<ActionResult> {
  try {
    await requireAdminProfile();
  } catch {
    return fail("No autoritzat.");
  }

  const admin = createAdminClient();
  const { error } = await admin.from("announcements").delete().eq("id", id);

  if (error) return fail(error.message);

  revalidateAvisos();
  return ok();
}
