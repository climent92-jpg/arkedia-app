"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FileText, Plus, Trash2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { uploadToStorage } from "@/lib/storage-upload";
import { createMaterial, deleteMaterial } from "./actions";
import type { ProfessorMaterialRow, ProfessorStudentRow } from "@/types";

export function MaterialTabs({
  teacherId,
  students,
  initialMaterials,
}: {
  teacherId: string;
  students: ProfessorStudentRow[];
  initialMaterials: ProfessorMaterialRow[];
}) {
  return (
    <div className="flex flex-col gap-2.5">
      <UploadMaterialForm teacherId={teacherId} students={students} />

      {initialMaterials.map((m) => (
        <MaterialCard key={m.id} material={m} />
      ))}

      {initialMaterials.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center text-sm text-muted">
            Encara no has penjat cap material.
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function MaterialCard({ material }: { material: ProfessorMaterialRow }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function remove() {
    if (!confirm(`Eliminar "${material.title}"?`)) return;
    startTransition(async () => {
      const result = await deleteMaterial(material.id);
      if (!result.success) {
        alert(result.error ?? "No s'ha pogut eliminar.");
        return;
      }
      router.refresh();
    });
  }

  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-arkedia-blue-light text-arkedia-blue">
          <FileText className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{material.title}</p>
          <p className="truncate text-sm text-muted">
            {material.studentName ?? "Tots els meus alumnes"}
          </p>
        </div>
        <Badge variant="outline">{material.type}</Badge>
        {material.url && (
          <Button asChild variant="outline" size="sm">
            <a href={material.url} target="_blank" rel="noreferrer">
              Obrir
            </a>
          </Button>
        )}
        <button
          onClick={remove}
          disabled={pending}
          className="flex size-9 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
          aria-label="Eliminar"
        >
          <Trash2 className="size-4" />
        </button>
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

const FALLBACK_CONTENT_TYPE: Record<typeof emptyForm.type, string> = {
  partitura: "application/pdf",
  video: "video/mp4",
  audio: "audio/mpeg",
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
      const upload = await uploadToStorage(
        "materials",
        teacherId,
        file,
        FALLBACK_CONTENT_TYPE[form.type]
      );
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
