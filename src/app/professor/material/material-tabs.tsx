"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VideoPlayer } from "@/components/video-player";
import { updateSubmittedVideoReview } from "./actions";
import type { ProfessorMaterialRow, ProfessorSubmittedVideoRow } from "@/types";

export function MaterialTabs({
  initialMaterials,
  initialSubmittedVideos,
}: {
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
        {initialMaterials.map((m) => (
          <Card key={m.id}>
            <CardContent className="flex items-center gap-3 p-4">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-arkedia-blue-light text-arkedia-blue">
                <FileText className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{m.title}</p>
                <p className="truncate text-sm text-muted">
                  {m.studentName ?? "Material general"}
                </p>
              </div>
              <Badge variant="outline">{m.type}</Badge>
            </CardContent>
          </Card>
        ))}

        {initialMaterials.length === 0 && (
          <Card>
            <CardContent className="p-6 text-center text-sm text-muted">
              Encara no has penjat cap material. La pujada de fitxers des
              d&apos;aquí estarà disponible properament.
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
        <VideoPlayer src="#" title={video.title} />
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-bold">{video.title}</p>
            <p className="text-sm text-muted">{video.studentName}</p>
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
