"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2, Video, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { VideoPlayer } from "@/components/video-player";
import { createAssignment, deleteAssignment, updateAssignment } from "./actions";
import type { ProfessorAssignmentRow, ProfessorStudentRow } from "@/types";

function emptyForm(students: ProfessorStudentRow[]) {
  return {
    id: undefined as string | undefined,
    studentId: students[0]?.id ?? "",
    title: "",
    description: "",
    dueDate: "",
    requiresVideo: false,
  };
}

export function AssignmentsManager({
  students,
  assignments,
}: {
  students: ProfessorStudentRow[];
  assignments: ProfessorAssignmentRow[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(() => emptyForm(students));

  function openCreate() {
    setForm(emptyForm(students));
    setError(null);
    setShowForm(true);
  }

  function openEdit(a: ProfessorAssignmentRow) {
    setForm({
      id: a.id,
      studentId: a.studentId,
      title: a.title,
      description: a.description ?? "",
      dueDate: a.dueDate ?? "",
      requiresVideo: a.requiresVideo,
    });
    setError(null);
    setShowForm(true);
  }

  function submit() {
    setError(null);
    const payload = {
      studentId: form.studentId,
      title: form.title,
      description: form.description,
      dueDate: form.dueDate,
      requiresVideo: form.requiresVideo,
    };
    startTransition(async () => {
      const result = form.id
        ? await updateAssignment(form.id, payload)
        : await createAssignment(payload);
      if (!result.success) {
        setError(result.error ?? "Alguna cosa ha fallat.");
        return;
      }
      setForm(emptyForm(students));
      setShowForm(false);
      router.refresh();
    });
  }

  function remove(a: ProfessorAssignmentRow) {
    if (!confirm(`Eliminar el deure "${a.title}"?`)) return;
    startTransition(async () => {
      const result = await deleteAssignment(a.id);
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
        <Button
          size="sm"
          onClick={() => (showForm ? setShowForm(false) : openCreate())}
          disabled={students.length === 0}
        >
          {showForm ? <X className="size-4" /> : <Plus className="size-4" />}
          {showForm ? "Tancar" : "Nou deure"}
        </Button>
      </div>

      {showForm && (
        <Card className="mb-5">
          <CardContent className="flex flex-col gap-3 p-4 sm:p-5">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="alumne">Alumne</Label>
              <Select
                id="alumne"
                value={form.studentId}
                onChange={(e) => setForm((f) => ({ ...f, studentId: e.target.value }))}
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.firstName} {s.lastName}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="titol">Títol</Label>
              <Input
                id="titol"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Ex: Escala de Sol Major"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="descripcio">Descripció</Label>
              <Textarea
                id="descripcio"
                rows={2}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Detalls de com practicar-ho..."
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="data-limit">Data límit (opcional)</Label>
              <Input
                id="data-limit"
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
              />
            </div>

            <label className="flex items-center gap-2 text-sm font-semibold">
              <input
                type="checkbox"
                checked={form.requiresVideo}
                onChange={(e) => setForm((f) => ({ ...f, requiresVideo: e.target.checked }))}
                className="size-4 accent-arkedia-blue"
              />
              Requereix vídeo de resposta
            </label>

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                {error}
              </p>
            )}

            <Button onClick={submit} disabled={pending} className="mt-1">
              {pending ? "Desant..." : form.id ? "Desar canvis" : "Assignar deure"}
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col gap-2.5">
        {assignments.map((a) => (
          <Card key={a.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2">
                <p className="font-bold">{a.title}</p>
                <div className="flex shrink-0 items-center gap-1">
                  <Badge variant={a.done ? "success" : "warning"}>
                    {a.done ? "Fet" : "Pendent"}
                  </Badge>
                  <button
                    onClick={() => openEdit(a)}
                    disabled={pending}
                    className="flex size-8 items-center justify-center rounded-lg text-muted hover:bg-black/[0.05] hover:text-arkedia-blue disabled:opacity-50"
                    aria-label="Editar"
                  >
                    <Pencil className="size-4" />
                  </button>
                  <button
                    onClick={() => remove(a)}
                    disabled={pending}
                    className="flex size-8 items-center justify-center rounded-lg text-muted hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                    aria-label="Eliminar"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
              {a.description && <p className="mt-1 text-sm text-muted">{a.description}</p>}
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Badge variant="outline">
                  {a.studentFirstName} {a.studentLastName}
                </Badge>
                {a.dueDate && (
                  <Badge variant="outline">
                    fins{" "}
                    {new Date(a.dueDate).toLocaleDateString("ca-ES", {
                      day: "numeric",
                      month: "short",
                    })}
                  </Badge>
                )}
                {a.requiresVideo && (
                  <Badge variant={a.submissionVideoUrl ? "success" : "outline"}>
                    <Video className="size-3" />
                    {a.submissionVideoUrl ? "Vídeo rebut" : "Vídeo pendent"}
                  </Badge>
                )}
              </div>

              {a.submissionVideoUrl && (
                <div className="mt-3 flex flex-col gap-2">
                  <VideoPlayer src={a.submissionVideoUrl} title={`Resposta de ${a.studentFirstName}`} />
                  {a.submissionNote && (
                    <p className="text-sm text-muted italic">&quot;{a.submissionNote}&quot;</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {assignments.length === 0 && (
          <Card>
            <CardContent className="p-6 text-center text-sm text-muted">
              Encara no has assignat cap deure.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
