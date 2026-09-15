"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminProfile } from "@/lib/supabase/auth";
import type { UserRole } from "@/types";

export interface ActionResult {
  success: boolean;
  error?: string;
  tempPassword?: string;
}

export type AccessMode = "none" | "new" | "existing";

function ok(extra?: Partial<ActionResult>): ActionResult {
  return { success: true, ...extra };
}

function fail(error: string): ActionResult {
  return { success: false, error };
}

// Contrasenya temporal fàcil de llegir i prou forta per compartir un cop amb
// la persona (se li demanarà que la canviï en el primer accés).
function generateTempPassword() {
  const words = ["Nota", "Ritme", "Clau", "Corda", "Compas", "Escala"];
  const word = words[Math.floor(Math.random() * words.length)];
  const digits = Math.floor(1000 + Math.random() * 9000);
  return `${word}${digits}!`;
}

function revalidateAdmin() {
  revalidatePath("/admin/usuaris");
  revalidatePath("/admin");
}

// ---------------------------------------------------------------------------
// USUARIS (public.users + Supabase Auth)
// ---------------------------------------------------------------------------

export async function createUser(input: {
  fullName: string;
  email: string;
  role: UserRole;
  phone?: string;
  password?: string;
}): Promise<ActionResult> {
  try {
    await requireAdminProfile();
  } catch {
    return fail("No autoritzat.");
  }

  if (!input.fullName.trim() || !input.email.trim()) {
    return fail("El nom i el correu són obligatoris.");
  }

  const admin = createAdminClient();
  const password = input.password?.trim() || generateTempPassword();

  const { data, error } = await admin.auth.admin.createUser({
    email: input.email.trim(),
    password,
    email_confirm: true,
    user_metadata: { full_name: input.fullName.trim() },
  });

  if (error || !data.user) {
    return fail(error?.message ?? "No s'ha pogut crear el compte a Supabase Auth.");
  }

  const { error: profileError } = await admin.from("users").insert({
    id: data.user.id,
    role: input.role,
    full_name: input.fullName.trim(),
    email: input.email.trim(),
    phone: input.phone?.trim() || null,
  });

  if (profileError) {
    await admin.auth.admin.deleteUser(data.user.id);
    return fail(profileError.message);
  }

  revalidateAdmin();
  return ok({ tempPassword: password });
}

