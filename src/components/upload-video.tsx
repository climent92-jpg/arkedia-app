"use client";

import { useRef, useState } from "react";
import { CheckCircle2, Trash2, UploadCloud, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label, Textarea } from "@/components/ui/input";

export function UploadVideo() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  function handleFiles(files: FileList | null) {
    const f = files?.[0];
    if (!f) return;
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    setSent(false);
  }

  function reset() {
    setFile(null);
    setPreviewUrl(null);
    setSent(false);
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
              <Input id="titol-video" placeholder="Ex: Escala de Do Major - intent 3" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="nota-video">Nota per al professor/a (opcional)</Label>
              <Textarea id="nota-video" rows={2} placeholder="Ex: M'he trabat una mica al final..." />
            </div>

            <Button onClick={() => setSent(true)} className="mt-1">
              Enviar al professor/a
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
