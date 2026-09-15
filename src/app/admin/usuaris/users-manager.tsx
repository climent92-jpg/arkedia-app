"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, KeyRound, Mail, Pencil, Plus, Trash2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Input, Label, Select } from "@/components/ui/input";
import { createUser, deleteUser, updateUser } from "./actions";
import type { AdminUserRow, UserRole } from "@/types";

const ROLE_LABEL: Record<UserRole, string> = {
  admin: "Administració",
  professor: "Professor/a",
  familia: "Família",
};

interface FormState {
  id?: string;
  fullName: string;
  email: string;
  role: UserRole;
  phone: string;
  password: string;
}

const EMPTY_FORM: FormState = {
  fullName: "",
  email: "",
  role: "familia",
  phone: "",
  password: "",
};

export function UsersManager({ initialUsers }: { initialUsers: AdminUserRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [tempPassword, setTempPassword] = useState<{ email: string; password: string } | null>(
    null
  );

  function openCreate() {
    setForm(EMPTY_FORM);
    setError(null);
    setOpen(true);
  }

  function openEdit(u: AdminUserRow) {
    setForm({
      id: u.id,
      fullName: u.fullName,
      email: u.email,
      role: u.role,
      phone: u.phone ?? "",
      password: "",
    });
    setError(null);
    setOpen(true);
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      const result = form.id
        ? await updateUser(form.id, {
            fullName: form.fullName,
            role: form.role,
            phone: form.phone,
          })
        : await createUser({
            fullName: form.fullName,
            email: form.email,
            role: form.role,
            phone: form.phone,
            password: form.password || undefined,
          });

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

  function remove(u: AdminUserRow) {
    if (!confirm(`Eliminar l'usuari ${u.fullName}? També s'eliminarà el seu accés.`)) return;
    startTransition(async () => {
      const result = await deleteUser(u.id);
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
              Nou usuari
            </Button>
          </DialogTrigger>
          <DialogContent
            title={form.id ? "Editar usuari" : "Nou usuari"}
            description={
              form.id
                ? "Canvia el nom, el rol o el telèfon."
                : "Es crearà un compte real a Supabase Auth."
            }
          >
            <div className="flex flex-col gap-3">
              <Field label="Nom complet">
                <Input
                  value={form.fullName}
                  onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                  placeholder="Ex: Anna Ferrer"
                />
              </Field>
              <Field label="Correu electrònic">
                <Input
                  type="email"
                  value={form.email}
                  disabled={!!form.id}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="nom@exemple.com"
                />
              </Field>
              <Field label="Rol">
                <Select
                  value={form.role}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, role: e.target.value as UserRole }))
                  }
                >
                  <option value="familia">Família</option>
                  <option value="professor">Professor/a</option>
                  <option value="admin">Administració</option>
                </Select>
              </Field>
              <Field label="Telèfon (opcional)">
                <Input
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="600111222"
                />
              </Field>
              {!form.id && (
                <Field label="Contrasenya inicial (opcional)">
                  <Input
                    value={form.password}
                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                    placeholder="Es genera automàticament si ho deixes buit"
                  />
                </Field>
              )}

              {error && <FormError>{error}</FormError>}

              <Button onClick={submit} disabled={pending} className="mt-1">
                {pending ? "Desant..." : form.id ? "Desar canvis" : "Crear usuari"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col gap-2">
        {initialUsers.map((u) => (
          <Card key={u.id}>
            <CardContent className="flex flex-wrap items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold">{u.fullName}</p>
                  <Badge variant={u.role === "admin" ? "default" : "outline"}>
                    {ROLE_LABEL[u.role]}
                  </Badge>
                </div>
                <p className="flex items-center gap-1.5 text-xs text-muted">
                  <Mail className="size-3" />
                  {u.email}
                  {u.phone && <span className="ml-1">· {u.phone}</span>}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  onClick={() => openEdit(u)}
                  className="flex size-9 items-center justify-center rounded-lg text-muted hover:bg-black/[0.05] hover:text-arkedia-blue"
                  aria-label="Editar"
                >
                  <Pencil className="size-4" />
                </button>
                <button
                  onClick={() => remove(u)}
                  className="flex size-9 items-center justify-center rounded-lg text-muted hover:bg-red-50 hover:text-red-600"
                  aria-label="Eliminar"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </CardContent>
          </Card>
        ))}

        {initialUsers.length === 0 && (
          <Card>
            <CardContent className="p-6 text-center text-sm text-muted">
              Encara no hi ha cap usuari. Crea&apos;n un amb el botó de dalt.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

export function FormError({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
      {children}
    </p>
  );
}

export function TempPasswordBanner({
  email,
  password,
  onClose,
}: {
  email: string;
  password: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard not available */
    }
  }

  return (
    <Card className="mb-4 border-emerald-200 bg-emerald-50">
      <CardContent className="flex items-start gap-3 p-4">
        <KeyRound className="size-5 shrink-0 text-emerald-700" />
        <div className="min-w-0 flex-1">
          <p className="font-bold text-emerald-900">Compte creat per a {email}</p>
          <p className="text-sm text-emerald-800">
            Comparteix-li aquesta contrasenya inicial (només es mostra ara):
          </p>
          <div className="mt-2 flex items-center gap-2">
            <code className="rounded-lg bg-white px-3 py-1.5 text-sm font-semibold text-emerald-900">
              {password}
            </code>
            <button
              onClick={copy}
              className="flex size-8 items-center justify-center rounded-lg text-emerald-700 hover:bg-emerald-100"
              aria-label="Copiar"
            >
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            </button>
          </div>
        </div>
        <button
          onClick={onClose}
          className="flex size-7 shrink-0 items-center justify-center rounded-lg text-emerald-700 hover:bg-emerald-100"
          aria-label="Tancar"
        >
          <X className="size-4" />
        </button>
      </CardContent>
    </Card>
  );
}
