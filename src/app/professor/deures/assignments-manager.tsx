"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { createAssignment } from "./actions";
import type { ProfessorAssignmentRow, ProfessorStudentRow } from "@/types";

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
  const [form, setForm] = useState({
    studentId: students[0]?.id ?? "",
    title: "",
    description: "",
    dueDate: "",
  });

  function submit() {
    setError(null);
    startTransition(async () => {
      const result = await createAssignment(form);
      if (!result.success) {
        setError(result.error ?? "Alguna cosa ha fallat.");
        return;
      }
      setForm({ studentId: students[0]?.id ?? "", title: "", description: "", dueDate: "" });
      setShowForm(false);
      router.refresh();
    });
  }

  return (
    <div>
      <div className="mb-5 flex justify-end">
        <Button size="sm" onClick={() => setShowForm((v) => !v)} disabled={students.length === 0}>
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

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                {error}
              </p>
            )}

            <Button onClick={submit} disabled={pending} className="mt-1">
              {pending ? "Desant..." : "Assignar deure"}
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
                <Badge variant={a.done ? "success" : "warning"}>
                  {a.done ? "Fet" : "Pendent"}
                </Badge>
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
              </div>
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
