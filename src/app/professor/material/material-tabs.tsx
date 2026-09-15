"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, FileText, Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VideoPlayer } from "@/components/video-player";
import { uploadToStorage } from "@/lib/storage-upload";
import { createMaterial, updateSubmittedVideoReview } from "./actions";
import type { ProfessorMaterialRow, ProfessorStudentRow, ProfessorSubmittedVideoRow } from "@/types";

export function MaterialTabs({
  teacherId,
  students,
  initialMaterials,
  initialSubmittedVideos,
}: {
  teacherId: string;
  students: ProfessorStudentRow[];
  initialMaterials: ProfessorMaterialRow[];
  initialSubmittedVideos: ProfessorSubmittedVideoRow[];
}) {
  return (
    <Tabs defaultValue="penjat">
      <TabsList>
        <TabsTrigger value="penjat">Material penjat</TabsTrigger>
        <TabsTrigger value="revisar">
          Vídeos alumnes
          {initialSubmittedVideos.some((v) => !v.reviewed) && (
            <span className="ml-1 inline-block size-1.5 rounded-full bg-arkedia-accent" />
          )}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="penjat" className="flex flex-col gap-2.5">
        <UploadMaterialForm teacherId={teacherId} students={students} />

        {initialMaterials.map((m) => (
          <Card key={m.id}>
            <CardContent className="flex items-center gap-3 p-4">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-arkedia-blue-light text-arkedia-blue">
                <FileText className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{m.title}</p>
                <p className="truncate text-sm text-muted">
                  {m.studentName ?? "Tots els meus alumnes"}
                </p>
              </div>
              <Badge variant="outline">{m.type}</Badge>
              {m.url && (
                <Button asChild variant="outline" size="sm">
                  <a href={m.url} target="_blank" rel="noreferrer">
                    Obrir
                  </a>
                </Button>
              )}
            </CardContent>
          </Card>
        ))}

        {initialMaterials.length === 0 && (
          <Card>
            <CardContent className="p-6 text-center text-sm text-muted">
              Encara no has penjat cap material.
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="revisar" className="flex flex-col gap-4">
        {initialSubmittedVideos.map((v) => (
          <SubmittedVideoCard key={v.id} video={v} />
        ))}

        {initialSubmittedVideos.length === 0 && (
          <Card>
            <CardContent className="p-6 text-center text-sm text-muted">
              Cap alumne ha enviat vídeos encara.
            </CardContent>
          </Card>
        )}
      </TabsContent>
    </Tabs>
  );
}

function SubmittedVideoCard({ video }: { video: ProfessorSubmittedVideoRow }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [comment, setComment] = useState(video.teacherComment ?? "");
  const [error, setError] = useState<string | null>(null);

  function toggleReviewed() {
    setError(null);
    startTransition(async () => {
      const result = await updateSubmittedVideoReview(video.id, {
        reviewed: !video.reviewed,
        teacherComment: comment,
      });
      if (!result.success) {
        setError(result.error ?? "No s'ha pogut desar.");
        return;
      }
      router.refresh();
    });
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-4">
        <VideoPlayer src={video.url ?? "#"} title={video.title} />
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-bold">{video.title}</p>
            <p className="text-sm text-muted">{video.studentName}</p>
            {video.studentNote && (
              <p className="mt-1 text-sm text-muted italic">&quot;{video.studentNote}&quot;</p>
            )}
          </div>
          <Badge variant={video.reviewed ? "success" : "warning"}>
            {video.reviewed ? "Revisat" : "Pendent"}
          </Badge>
        </div>
        <Textarea
          rows={2}
          placeholder="Escriu un comentari o valoració..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
            {error}
          </p>
        )}
        <Button
          variant={video.reviewed ? "outline" : "default"}
          size="sm"
          onClick={toggleReviewed}
          disabled={pending}
          className="self-start"
        >
          <CheckCircle2 className="size-4" />
          {pending
            ? "Desant..."
            : video.reviewed
              ? "Marcar com a pendent"
              : "Marcar com a revisat"}
        </Button>
      </CardContent>
    </Card>
  );
}

const emptyForm = {
  target: "student" as "student" | "all",
  studentId: "",
  type: "partitura" as "partitura" | "video" | "audio",
  title: "",
  description: "",
};

function UploadMaterialForm({
  teacherId,
  students,
}: {
  teacherId: string;
  students: ProfessorStudentRow[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    ...emptyForm,
    studentId: students[0]?.id ?? "",
  });

  function submit() {
    setError(null);

    if (!file) {
      setError("Selecciona un fitxer.");
      return;
    }
    if (!form.title.trim()) {
      setError("Escriu un títol.");
      return;
    }
    if (form.target === "student" && !form.studentId) {
      setError("Selecciona un alumne.");
      return;
    }

    startTransition(async () => {
      const upload = await uploadToStorage("materials", teacherId, file);
      if (!upload.path) {
        setError(upload.error ?? "No s'ha pogut pujar el fitxer.");
        return;
      }

      const result = await createMaterial({
        target: form.target,
        studentId: form.target === "student" ? form.studentId : undefined,
        type: form.type,
        title: form.title,
        description: form.description,
        storagePath: upload.path,
      });
      if (!result.success) {
        setError(result.error ?? "Alguna cosa ha fallat.");
        return;
      }

      setForm({ ...emptyForm, studentId: students[0]?.id ?? "" });
      setFile(null);
      setShowForm(false);
      router.refresh();
    });
  }

  return (
    <>
      <div className="mb-1 flex justify-end">
        <Button size="sm" onClick={() => setShowForm((v) => !v)}>
          {showForm ? <X className="size-4" /> : <Plus className="size-4" />}
          {showForm ? "Tancar" : "Penjar material"}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="flex flex-col gap-3 p-4 sm:p-5">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="destinatari">Destinatari</Label>
              <Select
                id="destinatari"
                value={form.target}
                onChange={(e) =>
                  setForm((f) => ({ ...f, target: e.target.value as "student" | "all" }))
                }
              >
                <option value="student">Un alumne concret</option>
                <option value="all">Tots els meus alumnes</option>
              </Select>
            </div>

            {form.target === "student" && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="alumne-material">Alumne</Label>
                <Select
                  id="alumne-material"
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
            )}

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="tipus-material">Tipus</Label>
              <Select
                id="tipus-material"
                value={form.type}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    type: e.target.value as "partitura" | "video" | "audio",
                  }))
                }
              >
                <option value="partitura">Partitura / PDF</option>
                <option value="video">Vídeo</option>
                <option value="audio">Àudio</option>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="titol-material">Títol</Label>
              <Input
                id="titol-material"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Ex: Exercicis de digitació"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="descripcio-material">Descripció (opcional)</Label>
              <Textarea
                id="descripcio-material"
                rows={2}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="fitxer-material">Fitxer</Label>
              <input
                id="fitxer-material"
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="text-sm"
              />
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                {error}
              </p>
            )}

            <Button onClick={submit} disabled={pending} className="mt-1">
              {pending ? "Pujant..." : "Penjar material"}
            </Button>
          </CardContent>
        </Card>
      )}
    </>
  );
}
