"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/supabase/auth";
import { getMyTeacherProfile } from "@/lib/professor-data";
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
  revalidatePath("/professor/horaris");
  revalidatePath("/professor");
  revalidatePath("/admin/horaris");
}

// Inclou details/hint (quan Postgres els dona) perquè l'error que es mostri
// al professor sigui l'exacte de Supabase, no només un "message" genèric.
function formatDbError(error: { message: string; details?: string | null; hint?: string | null }) {
  let text = error.message;
  if (error.details) text += ` — ${error.details}`;
  if (error.hint) text += ` (${error.hint})`;
  return text;
}

export interface MyScheduleInput {
  studentId: string;
  weekday: DiaSetmana;
  startTime: string;
  endTime: string;
  instrument: string;
  modality: Modalitat;
  room?: string;
  notes?: string;
}

function validate(input: MyScheduleInput): string | null {
  if (!input.studentId) return "Cal triar un alumne.";
  if (!input.startTime || !input.endTime) return "Cal indicar l'hora d'inici i de fi.";
  if (input.endTime <= input.startTime) return "L'hora de fi ha de ser posterior a la d'inici.";
  if (!input.instrument.trim()) return "Cal indicar l'instrument.";
  return null;
}

export async function createMySchedule(input: MyScheduleInput): Promise<ActionResult> {
  try {
    await requireProfile("professor");
  } catch {
    return fail("No autoritzat.");
  }

  const teacher = await getMyTeacherProfile();
  if (!teacher) return fail("El teu compte no té cap fitxa de professor vinculada.");

  const validationError = validate(input);
  if (validationError) return fail(validationError);

  const supabase = await createClient();

  // Mateix patró de fallback en cascada que a la resta de l'app: si
  // l'esquema encara no té la columna "notes", reintentem sense ella.
  const attempts: Record<string, unknown>[] = [
    {
      teacher_id: teacher.id,
      student_id: input.studentId,
      weekday: input.weekday,
      start_time: input.startTime,
      end_time: input.endTime,
      instrument: input.instrument.trim(),
      modality: input.modality,
      room: input.room?.trim() || null,
      notes: input.notes?.trim() || null,
    },
    {
      teacher_id: teacher.id,
      student_id: input.studentId,
      weekday: input.weekday,
      start_time: input.startTime,
      end_time: input.endTime,
      instrument: input.instrument.trim(),
      modality: input.modality,
      room: input.room?.trim() || null,
    },
  ];

  let lastError: { message: string; details?: string | null; hint?: string | null } | null = null;

  for (const payload of attempts) {
    const { error } = await supabase.from("schedules").insert(payload);
    if (!error) {
      revalidateHoraris();
      return ok();
    }
    lastError = error;
    if (!error.message.toLowerCase().includes("could not find the")) break;
  }

  return fail(lastError ? formatDbError(lastError) : "No s'ha pogut crear la franja horària.");
}

// No filtrem per teacher_id a la clàusula .eq de baix perquè la policy RLS
// "schedules_update_teacher" ja restringeix l'acció a l'horari propi —
// però el filtre explícit és una segona capa de seguretat, com a la resta
// d'accions d'aquest portal.
export async function updateMySchedule(id: string, input: MyScheduleInput): Promise<ActionResult> {
  try {
    await requireProfile("professor");
  } catch {
    return fail("No autoritzat.");
  }

  const teacher = await getMyTeacherProfile();
  if (!teacher) return fail("El teu compte no té cap fitxa de professor vinculada.");

  const validationError = validate(input);
  if (validationError) return fail(validationError);

  const supabase = await createClient();

  const attempts: Record<string, unknown>[] = [
    {
      student_id: input.studentId,
      weekday: input.weekday,
      start_time: input.startTime,
      end_time: input.endTime,
      instrument: input.instrument.trim(),
      modality: input.modality,
      room: input.room?.trim() || null,
      notes: input.notes?.trim() || null,
    },
    {
      student_id: input.studentId,
      weekday: input.weekday,
      start_time: input.startTime,
      end_time: input.endTime,
      instrument: input.instrument.trim(),
      modality: input.modality,
      room: input.room?.trim() || null,
    },
  ];

  let lastError: { message: string; details?: string | null; hint?: string | null } | null = null;

  for (const payload of attempts) {
    const { error } = await supabase
      .from("schedules")
      .update(payload)
      .eq("id", id)
      .eq("teacher_id", teacher.id);
    if (!error) {
      revalidateHoraris();
      return ok();
    }
    lastError = error;
    if (!error.message.toLowerCase().includes("could not find the")) break;
  }

  return fail(lastError ? formatDbError(lastError) : "No s'ha pogut desar la franja horària.");
}

export async function deleteMySchedule(id: string): Promise<ActionResult> {
  try {
    await requireProfile("professor");
  } catch {
    return fail("No autoritzat.");
  }

  const teacher = await getMyTeacherProfile();
  if (!teacher) return fail("El teu compte no té cap fitxa de professor vinculada.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("schedules")
    .delete()
    .eq("id", id)
    .eq("teacher_id", teacher.id);

  if (error) return fail(error.message);

  revalidateHoraris();
  return ok();
}
