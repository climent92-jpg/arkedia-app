"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminProfile } from "@/lib/supabase/auth";
import { isAdminConfigured } from "@/lib/supabase/config";
import type { ImportedRow } from "@/lib/csv-import";

export interface ImportSummary {
  success: boolean;
  error?: string;
  createdTeachers: number;
  createdStudents: number;
  createdSchedules: number;
  skippedSchedules: number;
  rowErrors: string[];
}

function emptySummary(error: string): ImportSummary {
  return {
    success: false,
    error,
    createdTeachers: 0,
    createdStudents: 0,
    createdSchedules: 0,
    skippedSchedules: 0,
    rowErrors: [],
  };
}

type AdminClient = ReturnType<typeof createAdminClient>;

async function findOrCreateTeacher(
  admin: AdminClient,
  firstName: string
): Promise<{ id: string; instruments: string[]; created: boolean }> {
  const { data: existing } = await admin
    .from("teachers")
    .select("id, instruments")
    .ilike("first_name", firstName.trim())
    .maybeSingle();

  if (existing) {
    return { id: existing.id, instruments: existing.instruments ?? [], created: false };
  }

  const placeholderEmail = `${firstName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")}.${Date.now()}@pendent.arkedia.cat`;

  const { data: inserted, error } = await admin
    .from("teachers")
    .insert({
      first_name: firstName.trim(),
      last_name: "(pendent)",
      email: placeholderEmail,
      instruments: [],
    })
    .select("id, instruments")
    .single();

  if (error || !inserted) {
    throw new Error(`No s'ha pogut crear el professor/a "${firstName}": ${error?.message}`);
  }

  return { id: inserted.id, instruments: inserted.instruments ?? [], created: true };
}

async function findOrCreateStudent(
  admin: AdminClient,
  row: ImportedRow
): Promise<{ id: string; created: boolean }> {
  const { data: existing } = await admin
    .from("students")
    .select("id")
    .ilike("first_name", row.nom.trim())
    .ilike("last_name", row.cognoms.trim())
    .maybeSingle();

  if (existing) return { id: existing.id, created: false };

  const { data: inserted, error } = await admin
    .from("students")
    .insert({
      first_name: row.nom.trim(),
      last_name: row.cognoms.trim(),
      course: row.curs.trim() || null,
      father_email: row.mailPare.trim() || null,
      father_phone: row.telefonPare.trim() || null,
      mother_email: row.mailMare.trim() || null,
      mother_phone: row.telefonMare.trim() || null,
    })
    .select("id")
    .single();

  if (error || !inserted) {
    throw new Error(
      `No s'ha pogut crear l'alumne/a "${row.nom} ${row.cognoms}": ${error?.message}`
    );
  }

  return { id: inserted.id, created: true };
}

// Insereix a Supabase (students, teachers, student_teachers, schedules) les
// files vàlides que ha generat l'importador de CSV. Detecta professors i
// alumnes existents pel nom (sense crear-ne de duplicats) i evita duplicar
// horaris ja importats abans.
export async function importScheduleRows(rows: ImportedRow[]): Promise<ImportSummary> {
  try {
    await requireAdminProfile();
  } catch {
    return emptySummary("No autoritzat.");
  }

  if (!isAdminConfigured()) {
    return emptySummary(
      "Falta configurar SUPABASE_SERVICE_ROLE_KEY per poder escriure a Supabase."
    );
  }

  const validRows = rows.filter((r) => r.errors.length === 0);
  if (validRows.length === 0) {
    return emptySummary("No hi ha cap fila vàlida per importar.");
  }

  const admin = createAdminClient();
  const teacherCache = new Map<string, { id: string; instruments: string[] }>();
  const rowErrors: string[] = [];

  let createdTeachers = 0;
  let createdStudents = 0;
  let createdSchedules = 0;
  let skippedSchedules = 0;

  for (const row of validRows) {
    try {
      const teacherKey = row.professor.trim().toLowerCase();
      let teacher = teacherCache.get(teacherKey);
      if (!teacher) {
        if (!row.professor.trim()) {
          rowErrors.push(`${row.nom} ${row.cognoms}: falta el nom del professor/a.`);
          continue;
        }
        const result = await findOrCreateTeacher(admin, row.professor);
        teacher = { id: result.id, instruments: result.instruments };
        teacherCache.set(teacherKey, teacher);
        if (result.created) createdTeachers++;
      }

      const student = await findOrCreateStudent(admin, row);
      if (student.created) createdStudents++;

      await admin
        .from("student_teachers")
        .upsert(
          { student_id: student.id, teacher_id: teacher.id },
          { onConflict: "student_id,teacher_id", ignoreDuplicates: true }
        );

      const { data: existingSchedule } = await admin
        .from("schedules")
        .select("id")
        .eq("teacher_id", teacher.id)
        .eq("student_id", student.id)
        .eq("weekday", row.dia!)
        .eq("start_time", row.horaInici!)
        .maybeSingle();

      if (existingSchedule) {
        skippedSchedules++;
        continue;
      }

      const instrument =
        teacher.instruments.length === 1 ? teacher.instruments[0] : "Pendent d'especificar";

      const { error: scheduleError } = await admin.from("schedules").insert({
        teacher_id: teacher.id,
        student_id: student.id,
        weekday: row.dia,
        start_time: row.horaInici,
        end_time: row.horaFi,
        instrument,
        modality: row.modalitat,
      });

      if (scheduleError) {
        rowErrors.push(`${row.nom} ${row.cognoms}: ${scheduleError.message}`);
        continue;
      }

      createdSchedules++;
    } catch (err) {
      rowErrors.push(err instanceof Error ? err.message : "Error desconegut en una fila.");
    }
  }

  revalidatePath("/admin");
  revalidatePath("/admin/usuaris");
  revalidatePath("/admin/importador");

  return {
    success: true,
    createdTeachers,
    createdStudents,
    createdSchedules,
    skippedSchedules,
    rowErrors,
  };
}