export async function updateUser(
  id: string,
  input: { fullName: string; role: UserRole; phone?: string }
): Promise<ActionResult> {
  try {
    await requireAdminProfile();
  } catch {
    return fail("No autoritzat.");
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("users")
    .update({
      full_name: input.fullName.trim(),
      role: input.role,
      phone: input.phone?.trim() || null,
    })
    .eq("id", id);

  if (error) return fail(error.message);

  revalidateAdmin();
  return ok();
}

export async function deleteUser(id: string): Promise<ActionResult> {
  let caller;
  try {
    caller = await requireAdminProfile();
  } catch {
    return fail("No autoritzat.");
  }

  if (caller.id === id) {
    return fail("No et pots eliminar a tu mateix.");
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(id);
  if (error) return fail(error.message);

  revalidateAdmin();
  return ok();
}

// ---------------------------------------------------------------------------
// Helper compartit: crea (o reutilitza) l'accés d'inici de sessió d'un
// professor o d'una família.
// ---------------------------------------------------------------------------

async function resolveUserId(
  admin: ReturnType<typeof createAdminClient>,
  params: {
    accessMode: AccessMode;
    existingUserId?: string;
    role: UserRole;
    fullName: string;
    email?: string;
    password?: string;
  }
): Promise<{ userId: string | null; tempPassword?: string } | { error: string }> {
  if (params.accessMode === "none") return { userId: null };

  if (params.accessMode === "existing") {
    if (!params.existingUserId) return { error: "Selecciona un usuari existent." };
    return { userId: params.existingUserId };
  }

  // accessMode === "new"
  if (!params.email?.trim()) {
    return { error: "Cal un correu electrònic per crear l'accés." };
  }
  const password = params.password?.trim() || generateTempPassword();

  const { data, error } = await admin.auth.admin.createUser({
    email: params.email.trim(),
    password,
    email_confirm: true,
    user_metadata: { full_name: params.fullName },
  });

  if (error || !data.user) {
    return { error: error?.message ?? "No s'ha pogut crear el compte d'accés." };
  }

  const { error: profileError } = await admin.from("users").insert({
    id: data.user.id,
    role: params.role,
    full_name: params.fullName,
    email: params.email.trim(),
  });

  if (profileError) {
    await admin.auth.admin.deleteUser(data.user.id);
    return { error: profileError.message };
  }

  return { userId: data.user.id, tempPassword: password };
}

// ---------------------------------------------------------------------------
// PROFESSORS (public.teachers)
// ---------------------------------------------------------------------------

export interface TeacherInput {
  firstName: string;
  lastName: string;
  email: string;
  instruments: string[];
  bio?: string;
  accessMode: AccessMode;
  existingUserId?: string;
  password?: string;
}

export async function createTeacher(input: TeacherInput): Promise<ActionResult> {
  try {
    await requireAdminProfile();
  } catch {
    return fail("No autoritzat.");
  }

  if (!input.firstName.trim() || !input.lastName.trim() || !input.email.trim()) {
    return fail("Nom, cognoms i correu són obligatoris.");
  }

  const admin = createAdminClient();
  const fullName = `${input.firstName.trim()} ${input.lastName.trim()}`;

  const resolved = await resolveUserId(admin, {
    accessMode: input.accessMode,
    existingUserId: input.existingUserId,
    role: "professor",
    fullName,
    email: input.email,
    password: input.password,
  });
  if ("error" in resolved) return fail(resolved.error);

  const { error } = await admin.from("teachers").insert({
    user_id: resolved.userId,
    first_name: input.firstName.trim(),
    last_name: input.lastName.trim(),
    email: input.email.trim(),
    instruments: input.instruments,
    bio: input.bio?.trim() || null,
  });

  if (error) return fail(error.message);

  revalidateAdmin();
  return ok({ tempPassword: resolved.tempPassword });
}

export async function updateTeacher(
  id: string,
  input: TeacherInput
): Promise<ActionResult> {
  try {
    await requireAdminProfile();
  } catch {
    return fail("No autoritzat.");
  }

  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("teachers")
    .select("user_id")
    .eq("id", id)
    .single();

  let userId = existing?.user_id ?? null;
  let tempPassword: string | undefined;

  // Només permetem AFEGIR accés si encara no en té (no desvincular/canviar
  // des d'aquí, per evitar deixar comptes d'Auth orfes per accident).
  if (!userId && input.accessMode !== "none") {
    const fullName = `${input.firstName.trim()} ${input.lastName.trim()}`;
    const resolved = await resolveUserId(admin, {
      accessMode: input.accessMode,
      existingUserId: input.existingUserId,
      role: "professor",
      fullName,
      email: input.email,
      password: input.password,
    });
    if ("error" in resolved) return fail(resolved.error);
    userId = resolved.userId;
    tempPassword = resolved.tempPassword;
  }

  const { error } = await admin
    .from("teachers")
    .update({
      user_id: userId,
      first_name: input.firstName.trim(),
      last_name: input.lastName.trim(),
      email: input.email.trim(),
      instruments: input.instruments,
      bio: input.bio?.trim() || null,
    })
    .eq("id", id);

  if (error) return fail(error.message);

  revalidateAdmin();
  return ok({ tempPassword });
}

export async function deleteTeacher(
  id: string,
  alsoDeleteAccount: boolean
): Promise<ActionResult> {
  try {
    await requireAdminProfile();
  } catch {
    return fail("No autoritzat.");
  }

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("teachers")
    .select("user_id")
    .eq("id", id)
    .single();

  const { error } = await admin.from("teachers").delete().eq("id", id);
  if (error) return fail(error.message);

  if (alsoDeleteAccount && existing?.user_id) {
    await admin.auth.admin.deleteUser(existing.user_id);
  }

  revalidateAdmin();
  return ok();
}

// ---------------------------------------------------------------------------
// ALUMNES (public.students)
// ---------------------------------------------------------------------------

export interface StudentInput {
  firstName: string;
  lastName: string;
  course?: string;
  fatherName?: string;
  fatherEmail?: string;
  fatherPhone?: string;
  motherName?: string;
  motherEmail?: string;
  motherPhone?: string;
  notes?: string;
  teacherIds: string[];
  accessMode: AccessMode;
  existingUserId?: string;
  password?: string;
  accessEmail?: string;
  accessFullName?: string;
}

// Substitueix del tot les relacions student_teachers d'un alumne pel
// conjunt seleccionat al formulari (esborra i torna a inserir).
async function syncStudentTeachers(
  admin: ReturnType<typeof createAdminClient>,
  studentId: string,
  teacherIds: string[]
): Promise<string | null> {
  const { error: deleteError } = await admin
    .from("student_teachers")
    .delete()
    .eq("student_id", studentId);
  if (deleteError) return deleteError.message;

  if (teacherIds.length === 0) return null;

  const { error: insertError } = await admin
    .from("student_teachers")
    .insert(teacherIds.map((teacherId) => ({ student_id: studentId, teacher_id: teacherId })));

  return insertError?.message ?? null;
}

export async function createStudent(input: StudentInput): Promise<ActionResult> {
  try {
    await requireAdminProfile();
  } catch {
    return fail("No autoritzat.");
  }

  if (!input.firstName.trim() || !input.lastName.trim()) {
    return fail("El nom i els cognoms de l'alumne són obligatoris.");
  }

  const admin = createAdminClient();

  const resolved = await resolveUserId(admin, {
    accessMode: input.accessMode,
    existingUserId: input.existingUserId,
    role: "familia",
    fullName: input.accessFullName?.trim() || `Família ${input.lastName.trim()}`,
    email: input.accessEmail || input.motherEmail || input.fatherEmail,
    password: input.password,
  });
  if ("error" in resolved) return fail(resolved.error);

  const { data: inserted, error } = await admin
    .from("students")
    .insert({
      family_user_id: resolved.userId,
      first_name: input.firstName.trim(),
      last_name: input.lastName.trim(),
      course: input.course?.trim() || null,
      father_name: input.fatherName?.trim() || null,
      father_email: input.fatherEmail?.trim() || null,
      father_phone: input.fatherPhone?.trim() || null,
      mother_name: input.motherName?.trim() || null,
      mother_email: input.motherEmail?.trim() || null,
      mother_phone: input.motherPhone?.trim() || null,
      notes: input.notes?.trim() || null,
    })
    .select("id")
    .single();

  if (error || !inserted) return fail(error?.message ?? "No s'ha pogut crear l'alumne/a.");

  const syncError = await syncStudentTeachers(admin, inserted.id, input.teacherIds);
  if (syncError) return fail(syncError);

  revalidateAdmin();
  return ok({ tempPassword: resolved.tempPassword });
}

export async function updateStudent(
  id: string,
  input: StudentInput
): Promise<ActionResult> {
  try {
    await requireAdminProfile();
  } catch {
    return fail("No autoritzat.");
  }

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("students")
    .select("family_user_id")
    .eq("id", id)
    .single();

  let familyUserId = existing?.family_user_id ?? null;
  let tempPassword: string | undefined;

  if (!familyUserId && input.accessMode !== "none") {
    const resolved = await resolveUserId(admin, {
      accessMode: input.accessMode,
      existingUserId: input.existingUserId,
      role: "familia",
      fullName: input.accessFullName?.trim() || `Família ${input.lastName.trim()}`,
      email: input.accessEmail || input.motherEmail || input.fatherEmail,
      password: input.password,
    });
    if ("error" in resolved) return fail(resolved.error);
    familyUserId = resolved.userId;
    tempPassword = resolved.tempPassword;
  }

  const { error } = await admin
    .from("students")
    .update({
      family_user_id: familyUserId,
      first_name: input.firstName.trim(),
      last_name: input.lastName.trim(),
      course: input.course?.trim() || null,
      father_name: input.fatherName?.trim() || null,
      father_email: input.fatherEmail?.trim() || null,
      father_phone: input.fatherPhone?.trim() || null,
      mother_name: input.motherName?.trim() || null,
      mother_email: input.motherEmail?.trim() || null,
      mother_phone: input.motherPhone?.trim() || null,
      notes: input.notes?.trim() || null,
    })
    .eq("id", id);

  if (error) return fail(error.message);

  const syncError = await syncStudentTeachers(admin, id, input.teacherIds);
  if (syncError) return fail(syncError);

  revalidateAdmin();
  return ok({ tempPassword });
}

export async function deleteStudent(
  id: string,
  alsoDeleteAccount: boolean
): Promise<ActionResult> {
  try {
    await requireAdminProfile();
  } catch {
    return fail("No autoritzat.");
  }

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("students")
    .select("family_user_id")
    .eq("id", id)
    .single();

  const { error } = await admin.from("students").delete().eq("id", id);
  if (error) return fail(error.message);

  if (alsoDeleteAccount && existing?.family_user_id) {
    await admin.auth.admin.deleteUser(existing.family_user_id);
  }

  revalidateAdmin();
  return ok();
}
