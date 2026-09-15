"use client";

import { useState } from "react";
import { CheckCircle2, FileText, Plus, UploadCloud, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label, Textarea } from "@/components/ui/input";
import { PageHeader } from "@/components/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VideoPlayer } from "@/components/video-player";
import { DEMO_TEACHER_ID } from "@/lib/demo-session";
import {
  materials as initialMaterials,
  studentsForTeacher,
  submittedVideos as initialSubmitted,
} from "@/lib/mock-data";
import type { Material, SubmittedVideo } from "@/types";

export default function ProfessorMaterialPage() {
  const alumnes = studentsForTeacher(DEMO_TEACHER_ID);
  const [materials, setMaterials] = useState<Material[]>(
    initialMaterials.filter((m) => m.teacherId === DEMO_TEACHER_ID)
  );
  const [submitted, setSubmitted] = useState<SubmittedVideo[]>(
    initialSubmitted.filter((v) => v.teacherId === DEMO_TEACHER_ID)
  );
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    studentId: alumnes[0]?.id ?? "",
    tipus: "partitura" as Material["tipus"],
    titol: "",
    descripcio: "",
  });

  function addMaterial() {
    if (!form.titol.trim()) return;
    setMaterials((prev) => [
      {
        id: `m-local-${Date.now()}`,
        studentId: form.studentId,
        teacherId: DEMO_TEACHER_ID,
        tipus: form.tipus,
        titol: form.titol,
        descripcio: form.descripcio,
        dataPujada: new Date().toISOString().slice(0, 10),
        url: "#",
      },
      ...prev,
    ]);
    setForm({ studentId: alumnes[0]?.id ?? "", tipus: "partitura", titol: "", descripcio: "" });
    setShowForm(false);
  }

  function updateComment(id: string, comentari: string) {
    setSubmitted((prev) =>
      prev.map((v) => (v.id === id ? { ...v, comentariProfessor: comentari } : v))
    );
  }

  function toggleRevisat(id: string) {
    setSubmitted((prev) =>
      prev.map((v) => (v.id === id ? { ...v, revisat: !v.revisat } : v))
    );
  }

  return (
    <div>
      <PageHeader
        title="Material"
        description="Puja partitures i vídeos, i revisa els vídeos dels alumnes."
      />

      <Tabs defaultValue="penjat">
        <TabsList>
          <TabsTrigger value="penjat">Material penjat</TabsTrigger>
          <TabsTrigger value="revisar">
            Vídeos alumnes
            {submitted.some((v) => !v.revisat) && (
              <span className="ml-1 inline-block size-1.5 rounded-full bg-arkedia-accent" />
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="penjat">
          <div className="mb-4 flex justify-end">
            <Button size="sm" onClick={() => setShowForm((v) => !v)}>
              {showForm ? <X className="size-4" /> : <Plus className="size-4" />}
              {showForm ? "Tancar" : "Pujar material"}
            </Button>
          </div>

          {showForm && (
            <Card className="mb-4">
              <CardContent className="flex flex-col gap-3 p-4 sm:p-5">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="mat-alumne">Alumne</Label>
                    <select
                      id="mat-alumne"
                      value={form.studentId}
                      onChange={(e) => setForm((f) => ({ ...f, studentId: e.target.value }))}
                      className="h-11 w-full rounded-xl border border-border bg-surface px-3.5 text-sm outline-none focus:border-arkedia-blue focus:ring-2 focus:ring-arkedia-blue/20"
                    >
                      {alumnes.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.nom} {s.cognoms}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="mat-tipus">Tipus</Label>
                    <select
                      id="mat-tipus"
                      value={form.tipus}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, tipus: e.target.value as Material["tipus"] }))
                      }
                      className="h-11 w-full rounded-xl border border-border bg-surface px-3.5 text-sm outline-none focus:border-arkedia-blue focus:ring-2 focus:ring-arkedia-blue/20"
                    >
                      <option value="partitura">Partitura (PDF)</option>
                      <option value="video">Vídeo</option>
                      <option value="audio">Àudio</option>
                    </select>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="mat-titol">Títol</Label>
                  <Input
                    id="mat-titol"
                    value={form.titol}
                    onChange={(e) => setForm((f) => ({ ...f, titol: e.target.value }))}
                    placeholder="Ex: Partitura - Per Elisa"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="mat-desc">Descripció (opcional)</Label>
                  <Textarea
                    id="mat-desc"
                    rows={2}
                    value={form.descripcio}
                    onChange={(e) => setForm((f) => ({ ...f, descripcio: e.target.value }))}
                  />
                </div>
                <button
                  type="button"
                  className="flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-border py-6 text-muted hover:border-arkedia-blue hover:text-arkedia-blue"
                >
                  <UploadCloud className="size-6" />
                  <span className="text-xs font-semibold">
                    Toca per seleccionar l&apos;arxiu (demo)
                  </span>
                </button>
                <Button onClick={addMaterial}>Pujar</Button>
              </CardContent>
            </Card>
          )}

          <div className="flex flex-col gap-2.5">
            {materials.map((m) => {
              const student = alumnes.find((s) => s.id === m.studentId);
              return (
                <Card key={m.id}>
                  <CardContent className="flex items-center gap-3 p-4">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-arkedia-blue-light text-arkedia-blue">
                      <FileText className="size-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{m.titol}</p>
                      <p className="truncate text-sm text-muted">
                        {student?.nom} {student?.cognoms}
                      </p>
                    </div>
                    <Badge variant="outline">{m.tipus}</Badge>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="revisar" className="flex flex-col gap-4">
          {submitted.map((v) => {
            const student = alumnes.find((s) => s.id === v.studentId);
            return (
              <Card key={v.id}>
                <CardContent className="flex flex-col gap-3 p-4">
                  <VideoPlayer src={v.url} title={v.titol} />
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-bold">{v.titol}</p>
                      <p className="text-sm text-muted">
                        {student?.nom} {student?.cognoms}
                      </p>
                    </div>
                    <Badge variant={v.revisat ? "success" : "warning"}>
                      {v.revisat ? "Revisat" : "Pendent"}
                    </Badge>
                  </div>
                  <Textarea
                    rows={2}
                    placeholder="Escriu un comentari o valoració..."
                    value={v.comentariProfessor ?? ""}
                    onChange={(e) => updateComment(v.id, e.target.value)}
                  />
                  <Button
                    variant={v.revisat ? "outline" : "default"}
                    size="sm"
                    onClick={() => toggleRevisat(v.id)}
                    className="self-start"
                  >
                    <CheckCircle2 className="size-4" />
                    {v.revisat ? "Marcar com a pendent" : "Marcar com a revisat"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}

          {submitted.length === 0 && (
            <Card>
              <CardContent className="p-6 text-center text-sm text-muted">
                Cap alumne ha enviat vídeos encara.
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
