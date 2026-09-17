"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarClock,
  CheckCircle2,
  Circle,
  FileText,
  MessageSquareText,
  ShieldCheck,
  UploadCloud,
  Video,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/input";
import { VideoPlayer } from "@/components/video-player";
import { compressVideo } from "@/lib/compress-video";
import { uploadToStorage } from "@/lib/storage-upload";
import { cn } from "@/lib/utils";
import {
  submitAssignmentPdf,
  submitAssignmentText,
  submitAssignmentVideo,
  toggleAssignmentDone,
} from "./actions";
import type { AssignmentSubmissionType, StudentAssignmentRow } from "@/types";

const SUBMISSION_TYPE_META: Record<
  Exclude<AssignmentSubmissionType, "none">,
  { icon: typeof Video; label: string }
> = {
  video: { icon: Video, label: "Vídeo" },
  pdf: { icon: FileText, label: "PDF" },
  text: { icon: MessageSquareText, label: "Resposta" },
};

function hasSubmittedContent(a: StudentAssignmentRow) {
  if (a.submissionType === "video") return !!a.submissionVideoUrl;
  if (a.submissionType === "pdf") return !!a.submissionPdfUrl;
  if (a.submissionType === "text") return !!a.submissionNote;
  return false;
}

export function DeuresList({
  assignments,
  studentId,
}: {
  assignments: StudentAssignmentRow[];
  studentId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const pendents = assignments.filter((a) => !a.done);
  const fets = assignments.filter((a) => a.done);

  function toggle(a: StudentAssignmentRow) {
    startTransition(async () => {
      const result = await toggleAssignmentDone(a.id, !a.done);
      if (!result.success) {
        alert(result.error ?? "No s'ha pogut desar.");
        return;
      }
      router.refresh();
    });
  }

  return (
    <div>
      <Section title={`Pendents (${pendents.length})`}>
        {pendents.map((a) => (
          <AssignmentCard
            key={a.id}
            assignment={a}
            studentId={studentId}
            pending={pending}
            onToggle={() => toggle(a)}
          />
        ))}
        {pendents.length === 0 && <EmptyRow text="Cap deure pendent, molt bé!" />}
      </Section>

      <Section title={`Fets (${fets.length})`}>
        {fets.map((a) => (
          <AssignmentCard
            key={a.id}
            assignment={a}
            studentId={studentId}
            pending={pending}
            onToggle={() => toggle(a)}
          />
        ))}
        {fets.length === 0 && <EmptyRow text="Encara no n'hi ha cap." />}
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-muted">{title}</h2>
      <div className="flex flex-col gap-2.5">{children}</div>
    </div>
  );
}

function EmptyRow({ text }: { text: string }) {
  return (
    <Card>
      <CardContent className="p-4 text-sm text-muted">{text}</CardContent>
    </Card>
  );
}

function AssignmentCard({
  assignment,
  studentId,
  pending,
  onToggle,
}: {
  assignment: StudentAssignmentRow;
  studentId: string;
  pending: boolean;
  onToggle: () => void;
}) {
  const { title, description, teacherFirstName, dueDate, done, submissionType } = assignment;
  const meta = submissionType !== "none" ? SUBMISSION_TYPE_META[submissionType] : null;
  const reviewed = !!assignment.teacherFeedback;
  const submitted = hasSubmittedContent(assignment);

  return (
    <Card className={cn(done && "bg-arkedia-blue-light/40")}>
      <CardContent className="flex items-start gap-3 p-4">
        <button
          onClick={onToggle}
          disabled={pending}
          aria-label={done ? "Marcar com a pendent" : "Marcar com a fet"}
          className="mt-0.5 shrink-0 text-arkedia-blue disabled:opacity-50"
        >
          {done ? (
            <CheckCircle2 className="size-6" />
          ) : (
            <Circle className="size-6 text-border" />
          )}
        </button>
        <div className="min-w-0 flex-1">
          <p className={cn("font-bold", done && "text-muted line-through")}>{title}</p>
          {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {teacherFirstName && <Badge variant="outline">{teacherFirstName}</Badge>}
            {dueDate && (
              <Badge variant="warning">
                <CalendarClock className="size-3" />
                fins{" "}
                {new Date(dueDate).toLocaleDateString("ca-ES", {
                  day: "numeric",
                  month: "short",
                })}
              </Badge>
            )}
            {meta && (
              <Badge variant={reviewed || submitted ? "success" : "outline"}>
                <meta.icon className="size-3" />
                {reviewed
                  ? `${meta.label} revisat`
                  : submitted
                    ? `${meta.label} enviat`
                    : `${meta.label} pendent`}
              </Badge>
            )}
          </div>

          {submissionType !== "none" && (
            <AssignmentSubmission assignment={assignment} studentId={studentId} />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function AssignmentSubmission({
  assignment,
  studentId,
}: {
  assignment: StudentAssignmentRow;
  studentId: string;
}) {
  if (assignment.submissionType === "video") {
    return <VideoSubmission assignment={assignment} studentId={studentId} />;
  }
  if (assignment.submissionType === "pdf") {
    return <PdfSubmission assignment={assignment} studentId={studentId} />;
  }
  if (assignment.submissionType === "text") {
    return <TextSubmission assignment={assignment} />;
  }
  return null;
}

function ReviewedAndRemovedNotice({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-xs font-semibold text-arkedia-blue">
      <ShieldCheck className="size-3.5" />
      {label} revisat i eliminat (Estatut de privacitat i espai)
    </div>
  );
}

function VideoSubmission({
  assignment,
  studentId,
}: {
  assignment: StudentAssignmentRow;
  studentId: string;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState(assignment.submissionNote ?? "");
  const [error, setError] = useState<string | null>(null);
  const [replacing, setReplacing] = useState(false);
  const [compressProgress, setCompressProgress] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  function handleFile(files: FileList | null) {
    const f = files?.[0];
    if (!f) return;
    if (!f.type.startsWith("video/")) {
      setError("El fitxer ha de ser un vídeo.");
      return;
    }
    setFile(f);
    setError(null);
  }

  function handleDragOver(e: React.DragEvent<HTMLButtonElement>) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent<HTMLButtonElement>) {
    e.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent<HTMLButtonElement>) {
    e.preventDefault();
    setIsDragging(false);
    handleFile(e.dataTransfer.files);
  }

  function submit() {
    if (!file) {
      setError("Selecciona un vídeo.");
      return;
    }
    setError(null);

    startTransition(async () => {
      try {
        setCompressProgress(0);
        const toUpload = await compressVideo(file, {
          onProgress: (p) => setCompressProgress(p),
        });
        setCompressProgress(null);

        // Si toUpload.type ja ve informat (sempre és el cas quan
        // compressVideo() ha reencodat a WebM, o quan el navegador sap
        // detectar el vídeo original), uploadToStorage el fa servir tal
        // qual; aquest fallback explícit només actua quan arriba buit (per
        // exemple, alguns navegadors mòbils en gravar amb la càmera).
        const fallbackContentType = toUpload.name.toLowerCase().endsWith(".webm")
          ? "video/webm"
          : "video/mp4";
        const uploaded = await uploadToStorage(
          "submitted_videos",
          studentId,
          toUpload,
          fallbackContentType
        );
        if (uploaded.error || !uploaded.path) {
          const message = uploaded.error ?? "No s'ha pogut pujar el vídeo.";
          console.error("VideoSubmission: pujada a Storage ha fallat", uploaded.error);
          setError(message);
          alert(`Error en pujar el vídeo:\n${message}`);
          return;
        }

        const result = await submitAssignmentVideo(assignment.id, {
          storagePath: uploaded.path,
          note,
        });

        if (!result.success) {
          const message = result.error ?? "No s'ha pogut enviar el vídeo.";
          console.error("VideoSubmission: submitAssignmentVideo ha fallat", result.error);
          setError(message);
          alert(`Error en desar el vídeo:\n${message}`);
          return;
        }

        setFile(null);
        setReplacing(false);
        router.refresh();
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Alguna cosa ha fallat en enviar el vídeo. Torna-ho a provar.";
        console.error("VideoSubmission: error inesperat", err);
        setError(message);
        alert(`Error inesperat en pujar el vídeo:\n${message}`);
      } finally {
        setCompressProgress(null);
      }
    });
  }

  if (assignment.submissionVideoUrl && !replacing) {
    return (
      <div className="mt-3 flex flex-col gap-2">
        <VideoPlayer src={assignment.submissionVideoUrl} title={`Resposta a ${assignment.title}`} />
        {assignment.submissionNote && (
          <p className="text-sm text-muted italic">&quot;{assignment.submissionNote}&quot;</p>
        )}
        {assignment.teacherFeedback && <FeedbackBox feedback={assignment.teacherFeedback} />}
        <Button variant="outline" size="sm" className="self-start" onClick={() => setReplacing(true)}>
          Substituir el vídeo
        </Button>
      </div>
    );
  }

  // El vídeo s'ha enviat, el professor ja l'ha revisat i comentat, i s'ha
  // eliminat de Storage (vegeu submitTeacherFeedback): no en queda cap
  // rastre, però l'alumne ha de poder veure el feedback rebut.
  if (!assignment.submissionVideoUrl && assignment.teacherFeedback && !replacing) {
    return (
      <div className="mt-3 flex flex-col gap-2">
        <ReviewedAndRemovedNotice label="Vídeo" />
        <FeedbackBox feedback={assignment.teacherFeedback} />
        <Button variant="outline" size="sm" className="self-start" onClick={() => setReplacing(true)}>
          Enviar un altre vídeo
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-3 flex flex-col gap-2">
      {!file && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "flex items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-4 text-sm font-semibold transition-colors",
            isDragging
              ? "border-arkedia-blue bg-arkedia-blue-light/60 text-arkedia-blue"
              : "border-border bg-surface text-arkedia-blue hover:border-arkedia-blue hover:bg-arkedia-blue-light/40"
          )}
        >
          <UploadCloud className="size-4" />
          {isDragging ? "Deixa anar el vídeo aquí" : "Pujar el vídeo de resposta (o arrossega'l aquí)"}
          <input
            ref={inputRef}
            type="file"
            accept="video/*"
            capture="environment"
            className="hidden"
            onChange={(e) => handleFile(e.target.files)}
          />
        </button>
      )}

      {file && (
        <>
          <p className="text-sm text-muted">{file.name}</p>
          <Textarea
            rows={2}
            placeholder="Nota per al professor/a (opcional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          {compressProgress !== null && (
            <p className="text-sm font-semibold text-arkedia-blue">
              Comprimint vídeo... {compressProgress}%
            </p>
          )}
          <div className="flex gap-2">
            <Button size="sm" onClick={submit} disabled={pending}>
              {pending
                ? compressProgress !== null
                  ? "Comprimint..."
                  : "Enviant..."
                : "Enviar vídeo"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setFile(null);
                setReplacing(false);
              }}
              disabled={pending}
            >
              Cancel·lar
            </Button>
          </div>
        </>
      )}

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p>
      )}
    </div>
  );
}

