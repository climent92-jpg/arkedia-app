"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Trash2, UploadCloud, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { submitVideo } from "@/app/alumne/material/actions";
import { uploadToStorage } from "@/lib/storage-upload";
import type { MyStudentProfile, StudentTeacherRow } from "@/types";

export function UploadVideo({
  student,
  teachers,
}: {
  student: MyStudentProfile;
  teachers: StudentTeacherRow[];
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [teacherId, setTeacherId] = useState(teachers[0]?.id ?? "");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  function handleFiles(files: FileList | null) {
    const f = files?.[0];
    if (!f) return;
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    setSent(false);
    setError(null);
  }

  function reset() {
    setFile(null);
    setPreviewUrl(null);
    setTitle("");
    setNote("");
    setSent(false);
    setError(null);
  }

  function submit() {
    if (!file || !title.trim() || !teacherId) {
      setError("Cal un títol i triar a quin professor/a l'envies.");
      return;
    }
    setError(null);

    startTransition(async () => {
      const uploaded = await uploadToStorage("submitted-videos", student.id, file);
      if (uploaded.error || !uploaded.path) {
        setError(uploaded.error ?? "No s'ha pogut pujar el vídeo.");
        return;
      }

      const result = await submitVideo({
        title,
        note,
        storagePath: uploaded.path,
        teacherId,
      });

      if (!result.success) {
        setError(result.error ?? "No s'ha pogut enviar el vídeo.");
        return;
      }

      setSent(true);
      router.refresh();
    });
  }

  if (teachers.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-sm text-muted">
          Encara no tens cap professor/a assignat, així que no pots enviar
          vídeos. Demana a l&apos;administració que et vinculi un professor/a.
        </CardContent>
      </Card>
    );
  }

  if (sent) {
    return (
      <Card className="border-emerald-200 bg-emerald-50">
        <CardContent className="flex flex-col items-center gap-2 p-8 text-center">
          <CheckCircle2 className="size-10 text-emerald-600" />
          <p className="font-bold text-emerald-800">Vídeo enviat al professor/a!</p>
          <p className="text-sm text-emerald-700">
            Rebràs una notificació quan el revisi.
          </p>
          <Button variant="outline" size="sm" className="mt-2" onClick={reset}>
            Pujar-ne un altre
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {!file && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handleFiles(e.dataTransfer.files);
          }}
          className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-surface px-6 py-10 text-center transition-colors hover:border-arkedia-blue hover:bg-arkedia-blue-light/40"
        >
          <UploadCloud className="size-9 text-arkedia-blue" />
          <p className="font-semibold">Toca per gravar o pujar un vídeo</p>
          <p className="text-xs text-muted">MP4, MOV — fins a 200MB</p>
          <input
            ref={inputRef}
            type="file"
            accept="video/*"
            capture="environment"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </button>
      )}

      {file && previewUrl && (
        <Card>
          <CardContent className="flex flex-col gap-3 p-4">
            <video
              src={previewUrl}
              controls
              className="aspect-video w-full rounded-xl bg-black"
            />
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="flex min-w-0 items-center gap-2 truncate text-muted">
                <Video className="size-4 shrink-0" />
                <span className="truncate">{file.name}</span>
              </span>
              <button
                onClick={reset}
                className="shrink-0 text-red-600"
                aria-label="Eliminar"
              >
                <Trash2 className="size-4" />
              </button>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="titol-video">Títol</Label>
              <Input
                id="titol-video"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Escala de Do Major - intent 3"
              />
            </div>

            {teachers.length > 1 && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="professor-video">Per a quin professor/a?</Label>
                <Select
                  id="professor-video"
                  value={teacherId}
                  onChange={(e) => setTeacherId(e.target.value)}
                >
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.firstName} {t.lastName}
                    </option>
                  ))}
                </Select>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="nota-video">Nota per al professor/a (opcional)</Label>
              <Textarea
                id="nota-video"
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ex: M'he trabat una mica al final..."
              />
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                {error}
              </p>
            )}

            <Button onClick={submit} disabled={pending} className="mt-1">
              {pending ? "Enviant..." : "Enviar al professor/a"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
