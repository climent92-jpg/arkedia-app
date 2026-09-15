"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, Pencil, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Input, Textarea } from "@/components/ui/input";
import { Field, FormError, TempPasswordBanner } from "./users-manager";
import { AccessFields } from "./teachers-manager";
import { createStudent, deleteStudent, updateStudent, type AccessMode } from "./actions";
import type { AdminStudentRow, AdminUserRow } from "@/types";

interface FormState {
  id?: string;
  firstName: string;
  lastName: string;
  course: string;
  fatherName: string;
  fatherEmail: string;
  fatherPhone: string;
  motherName: string;
  motherEmail: string;
  motherPhone: string;
  notes: string;
  accessMode: AccessMode;
  existingUserId: string;
  password: string;
  email: string;
}

function emptyForm(): FormState {
  return {
    firstName: "",
    lastName: "",
    course: "",
    fatherName: "",
    fatherEmail: "",
    fatherPhone: "",
    motherName: "",
    motherEmail: "",
    motherPhone: "",
    notes: "",
    accessMode: "none",
    existingUserId: "",
    password: "",
    email: "",
  };
}

export function StudentsManager({
  initialStudents,
  availableUsers,
}: {
  initialStudents: AdminStudentRow[];
  availableUsers: AdminUserRow[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [error, setError] = useState<string | null>(null);
  const [tempPassword, setTempPassword] = useState<{ email: string; password: string } | null>(
    null
  );

  const linkableUsers = availableUsers.filter((u) => u.role === "familia");

  function openCreate() {
    setForm(emptyForm());
    setError(null);
    setOpen(true);
  }

  function openEdit(s: AdminStudentRow) {
    setForm({
      id: s.id,
      firstName: s.firstName,
      lastName: s.lastName,
      course: s.course ?? "",
      fatherName: s.fatherName ?? "",
      fatherEmail: s.fatherEmail ?? "",
      fatherPhone: s.fatherPhone ?? "",
      motherName: s.motherName ?? "",
      motherEmail: s.motherEmail ?? "",
      motherPhone: s.motherPhone ?? "",
      notes: s.notes ?? "",
      accessMode: s.familyUserId ? "existing" : "none",
      existingUserId: s.familyUserId ?? "",
      password: "",
      email: s.linkedUserEmail ?? s.motherEmail ?? s.fatherEmail ?? "",
    });
    setError(null);
    setOpen(true);
  }

  function submit() {
    setError(null);
    const payload = {
      firstName: form.firstName,
      lastName: form.lastName,
      course: form.course,
      fatherName: form.fatherName,
      fatherEmail: form.fatherEmail,
      fatherPhone: form.fatherPhone,
      motherName: form.motherName,
      motherEmail: form.motherEmail,
      motherPhone: form.motherPhone,
      notes: form.notes,
      accessMode: form.accessMode,
      existingUserId: form.existingUserId || undefined,
      password: form.password || undefined,
      accessEmail: form.email || undefined,
      accessFullName:
        form.motherName || form.fatherName || `Família ${form.lastName}` || undefined,
    };

    startTransition(async () => {
      const result = form.id
        ? await updateStudent(form.id, payload)
        : await createStudent(payload);

      if (!result.success) {
        setError(result.error ?? "Alguna cosa ha fallat.");
        return;
      }
      if (result.tempPassword) {
        setTempPassword({ email: form.email, password: result.tempPassword });
      }
      setOpen(false);
      router.refresh();
    });
  }

  function remove(s: AdminStudentRow) {
    const alsoDeleteAccount = s.linkedUserEmail
      ? confirm(
          `La família de ${s.firstName} té accés (${s.linkedUserEmail}). Vols eliminar també aquest compte? Cancel·la per mantenir-lo.`
        )
      : false;
    if (!confirm(`Eliminar l'alumne/a ${s.firstName} ${s.lastName}?`)) return;

    startTransition(async () => {
      const result = await deleteStudent(s.id, alsoDeleteAccount);
      if (!result.success) {
        alert(result.error ?? "No s'ha pogut eliminar.");
        return;
      }
      router.refresh();
    });
  }

  return (
    <div>
      {tempPassword && (
        <TempPasswordBanner
          email={tempPassword.email}
          password={tempPassword.password}
          onClose={() => setTempPassword(null)}
        />
      )}

      <div className="mb-4 flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={openCreate}>
              <Plus className="size-4" />
              Nou alumne/a
            </Button>
          </DialogTrigger>
          <DialogContent title={form.id ? "Editar alumne/a" : "Nou alumne/a"}>
            <div className="flex flex-col gap-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Nom">
                  <Input
                    value={form.firstName}
                    onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                  />
                </Field>
                <Field label="Cognoms">
                  <Input
                    value={form.lastName}
                    onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                  />
                </Field>
              </div>
              <Field label="Curs">
                <Input
                  value={form.course}
                  onChange={(e) => setForm((f) => ({ ...f, course: e.target.value }))}
                  placeholder="Ex: 5è EPRI"
                />
              </Field>

              <div className="grid gap-3 rounded-xl border border-border p-3 sm:grid-cols-2">
                <Field label="Nom del pare">
                  <Input
                    value={form.fatherName}
                    onChange={(e) => setForm((f) => ({ ...f, fatherName: e.target.value }))}
                  />
                </Field>
                <Field label="Nom de la mare">
                  <Input
                    value={form.motherName}
                    onChange={(e) => setForm((f) => ({ ...f, motherName: e.target.value }))}
                  />
                </Field>
                <Field label="Correu del pare">
                  <Input
                    type="email"
                    value={form.fatherEmail}
                    onChange={(e) => setForm((f) => ({ ...f, fatherEmail: e.target.value }))}
                  />
                </Field>
                <Field label="Correu de la mare">
                  <Input
                    type="email"
                    value={form.motherEmail}
                    onChange={(e) => setForm((f) => ({ ...f, motherEmail: e.target.value }))}
                  />
                </Field>
                <Field label="Telèfon del pare">
                  <Input
                    value={form.fatherPhone}
                    onChange={(e) => setForm((f) => ({ ...f, fatherPhone: e.target.value }))}
                  />
                </Field>
                <Field label="Telèfon de la mare">
                  <Input
                    value={form.motherPhone}
                    onChange={(e) => setForm((f) => ({ ...f, motherPhone: e.target.value }))}
                  />
                </Field>
              </div>

              <Field label="Notes (opcional)">
                <Textarea
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                />
              </Field>

              {!form.id || !form.existingUserId ? (
                <AccessFields
                  form={form}
                  setForm={setForm}
                  linkableUsers={linkableUsers}
                  emailLabel="Correu d'accés de la família (login)"
                />
              ) : (
                <p className="rounded-lg bg-arkedia-blue-light/50 px-3 py-2 text-xs text-arkedia-blue">
                  Ja té accés vinculat. Elimina l&apos;alumne per canviar-lo.
                </p>
              )}

              {error && <FormError>{error}</FormError>}

              <Button onClick={submit} disabled={pending} className="mt-1">
                {pending ? "Desant..." : form.id ? "Desar canvis" : "Crear alumne/a"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col gap-2">
        {initialStudents.map((s) => (
          <Card key={s.id}>
            <CardContent className="flex flex-wrap items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold">
                    {s.firstName} {s.lastName}
                  </p>
                  {s.course && <Badge variant="outline">{s.course}</Badge>}
                  {s.linkedUserEmail && (
                    <Badge variant="success">Accés: {s.linkedUserEmail}</Badge>
                  )}
                </div>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-muted">
                  <GraduationCap className="size-3" />
                  {[s.motherEmail, s.fatherEmail].filter(Boolean).join(" · ") ||
                    "Sense contacte"}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  onClick={() => openEdit(s)}
                  className="flex size-9 items-center justify-center rounded-lg text-muted hover:bg-black/[0.05] hover:text-arkedia-blue"
                  aria-label="Editar"
                >
                  <Pencil className="size-4" />
                </button>
                <button
                  onClick={() => remove(s)}
                  className="flex size-9 items-center justify-center rounded-lg text-muted hover:bg-red-50 hover:text-red-600"
                  aria-label="Eliminar"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </CardContent>
          </Card>
        ))}

        {initialStudents.length === 0 && (
          <Card>
            <CardContent className="p-6 text-center text-sm text-muted">
              Encara no hi ha cap alumne/a donat d&apos;alta.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
