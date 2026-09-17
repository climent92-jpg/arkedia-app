"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { createMySchedule, deleteMySchedule, updateMySchedule } from "./actions";
import type { DiaSetmana, Modalitat, ProfessorScheduleRow, ProfessorStudentRow } from "@/types";

const WEEKDAYS: DiaSetmana[] = [
  "Dilluns",
  "Dimarts",
  "Dimecres",
  "Dijous",
  "Divendres",
  "Dissabte",
  "Diumenge",
];

const MODALITATS: Modalitat[] = ["Individual", "Parelles", "Col·lectiva"];

interface FormState {
  id: string | undefined;
  studentId: string;
  weekday: DiaSetmana;
  startTime: string;
  endTime: string;
  instrument: string;
  modality: Modalitat;
  room: string;
  notes: string;
}

function emptyForm(students: ProfessorStudentRow[], weekday: DiaSetmana = "Dilluns"): FormState {
  return {
    id: undefined,
    studentId: students[0]?.id ?? "",
    weekday,
    startTime: "16:00",
    endTime: "16:30",
    instrument: "",
    modality: "Individual",
    room: "",
    notes: "",
  };
}

export function HorarisManager({
  schedule,
  students,
}: {
  schedule: ProfessorScheduleRow[];
  students: ProfessorStudentRow[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(() => emptyForm(students));

  const canCreate = students.length > 0;

  const byDay = useMemo(
    () =>
      WEEKDAYS.map((weekday) => ({
        weekday,
        items: schedule
          .filter((s) => s.weekday === weekday)
          .sort((a, b) => a.startTime.localeCompare(b.startTime)),
      })),
    [schedule]
  );

  function openCreate(weekday: DiaSetmana = "Dilluns") {
    setForm(emptyForm(students, weekday));
    setError(null);
    setShowForm(true);
  }

  function openEdit(s: ProfessorScheduleRow) {
    setForm({
      id: s.id,
      studentId: s.studentId,
      weekday: s.weekday,
      startTime: s.startTime.slice(0, 5),
      endTime: s.endTime.slice(0, 5),
      instrument: s.instrument,
      modality: s.modality,
      room: s.room ?? "",
      notes: s.notes ?? "",
    });
    setError(null);
    setShowForm(true);
  }

  function submit() {
    setError(null);
    const payload = {
      studentId: form.studentId,
      weekday: form.weekday,
      startTime: form.startTime,
      endTime: form.endTime,
      instrument: form.instrument,
      modality: form.modality,
      room: form.room || undefined,
      notes: form.notes || undefined,
    };
    startTransition(async () => {
      const result = form.id
        ? await updateMySchedule(form.id, payload)
        : await createMySchedule(payload);
      if (!result.success) {
        setError(result.error ?? "Alguna cosa ha fallat.");
        return;
      }
      setForm(emptyForm(students));
      setShowForm(false);
      router.refresh();
    });
  }

  function remove(s: ProfessorScheduleRow) {
    if (
      !confirm(
        `Eliminar la classe de ${s.studentFirstName} ${s.studentLastName} (${s.weekday} ${s.startTime.slice(0, 5)})?`
      )
    )
      return;

    startTransition(async () => {
      const result = await deleteMySchedule(s.id);
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
        <Button
          size="sm"
          onClick={() => (showForm ? setShowForm(false) : openCreate())}
          disabled={!canCreate}
        >
          {showForm ? <X className="size-4" /> : <Plus className="size-4" />}
          {showForm ? "Tancar" : "Nova franja horària"}
        </Button>
      </div>

      {!canCreate && (
        <Card className="mb-4 border-amber-200 bg-amber-50">
          <CardContent className="p-4 text-sm text-amber-800">
            Encara no tens cap alumne assignat: demana a l&apos;administració
            que et vinculi un alumne abans de crear-hi horaris.
          </CardContent>
        </Card>
      )}

      {showForm && (
        <Card className="mb-5">
          <CardContent className="flex flex-col gap-3 p-4 sm:p-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="h-alumne">Alumne</Label>
                <Select
                  id="h-alumne"
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
                <Label htmlFor="h-dia">Dia de la setmana</Label>
                <Select
                  id="h-dia"
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
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="h-inici">Hora d&apos;inici</Label>
                <Input
                  id="h-inici"
                  type="time"
                  value={form.startTime}
                  onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="h-fi">Hora de fi</Label>
                <Input
                  id="h-fi"
                  type="time"
                  value={form.endTime}
                  onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="h-instrument">Instrument / assignatura</Label>
                <Input
                  id="h-instrument"
                  value={form.instrument}
                  onChange={(e) => setForm((f) => ({ ...f, instrument: e.target.value }))}
                  placeholder="Ex: Piano"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="h-modalitat">Modalitat</Label>
                <Select
                  id="h-modalitat"
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
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="h-aula">Aula (opcional)</Label>
              <Input
                id="h-aula"
                value={form.room}
                onChange={(e) => setForm((f) => ({ ...f, room: e.target.value }))}
                placeholder="Ex: Sala 2"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="h-notes">Notes (opcional)</Label>
              <Textarea
                id="h-notes"
                rows={2}
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Qualsevol detall addicional sobre aquesta franja..."
              />
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                {error}
              </p>
            )}

            <Button onClick={submit} disabled={pending} className="mt-1">
              {pending ? "Desant..." : form.id ? "Desar canvis" : "Crear franja horària"}
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col gap-5">
        {byDay.map(({ weekday, items }) => (
          <div key={weekday}>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wide text-muted">{weekday}</h2>
              <button
                onClick={() => openCreate(weekday)}
                disabled={!canCreate}
                className="flex size-7 items-center justify-center rounded-lg text-muted hover:bg-arkedia-blue-light hover:text-arkedia-blue disabled:opacity-50"
                aria-label={`Afegir franja el ${weekday}`}
              >
                <Plus className="size-4" />
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {items.map((s) => (
                <Card key={s.id}>
                  <CardContent className="flex flex-wrap items-center gap-3 p-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">
                          {s.startTime.slice(0, 5)}–{s.endTime.slice(0, 5)}
                        </p>
                        <Badge variant="outline">
                          {s.studentFirstName} {s.studentLastName}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-muted">
                        {s.instrument} · {s.modality}
                        {s.room && ` · ${s.room}`}
                      </p>
                      {s.notes && <p className="mt-1 text-xs italic text-muted">{s.notes}</p>}
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        onClick={() => openEdit(s)}
                        disabled={pending}
                        className="flex size-9 items-center justify-center rounded-lg text-muted hover:bg-black/[0.05] hover:text-arkedia-blue disabled:opacity-50"
                        aria-label="Editar"
                      >
                        <Pencil className="size-4" />
                      </button>
                      <button
                        onClick={() => remove(s)}
                        disabled={pending}
                        className="flex size-9 items-center justify-center rounded-lg text-muted hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                        aria-label="Eliminar"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {items.length === 0 && (
                <p className="rounded-xl border border-dashed border-border px-4 py-3 text-sm text-muted">
                  Cap classe.
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
