"use client";

import { PlayCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function VideoPlayer({
  src,
  title,
  className,
}: {
  src: string;
  title: string;
  className?: string;
}) {
  const isPlaceholder = !src || src === "#";

  if (isPlaceholder) {
    return (
      <div
        className={cn(
          "flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-arkedia-blue/30 bg-arkedia-blue-light/50 text-arkedia-blue",
          className
        )}
      >
        <PlayCircle className="size-10" />
        <p className="px-4 text-center text-xs font-semibold">
          Vídeo de mostra — es reproduirà aquí un cop connectat Supabase
          Storage
        </p>
      </div>
    );
  }

  return (
    <video
      className={cn("aspect-video w-full rounded-xl bg-black", className)}
      controls
      preload="metadata"
      title={title}
      src={src}
    />
  );
}
