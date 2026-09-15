"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label, Textarea } from "@/components/ui/input";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { DEMO_TEACHER_ID } from "@/lib/demo-session";
import { assignments as initialAssignments, studentsForTeacher } from "@/lib/mock-data";
import type { Assignment } from "@/types";

export default function ProfessorDeuresPage() {
  const alumnes = studentsForTeacher(DEMO_TEACHER_ID);
  const [assignments, setAssignments] = useState<Assignment[]>(
    initialAssignments.filter((a) => a.teacherId === DEMO_TEACHER_ID)
  );
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    studentId: alumnes[0]?.id ?? "",
    titol: "",
    descripcio: "",
    dataLimit: "",
  });

  function addAssignment() {
    if (!form.titol.trim() || !form.studentId) return;
    setAssignments((prev) => [
      {
        id: `a-local-${Date.now()}`,
        studentId: form.studentId,
        teacherId: DEMO_TEACHER_ID,
        titol: form.titol,
        descripcio: form.descripcio,
        dataAssignacio: new Date().toISOString().slice(0, 10),
        dataLimit: form.dataLimit || undefined,
        fet: false,
      },
      ...prev,
    ]);
    setForm({ studentId: alumnes[0]?.id ?? "", titol: "", descripcio: "", dataLimit: "" });
    setShowForm(false);
  }

  return (
    <div>
      <PageHeader
        title="Deures"
        description="Assigna tasques i exercicis setmanals."
        action={
          <Button size="sm" onClick={() => setShowForm((v) => !v)}>
            {showForm ? <X className="size-4" /> : <Plus className="size-4" />}
            {showForm ? "Tancar" : "Nou deure"}
          </Button>
        }
      />

      {showForm && (
        <Card className="mb-5">
          <CardContent className="flex flex-col gap-3 p-4 sm:p-5">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="alumne">Alumne</Label>
              <select
                id="alumne"
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
              <Label htmlFor="titol">Títol</Label>
              <Input
                id="titol"
                value={form.titol}
                onChange={(e) => setForm((f) => ({ ...f, titol: e.target.value }))}
                placeholder="Ex: Escala de Sol Major"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="descripcio">Descripció</Label>
              <Textarea
                id="descripcio"
                rows={2}
                value={form.descripcio}
                onChange={(e) => setForm((f) => ({ ...f, descripcio: e.target.value }))}
                placeholder="Detalls de com practicar-ho..."
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="data-limit">Data límit (opcional)</Label>
              <Input
                id="data-limit"
                type="date"
                value={form.dataLimit}
                onChange={(e) => setForm((f) => ({ ...f, dataLimit: e.target.value }))}
              />
            </div>
            <Button onClick={addAssignment} className="mt-1">
              Assignar deure
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col gap-2.5">
        {assignments.map((a) => {
          const student = alumnes.find((s) => s.id === a.studentId);
          return (
            <Card key={a.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-bold">{a.titol}</p>
                  <Badge variant={a.fet ? "success" : "warning"}>
                    {a.fet ? "Fet" : "Pendent"}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-muted">{a.descripcio}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Badge variant="outline">
                    {student?.nom} {student?.cognoms}
                  </Badge>
                  {a.dataLimit && (
                    <Badge variant="outline">
                      fins {new Date(a.dataLimit).toLocaleDateString("ca-ES", {
                        day: "numeric",
                        month: "short",
                      })}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}

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
