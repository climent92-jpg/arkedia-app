"use client";

import { useState } from "react";
import { Megaphone, Plus, Send, X } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label, Textarea } from "@/components/ui/input";
import { announcements as initialAnnouncements } from "@/lib/mock-data";
import type { Announcement } from "@/types";

const AUDIENCE_LABEL: Record<Announcement["destinataris"], string> = {
  tothom: "Tothom",
  professors: "Professorat",
  families: "Famílies",
};

export default function AdminAvisosPage() {
  const [announcements, setAnnouncements] = useState(initialAnnouncements);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    titol: "",
    cos: "",
    destinataris: "tothom" as Announcement["destinataris"],
  });

  function publish() {
    if (!form.titol.trim() || !form.cos.trim()) return;
    setAnnouncements((prev) => [
      {
        id: `an-local-${Date.now()}`,
        titol: form.titol,
        cos: form.cos,
        destinataris: form.destinataris,
        data: new Date().toISOString().slice(0, 10),
        autor: "Direcció ARK#ÈDIA",
      },
      ...prev,
    ]);
    setForm({ titol: "", cos: "", destinataris: "tothom" });
    setShowForm(false);
  }

  return (
    <div>
      <PageHeader
        title="Avisos i comunicats"
        description="Envia missatges col·lectius a tota l'escola o a grups concrets."
        action={
          <Button size="sm" onClick={() => setShowForm((v) => !v)}>
            {showForm ? <X className="size-4" /> : <Plus className="size-4" />}
            {showForm ? "Tancar" : "Nou avís"}
          </Button>
        }
      />

      {showForm && (
        <Card className="mb-5">
          <CardContent className="flex flex-col gap-3 p-4 sm:p-5">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="an-titol">Títol</Label>
              <Input
                id="an-titol"
                value={form.titol}
                onChange={(e) => setForm((f) => ({ ...f, titol: e.target.value }))}
                placeholder="Ex: Audició de Nadal"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="an-cos">Missatge</Label>
              <Textarea
                id="an-cos"
                rows={4}
                value={form.cos}
                onChange={(e) => setForm((f) => ({ ...f, cos: e.target.value }))}
                placeholder="Escriu el comunicat..."
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="an-dest">Destinataris</Label>
              <select
                id="an-dest"
                value={form.destinataris}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    destinataris: e.target.value as Announcement["destinataris"],
                  }))
                }
                className="h-11 w-full rounded-xl border border-border bg-surface px-3.5 text-sm outline-none focus:border-arkedia-blue focus:ring-2 focus:ring-arkedia-blue/20"
              >
                <option value="tothom">Tothom</option>
                <option value="professors">Només professorat</option>
                <option value="families">Només famílies</option>
              </select>
            </div>
            <Button onClick={publish}>
              <Send className="size-4" />
              Publicar avís
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col gap-3">
        {announcements.map((a) => (
          <Card key={a.id}>
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-arkedia-blue-light text-arkedia-blue">
                    <Megaphone className="size-4" />
                  </span>
                  <div>
                    <p className="font-bold">{a.titol}</p>
                    <p className="text-xs text-muted">
                      {a.autor} ·{" "}
                      {new Date(a.data).toLocaleDateString("ca-ES", {
                        day: "numeric",
                        month: "long",
                      })}
                    </p>
                  </div>
                </div>
                <Badge variant="outline">{AUDIENCE_LABEL[a.destinataris]}</Badge>
              </div>
              <p className="mt-3 text-sm text-foreground/90">{a.cos}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