function PdfSubmission({
  assignment,
  studentId,
}: {
  assignment: StudentAssignmentRow;
  studentId: string;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState(assignment.submissionNote ?? "");
  const [error, setError] = useState<string | null>(null);
  const [replacing, setReplacing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  function handleFile(files: FileList | null) {
    const f = files?.[0];
    if (!f) return;
    if (f.type !== "application/pdf" && !f.name.toLowerCase().endsWith(".pdf")) {
      setError("El fitxer ha de ser un PDF.");
      return;
    }
    setFile(f);
    setError(null);
  }

  function handleDragOver(e: React.DragEvent<HTMLButtonElement>) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent<HTMLButtonElement>) {
    e.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent<HTMLButtonElement>) {
    e.preventDefault();
    setIsDragging(false);
    handleFile(e.dataTransfer.files);
  }

  function submit() {
    if (!file) {
      setError("Selecciona un document PDF.");
      return;
    }
    setError(null);

    startTransition(async () => {
      try {
        const uploaded = await uploadToStorage(
          "submitted_documents",
          studentId,
          file,
          "application/pdf"
        );
        if (uploaded.error || !uploaded.path) {
          const message = uploaded.error ?? "No s'ha pogut pujar el document.";
          console.error("PdfSubmission: pujada a Storage ha fallat", uploaded.error);
          setError(message);
          alert(`Error en pujar el document:\n${message}`);
          return;
        }

        const result = await submitAssignmentPdf(assignment.id, {
          storagePath: uploaded.path,
          note,
        });

        if (!result.success) {
          const message = result.error ?? "No s'ha pogut enviar el document.";
          console.error("PdfSubmission: submitAssignmentPdf ha fallat", result.error);
          setError(message);
          alert(`Error en desar el document:\n${message}`);
          return;
        }

        setFile(null);
        setReplacing(false);
        router.refresh();
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Alguna cosa ha fallat en enviar el document. Torna-ho a provar.";
        console.error("PdfSubmission: error inesperat", err);
        setError(message);
        alert(`Error inesperat en pujar el document:\n${message}`);
      }
    });
  }

  if (assignment.submissionPdfUrl && !replacing) {
    return (
      <div className="mt-3 flex flex-col gap-2">
        <a
          href={assignment.submissionPdfUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-3 text-sm font-semibold text-arkedia-blue hover:bg-arkedia-blue-light/40"
        >
          <FileText className="size-4" />
          Obrir el document enviat
        </a>
        {assignment.submissionNote && (
          <p className="text-sm text-muted italic">&quot;{assignment.submissionNote}&quot;</p>
        )}
        {assignment.teacherFeedback && <FeedbackBox feedback={assignment.teacherFeedback} />}
        <Button variant="outline" size="sm" className="self-start" onClick={() => setReplacing(true)}>
          Substituir el document
        </Button>
      </div>
    );
  }

  if (!assignment.submissionPdfUrl && assignment.teacherFeedback && !replacing) {
    return (
      <div className="mt-3 flex flex-col gap-2">
        <ReviewedAndRemovedNotice label="Document" />
        <FeedbackBox feedback={assignment.teacherFeedback} />
        <Button variant="outline" size="sm" className="self-start" onClick={() => setReplacing(true)}>
          Enviar un altre document
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-3 flex flex-col gap-2">
      {!file && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "flex items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-4 text-sm font-semibold transition-colors",
            isDragging
              ? "border-arkedia-blue bg-arkedia-blue-light/60 text-arkedia-blue"
              : "border-border bg-surface text-arkedia-blue hover:border-arkedia-blue hover:bg-arkedia-blue-light/40"
          )}
        >
          <UploadCloud className="size-4" />
          {isDragging ? "Deixa anar el PDF aquí" : "Pujar el document PDF (o arrossega'l aquí)"}
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={(e) => handleFile(e.target.files)}
          />
        </button>
      )}

      {file && (
        <>
          <p className="text-sm text-muted">{file.name}</p>
          <Textarea
            rows={2}
            placeholder="Nota per al professor/a (opcional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={submit} disabled={pending}>
              {pending ? "Enviant..." : "Enviar document"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setFile(null);
                setReplacing(false);
              }}
              disabled={pending}
            >
              Cancel·lar
            </Button>
          </div>
        </>
      )}

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p>
      )}
    </div>
  );
}

