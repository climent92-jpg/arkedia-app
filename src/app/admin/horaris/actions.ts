"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminProfile } from "@/lib/supabase/auth";
import type { DiaSetmana, Modalitat } from "@/types";

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

function revalidateHoraris() {
  revalidatePath("/admin/horaris");
  revalidatePath("/admin");
}

export interface ScheduleInput {
  teacherId: string;
  studentId: string;
  weekday: DiaSetmana;
  startTime: string;
  endTime: string;
  instrument: string;
  modality: Modalitat;
  room?: string;
}

export async function createSchedule(input: ScheduleInput): Promise<ActionResult> {
  try {
    await requireAdminProfile();
  } catch {
    return fail("No autoritzat.");
  }

  if (!input.teacherId || !input.studentId) {
    return fail("Cal triar un professor i un alumne.");
  }
  if (!input.startTime || !input.endTime) {
    return fail("Cal indicar l'hora d'inici i de fi.");
  }
  if (input.endTime <= input.startTime) {
    return fail("L'hora de fi ha de ser posterior a la d'inici.");
  }
  if (!input.instrument.trim()) {
    return fail("Cal indicar l'instrument.");
  }

  const admin = createAdminClient();
  const { error } = await admin.from("schedules").insert({
    teacher_id: input.teacherId,
    student_id: input.studentId,
    weekday: input.weekday,
    start_time: input.startTime,
    end_time: input.endTime,
    instrument: input.instrument.trim(),
    modality: input.modality,
    room: input.room?.trim() || null,
  });

  if (error) return fail(error.message);

  revalidateHoraris();
  return ok();
}

export async function deleteSchedule(id: string): Promise<ActionResult> {
  try {
    await requireAdminProfile();
  } catch {
    return fail("No autoritzat.");
  }

  const admin = createAdminClient();
  const { error } = await admin.from("schedules").delete().eq("id", id);
  if (error) return fail(error.message);

  revalidateHoraris();
  return ok();
}
