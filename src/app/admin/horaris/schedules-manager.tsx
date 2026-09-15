"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { Field, FormError } from "@/app/admin/usuaris/users-manager";
import { createSchedule, deleteSchedule } from "./actions";
import type { AdminScheduleRow, AdminStudentRow, AdminTeacherRow, DiaSetmana, Modalitat } from "@/types";

const WEEKDAYS: DiaSetmana[] = [
  "Dilluns",
  "Dimarts",
  "Dimecres",
  "Dijous",
  "Divendres",
  "Dissabte",
];

const MODALITATS: Modalitat[] = ["Individual", "Parelles", "Col·lectiva"];

interface FormState {
  teacherId: string;
  studentId: string;
  weekday: DiaSetmana;
  startTime: string;
  endTime: string;
  instrument: string;
  modality: Modalitat;
  room: string;
}

function emptyForm(teachers: AdminTeacherRow[], students: AdminStudentRow[]): FormState {
  return {
    teacherId: teachers[0]?.id ?? "",
    studentId: students[0]?.id ?? "",
    weekday: "Dilluns",
    startTime: "16:00",
    endTime: "16:30",
    instrument: teachers[0]?.instruments[0] ?? "",
    modality: "Individual",
    room: "",
  };
}

export function SchedulesManager({
  initialSchedules,
  teachers,
  students,
}: {
  initialSchedules: AdminScheduleRow[];
  teachers: AdminTeacherRow[];
  students: AdminStudentRow[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(() => emptyForm(teachers, students));

  const canCreate = teachers.length > 0 && students.length > 0;

  function submit() {
    setError(null);
    startTransition(async () => {
      const result = await createSchedule({
        teacherId: form.teacherId,
        studentId: form.studentId,
        weekday: form.weekday,
        startTime: form.startTime,
        endTime: form.endTime,
        instrument: form.instrument,
        modality: form.modality,
        room: form.room || undefined,
      });
      if (!result.success) {
        setError(result.error ?? "Alguna cosa ha fallat.");
        return;
      }
      setForm(emptyForm(teachers, students));
      setShowForm(false);
      router.refresh();
    });
  }

  function remove(s: AdminScheduleRow) {
    if (
      !confirm(
        `Eliminar la classe de ${s.studentFirstName} ${s.studentLastName} (${s.weekday} ${s.startTime})?`
      )
    )
      return;

    startTransition(async () => {
      const result = await deleteSchedule(s.id);
      if (!result.success) {
        alert(result.error ?? "No s'ha pogut eliminar.");
        return;
      }
      router.refresh();
    });
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button size="sm" onClick={() => setShowForm((v) => !v)} disabled={!canCreate}>
          {showForm ? <X className="size-4" /> : <Plus className="size-4" />}
          {showForm ? "Tancar" : "Nova classe"}
        </Button>
      </div>

      {!canCreate && (
        <Card className="mb-4 border-amber-200 bg-amber-50">
          <CardContent className="p-4 text-sm text-amber-800">
            Cal donar d&apos;alta almenys un professor i un alumne a{" "}
            <span className="font-semibold">Usuaris</span> abans de crear horaris.
          </CardContent>
        </Card>
      )}

      {showForm && (
        <Card className="mb-5">
          <CardContent className="flex flex-col gap-3 p-4 sm:p-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Professor">
                <Select
                  value={form.teacherId}
                  onChange={(e) => setForm((f) => ({ ...f, teacherId: e.target.value }))}
                >
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.firstName} {t.lastName}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Alumne">
                <Select
                  value={form.studentId}
                  onChange={(e) => setForm((f) => ({ ...f, studentId: e.target.value }))}
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.firstName} {s.lastName}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Dia de la setmana">
                <Select
                  value={form.weekday}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, weekday: e.target.value as DiaSetmana }))
                  }
                >
                  {WEEKDAYS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Modalitat">
                <Select
                  value={form.modality}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, modality: e.target.value as Modalitat }))
                  }
                >
                  {MODALITATS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Hora d'inici">
                <Input
                  type="time"
                  value={form.startTime}
                  onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
                />
              </Field>
              <Field label="Hora de fi">
                <Input
                  type="time"
                  value={form.endTime}
                  onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
                />
              </Field>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Instrument">
                <Input
                  value={form.instrument}
                  onChange={(e) => setForm((f) => ({ ...f, instrument: e.target.value }))}
                  placeholder="Ex: Piano"
                />
              </Field>
              <Field label="Aula (opcional)">
                <Input
                  value={form.room}
                  onChange={(e) => setForm((f) => ({ ...f, room: e.target.value }))}
                  placeholder="Ex: Sala 2"
                />
              </Field>
            </div>

            {error && <FormError>{error}</FormError>}

            <Button onClick={submit} disabled={pending} className="mt-1">
              {pending ? "Desant..." : "Crear classe"}
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col gap-2">
        {initialSchedules.map((s) => (
          <Card key={s.id}>
            <CardContent className="flex flex-wrap items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold">
                    {s.studentFirstName} {s.studentLastName}
                  </p>
                  <Badge variant="outline">
                    {s.teacherFirstName} {s.teacherLastName}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-muted">
                  {s.weekday} · {s.startTime.slice(0, 5)}–{s.endTime.slice(0, 5)} ·{" "}
                  {s.instrument} · {s.modality}
                  {s.room && ` · ${s.room}`}
                </p>
              </div>
              <button
                onClick={() => remove(s)}
                className="flex size-9 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-red-50 hover:text-red-600"
                aria-label="Eliminar"
              >
                <Trash2 className="size-4" />
              </button>
            </CardContent>
          </Card>
        ))}

        {initialSchedules.length === 0 && (
          <Card>
            <CardContent className="p-6 text-center text-sm text-muted">
              Encara no hi ha cap classe programada.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
