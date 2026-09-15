"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Megaphone, Pencil, Plus, Send, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Field, FormError } from "../usuaris/users-manager";
import { createAnnouncement, deleteAnnouncement, updateAnnouncement } from "./actions";
import type { AdminAnnouncementRow } from "@/types";

const AUDIENCE_LABEL: Record<AdminAnnouncementRow["audience"], string> = {
  tothom: "Tothom",
  professors: "Professorat",
  families: "Famílies",
};

interface FormState {
  id?: string;
  title: string;
  body: string;
  audience: AdminAnnouncementRow["audience"];
}

function emptyForm(): FormState {
  return { title: "", body: "", audience: "tothom" };
}

export function AnnouncementsManager({
  initialAnnouncements,
}: {
  initialAnnouncements: AdminAnnouncementRow[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [error, setError] = useState<string | null>(null);

  function openCreate() {
    setForm(emptyForm());
    setError(null);
    setOpen(true);
  }

  function openEdit(a: AdminAnnouncementRow) {
    setForm({ id: a.id, title: a.title, body: a.body, audience: a.audience });
    setError(null);
    setOpen(true);
  }

  function submit() {
    setError(null);
    const payload = { title: form.title, body: form.body, audience: form.audience };

    startTransition(async () => {
      const result = form.id
        ? await updateAnnouncement(form.id, payload)
        : await createAnnouncement(payload);

      if (!result.success) {
        setError(result.error ?? "Alguna cosa ha fallat.");
        return;
      }
      setOpen(false);
      router.refresh();
    });
  }

  function remove(a: AdminAnnouncementRow) {
    if (!confirm(`Eliminar l'avís "${a.title}"?`)) return;
    startTransition(async () => {
      const result = await deleteAnnouncement(a.id);
      if (!result.success) {
        alert(result.error ?? "No s'ha pogut eliminar.");
        return;
      }
      router.refresh();
    });
  }

  return (
    <div>
      <div className="mb-5 flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={openCreate}>
              <Plus className="size-4" />
              Nou avís
            </Button>
          </DialogTrigger>
          <DialogContent title={form.id ? "Editar avís" : "Nou avís"}>
            <div className="flex flex-col gap-3">
              <Field label="Títol">
                <Input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Ex: Audició de Nadal"
                />
              </Field>
              <Field label="Missatge">
                <Textarea
                  rows={4}
                  value={form.body}
                  onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                  placeholder="Escriu el comunicat..."
                />
              </Field>
              <Field label="Destinataris">
                <Select
                  value={form.audience}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      audience: e.target.value as AdminAnnouncementRow["audience"],
                    }))
                  }
                >
                  <option value="tothom">Tothom</option>
                  <option value="professors">Només professorat</option>
                  <option value="families">Només famílies</option>
                </Select>
              </Field>

              {error && <FormError>{error}</FormError>}

              <Button onClick={submit} disabled={pending} className="mt-1">
                <Send className="size-4" />
                {pending ? "Desant..." : form.id ? "Desar canvis" : "Publicar avís"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col gap-3">
        {initialAnnouncements.map((a) => (
          <Card key={a.id}>
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-arkedia-blue-light text-arkedia-blue">
                    <Megaphone className="size-4" />
                  </span>
                  <div>
                    <p className="font-bold">{a.title}</p>
                    <p className="text-xs text-muted">
                      {a.authorName ?? "Direcció ARK#ÈDIA"} ·{" "}
                      {new Date(a.createdAt).toLocaleDateString("ca-ES", {
                        day: "numeric",
                        month: "long",
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Badge variant="outline">{AUDIENCE_LABEL[a.audience]}</Badge>
                  <button
                    onClick={() => openEdit(a)}
                    className="flex size-8 items-center justify-center rounded-lg text-muted hover:bg-black/[0.05] hover:text-arkedia-blue"
                    aria-label="Editar"
                  >
                    <Pencil className="size-3.5" />
                  </button>
                  <button
                    onClick={() => remove(a)}
                    className="flex size-8 items-center justify-center rounded-lg text-muted hover:bg-red-50 hover:text-red-600"
                    aria-label="Eliminar"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
              <p className="mt-3 text-sm text-foreground/90">{a.body}</p>
            </CardContent>
          </Card>
        ))}

        {initialAnnouncements.length === 0 && (
          <Card>
            <CardContent className="p-6 text-center text-sm text-muted">
              Encara no hi ha cap avís publicat.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
