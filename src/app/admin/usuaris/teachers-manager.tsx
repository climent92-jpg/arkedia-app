"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Mail, Music4, Pencil, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Field, FormError, TempPasswordBanner } from "./users-manager";
import { createTeacher, deleteTeacher, updateTeacher, type AccessMode } from "./actions";
import type { AdminTeacherRow, AdminUserRow, Instrument } from "@/types";

const INSTRUMENTS: Instrument[] = [
  "Piano",
  "Guitarra",
  "Bateria",
  "Cant",
  "Violí",
  "Baix",
  "Ukelele",
  "Saxòfon",
  "Llenguatge Musical",
];

interface FormState {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  instruments: string[];
  bio: string;
  accessMode: AccessMode;
  existingUserId: string;
  password: string;
}

function emptyForm(): FormState {
  return {
    firstName: "",
    lastName: "",
    email: "",
    instruments: [],
    bio: "",
    accessMode: "none",
    existingUserId: "",
    password: "",
  };
}

export function TeachersManager({
  initialTeachers,
  availableUsers,
}: {
  initialTeachers: AdminTeacherRow[];
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

  const linkableUsers = availableUsers.filter((u) => u.role === "professor");

  function openCreate() {
    setForm(emptyForm());
    setError(null);
    setOpen(true);
  }

  function openEdit(t: AdminTeacherRow) {
    setForm({
      id: t.id,
      firstName: t.firstName,
      lastName: t.lastName,
      email: t.email,
      instruments: t.instruments,
      bio: t.bio ?? "",
      accessMode: t.userId ? "existing" : "none",
      existingUserId: t.userId ?? "",
      password: "",
    });
    setError(null);
    setOpen(true);
  }

  function toggleInstrument(instrument: string) {
    setForm((f) => ({
      ...f,
      instruments: f.instruments.includes(instrument)
        ? f.instruments.filter((i) => i !== instrument)
        : [...f.instruments, instrument],
    }));
  }

  function submit() {
    setError(null);
    const payload = {
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      instruments: form.instruments,
      bio: form.bio,
      accessMode: form.accessMode,
      existingUserId: form.existingUserId || undefined,
      password: form.password || undefined,
    };

    startTransition(async () => {
      const result = form.id
        ? await updateTeacher(form.id, payload)
        : await createTeacher(payload);

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

  function remove(t: AdminTeacherRow) {
    const alsoDeleteAccount = t.linkedUserEmail
      ? confirm(
          `${t.firstName} ${t.lastName} té accés d'inici de sessió (${t.linkedUserEmail}). Vols eliminar també aquest compte? Cancel·la per mantenir-lo.`
        )
      : false;
    if (!confirm(`Eliminar el professor/a ${t.firstName} ${t.lastName}?`)) return;

    startTransition(async () => {
      const result = await deleteTeacher(t.id, alsoDeleteAccount);
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
              Nou professor/a
            </Button>
          </DialogTrigger>
          <DialogContent
            title={form.id ? "Editar professor/a" : "Nou professor/a"}
          >
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
              <Field label="Correu de contacte">
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="nom@arkedia.cat"
                />
              </Field>
              <Field label="Instruments">
                <div className="flex flex-wrap gap-1.5">
                  {INSTRUMENTS.map((i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => toggleInstrument(i)}
                      className={
                        form.instruments.includes(i)
                          ? "rounded-full bg-arkedia-blue px-3 py-1.5 text-xs font-semibold text-white"
                          : "rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-muted hover:border-arkedia-blue hover:text-arkedia-blue"
                      }
                    >
                      {i}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Bio (opcional)">
                <Textarea
                  rows={2}
                  value={form.bio}
                  onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                />
              </Field>

              {!form.id || !form.existingUserId ? (
                <AccessFields
                  form={form}
                  setForm={setForm}
                  linkableUsers={linkableUsers}
                  emailLabel="Correu d'accés (login)"
                />
              ) : (
                <p className="rounded-lg bg-arkedia-blue-light/50 px-3 py-2 text-xs text-arkedia-blue">
                  Ja té accés vinculat. Elimina el professor per canviar-lo.
                </p>
              )}

              {error && <FormError>{error}</FormError>}

              <Button onClick={submit} disabled={pending} className="mt-1">
                {pending ? "Desant..." : form.id ? "Desar canvis" : "Crear professor/a"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col gap-2">
        {initialTeachers.map((t) => (
          <Card key={t.id}>
            <CardContent className="flex flex-wrap items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <p className="font-semibold">
                  {t.firstName} {t.lastName}
                </p>
                <p className="flex items-center gap-1.5 text-xs text-muted">
                  <Mail className="size-3" />
                  {t.email}
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {t.instruments.map((i) => (
                    <Badge key={i} variant="outline">
                      <Music4 className="size-3" />
                      {i}
                    </Badge>
                  ))}
                  {t.linkedUserEmail && (
                    <Badge variant="success">Accés: {t.linkedUserEmail}</Badge>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  onClick={() => openEdit(t)}
                  className="flex size-9 items-center justify-center rounded-lg text-muted hover:bg-black/[0.05] hover:text-arkedia-blue"
                  aria-label="Editar"
                >
                  <Pencil className="size-4" />
                </button>
                <button
                  onClick={() => remove(t)}
                  className="flex size-9 items-center justify-center rounded-lg text-muted hover:bg-red-50 hover:text-red-600"
                  aria-label="Eliminar"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </CardContent>
          </Card>
        ))}

        {initialTeachers.length === 0 && (
          <Card>
            <CardContent className="p-6 text-center text-sm text-muted">
              Encara no hi ha cap professor/a donat d&apos;alta.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export interface AccessFormFields {
  accessMode: AccessMode;
  existingUserId: string;
  password: string;
  email: string;
}

export function AccessFields<T extends AccessFormFields>({
  form,
  setForm,
  linkableUsers,
  emailLabel,
}: {
  form: T;
  setForm: React.Dispatch<React.SetStateAction<T>>;
  linkableUsers: AdminUserRow[];
  emailLabel: string;
}) {
  return (
    <div className="rounded-xl border border-border p-3">
      <Field label="Accés a la web">
        <Select
          value={form.accessMode}
          onChange={(e) =>
            setForm((f) => ({ ...f, accessMode: e.target.value as AccessMode }))
          }
        >
          <option value="none">Sense accés per ara</option>
          <option value="new">Crear un compte nou</option>
          <option value="existing">Vincular a un usuari existent</option>
        </Select>
      </Field>

      {form.accessMode === "new" && (
        <div className="mt-3 flex flex-col gap-3">
          <Field label={emailLabel}>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
          </Field>
          <Field label="Contrasenya inicial (opcional)">
            <Input
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              placeholder="Es genera automàticament si ho deixes buit"
            />
          </Field>
        </div>
      )}

      {form.accessMode === "existing" && (
        <div className="mt-3">
          <Field label="Usuari existent">
            <Select
              value={form.existingUserId}
              onChange={(e) =>
                setForm((f) => ({ ...f, existingUserId: e.target.value }))
              }
            >
              <option value="">Selecciona&apos;n un...</option>
              {linkableUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.fullName} — {u.email}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      )}
    </div>
  );
}