function TextSubmission({ assignment }: { assignment: StudentAssignmentRow }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(!assignment.submissionNote);
  const [text, setText] = useState(assignment.submissionNote ?? "");
  const [error, setError] = useState<string | null>(null);

  function submit() {
    if (!text.trim()) {
      setError("Escriu una resposta abans d'enviar-la.");
      return;
    }
    setError(null);

    startTransition(async () => {
      const result = await submitAssignmentText(assignment.id, { text });
      if (!result.success) {
        const message = result.error ?? "No s'ha pogut enviar la resposta.";
        setError(message);
        alert(`Error en desar la resposta:\n${message}`);
        return;
      }
      setEditing(false);
      router.refresh();
    });
  }

  if (!editing && assignment.submissionNote) {
    return (
      <div className="mt-3 flex flex-col gap-2">
        <div className="rounded-xl border border-border bg-surface p-3">
          <p className="whitespace-pre-wrap text-sm">{assignment.submissionNote}</p>
        </div>
        {assignment.teacherFeedback && <FeedbackBox feedback={assignment.teacherFeedback} />}
        <Button variant="outline" size="sm" className="self-start" onClick={() => setEditing(true)}>
          Editar la resposta
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-3 flex flex-col gap-2">
      <Textarea
        rows={4}
        placeholder="Escriu aquí la teva resposta..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="flex gap-2">
        <Button size="sm" onClick={submit} disabled={pending}>
          {pending ? "Enviant..." : "Enviar resposta"}
        </Button>
        {assignment.submissionNote && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setText(assignment.submissionNote ?? "");
              setEditing(false);
            }}
            disabled={pending}
          >
            Cancel·lar
          </Button>
        )}
      </div>
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p>
      )}
    </div>
  );
}

function FeedbackBox({ feedback }: { feedback: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl bg-arkedia-blue-light/40 p-3">
      <p className="text-sm font-semibold">Feedback del professor/a:</p>
      <p className="text-sm text-muted whitespace-pre-wrap">{feedback}</p>
    </div>
  );
}
