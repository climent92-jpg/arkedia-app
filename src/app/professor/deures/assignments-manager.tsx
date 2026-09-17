"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FileText, MessageSquareText, Pencil, Plus, ShieldCheck, Trash2, Video, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { VideoPlayer } from "@/components/video-player";
import { createAssignment, deleteAssignment, submitTeacherFeedback, updateAssignment } from "./actions";
import type { AssignmentSubmissionType, ProfessorAssignmentRow, ProfessorStudentRow } from "@/types";

const SUBMISSION_TYPE_OPTIONS: { value: AssignmentSubmissionType; label: string }[] = [
  { value: "none", label: "Només lectura / Indicacions" },
  { value: "video", label: "Vídeo" },
  { value: "pdf", label: "Document PDF" },
  { value: "text", label: "Resposta de text" },
];

const SUBMISSION_TYPE_META: Record<
  Exclude<AssignmentSubmissionType, "none">,
  { icon: typeof Video; label: string; noun: string }
> = {
  video: { icon: Video, label: "Vídeo", noun: "el vídeo" },
  pdf: { icon: FileText, label: "PDF", noun: "el document" },
  text: { icon: MessageSquareText, label: "Resposta", noun: "la resposta" },
};

function emptyForm(students: ProfessorStudentRow[]) {
  return {
    id: undefined as string | undefined,
    studentId: students[0]?.id ?? "",
    title: "",
    description: "",
    dueDate: "",
    submissionType: "none" as AssignmentSubmissionType,
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
      submissionType: a.submissionType,
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
      submissionType: form.submissionType,
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

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="submission-type">Tipus de resposta de l&apos;alumne</Label>
              <Select
                id="submission-type"
                value={form.submissionType}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    submissionType: e.target.value as AssignmentSubmissionType,
                  }))
                }
              >
                {SUBMISSION_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            </div>

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
                {a.submissionType !== "none" && (
                  <SubmissionBadge assignment={a} />
                )}
              </div>

              <SubmissionSection assignment={a} />
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

function hasSubmittedContent(a: ProfessorAssignmentRow) {
  return (
    !!a.submissionVideoUrl ||
    !!a.submissionPdfUrl ||
    (a.submissionType === "text" && !!a.submissionNote)
  );
}

function SubmissionBadge({ assignment: a }: { assignment: ProfessorAssignmentRow }) {
  if (a.submissionType === "none") return null;
  const meta = SUBMISSION_TYPE_META[a.submissionType];
  const Icon = meta.icon;
  const reviewed = !!a.teacherFeedback;
  const submitted = hasSubmittedContent(a) || reviewed;
  return (
    <Badge variant={submitted ? "success" : "outline"}>
      <Icon className="size-3" />
      {reviewed ? `${meta.label} revisat` : hasSubmittedContent(a) ? `${meta.label} rebut` : `${meta.label} pendent`}
    </Badge>
  );
}

function SubmissionSection({ assignment: a }: { assignment: ProfessorAssignmentRow }) {
  if (a.submissionType === "none") return null;

  const hasVideo = !!a.submissionVideoUrl;
  const hasPdf = !!a.submissionPdfUrl;
  const hasText = a.submissionType === "text" && !!a.submissionNote;
  const reviewed = !!a.teacherFeedback;
  const fileRemovedAfterReview =
    reviewed && (a.submissionType === "video" || a.submissionType === "pdf") && !hasVideo && !hasPdf;

  if (!hasVideo && !hasPdf && !hasText && !reviewed) return null;

  return (
    <div className="mt-3 flex flex-col gap-2">
      {hasVideo && (
        <VideoPlayer src={a.submissionVideoUrl!} title={`Resposta de ${a.studentFirstName}`} />
      )}
      {hasPdf && (
        <a
          href={a.submissionPdfUrl!}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-3 text-sm font-semibold text-arkedia-blue hover:bg-arkedia-blue-light/40"
        >
          <FileText className="size-4" />
          Obrir el PDF de {a.studentFirstName}
        </a>
      )}
      {hasText && (
        <div className="rounded-xl border border-border bg-surface p-3">
          <p className="whitespace-pre-wrap text-sm">{a.submissionNote}</p>
        </div>
      )}
      {!hasText && a.submissionNote && (hasVideo || hasPdf) && (
        <p className="text-sm text-muted italic">&quot;{a.submissionNote}&quot;</p>
      )}

      {fileRemovedAfterReview && (
        <div className="flex items-center gap-1.5 text-xs font-semibold text-arkedia-blue">
          <ShieldCheck className="size-3.5" />
          {SUBMISSION_TYPE_META[a.submissionType].label} revisat i eliminat (Estatut de
          privacitat i espai)
        </div>
      )}

      {!reviewed && (hasVideo || hasPdf || hasText) && <TeacherFeedbackForm assignment={a} />}

      {reviewed && (
        <div className="rounded-xl bg-arkedia-blue-light/40 p-3">
          <p className="text-sm font-semibold">Feedback enviat:</p>
          <p className="whitespace-pre-wrap text-sm text-muted">{a.teacherFeedback}</p>
        </div>
      )}
    </div>
  );
}

function TeacherFeedbackForm({ assignment }: { assignment: ProfessorAssignmentRow }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState(assignment.teacherFeedback ?? "");
  const [error, setError] = useState<string | null>(null);

  function send() {
    if (!feedback.trim()) {
      setError("Escriu un feedback abans d'enviar-lo.");
      return;
    }
    if (assignment.submissionType === "video" || assignment.submissionType === "pdf") {
      const noun = SUBMISSION_TYPE_META[assignment.submissionType].noun;
      if (
        !confirm(
          `En enviar el feedback, ${noun} de l'alumne s'eliminarà definitivament de l'emmagatzematge. Continuar?`
        )
      ) {
        return;
      }
    }
    setError(null);
    startTransition(async () => {
      const result = await submitTeacherFeedback(assignment.id, { feedback });
      if (!result.success) {
        setError(result.error ?? "No s'ha pogut enviar el feedback.");
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={`feedback-${assignment.id}`}>Feedback / Correcció</Label>
      <Textarea
        id={`feedback-${assignment.id}`}
        rows={2}
        placeholder="Escriu la correcció o el comentari per a l'alumne..."
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
      />
      <Button size="sm" className="self-start" onClick={send} disabled={pending}>
        {pending ? "Enviant..." : "Enviar feedback"}
      </Button>
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p>
      )}
    </div>
  );
}
