"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { MessageSquareQuote, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { VideoPlayer } from "@/components/video-player";
import { deleteSubmittedVideo } from "./actions";
import type { StudentSubmittedVideoRow } from "@/types";

export function SubmittedVideosList({ videos }: { videos: StudentSubmittedVideoRow[] }) {
  if (videos.length === 0) return null;

  return (
    <div>
      <h2 className="mb-2 mt-2 text-sm font-bold uppercase tracking-wide text-muted">
        Vídeos enviats
      </h2>
      <div className="flex flex-col gap-3">
        {videos.map((v) => (
          <SubmittedVideoRow key={v.id} video={v} />
        ))}
      </div>
    </div>
  );
}

function SubmittedVideoRow({ video }: { video: StudentSubmittedVideoRow }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function remove() {
    if (!confirm(`Eliminar el vídeo "${video.title}"?`)) return;
    startTransition(async () => {
      const result = await deleteSubmittedVideo(video.id);
      if (!result.success) {
        alert(result.error ?? "No s'ha pogut eliminar.");
        return;
      }
      router.refresh();
    });
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-2.5 p-4">
        <VideoPlayer src={video.url ?? "#"} title={video.title} />
        <div className="flex items-center justify-between gap-2">
          <p className="font-semibold">{video.title}</p>
          <div className="flex shrink-0 items-center gap-1.5">
            <Badge variant={video.reviewed ? "success" : "warning"}>
              {video.reviewed ? "Revisat" : "Pendent de revisió"}
            </Badge>
            <button
              onClick={remove}
              disabled={pending}
              className="flex size-8 items-center justify-center rounded-lg text-muted hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
              aria-label="Eliminar"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        </div>
        {video.teacherComment && (
          <p className="flex items-start gap-2 rounded-lg bg-arkedia-blue-light/50 p-3 text-sm text-arkedia-blue">
            <MessageSquareQuote className="size-4 shrink-0 mt-0.5" />
            {video.teacherComment}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
