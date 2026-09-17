"use client";

// Comprimeix un vídeo al navegador abans de pujar-lo, per reduir el temps de
// pujada i l'espai a Supabase Storage: el reproduïm en un <video> ocult,
// el dibuixem a un <canvas> (limitant l'alçada/amplada a 720p) i gravem el
// resultat amb MediaRecorder a un bitrate reduït.
//
// Si el navegador no suporta MediaRecorder/captureStream, o qualsevol pas
// falla, retornem el fitxer original sense tocar-lo: és millor pujar un
// vídeo gran que no pujar-ne cap (compatibilitat amb Safari/iOS antics).

export interface CompressVideoOptions {
  maxHeight?: number;
  videoBitsPerSecond?: number;
  onProgress?: (progress: number) => void;
}

const MAX_HEIGHT_DEFAULT = 720;
const BITRATE_DEFAULT = 1_500_000; // ~1.5 Mbps

// Safari (macOS i iOS/iPadOS) no té suport fiable de WebM: alguns Safari
// permeten gravar-lo amb MediaRecorder però després no el saben reproduir
// (pantalla negra sense àudio ni vídeo). Com que no podem garantir que qui
// revisi el vídeo (el professor) tampoc faci servir Safari, la manera
// segura d'evitar aquest forat és no re-encodar mai a WebM en aquest
// navegador: pugem sempre l'original (normalment MP4/H.264, que Safari sí
// reprodueix de manera nativa).
function isSafari(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const isAppleVendor = /apple/i.test(navigator.vendor ?? "");
  const isChromiumOrFirefox = /crios|fxios|chrome|chromium|android|firefox/i.test(ua);
  const isIOSDevice =
    /iPad|iPhone|iPod/.test(ua) ||
    // iPadOS 13+ es presenta com "Macintosh" però amb suport tàctil.
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  return (isAppleVendor && !isChromiumOrFirefox) || (isIOSDevice && !isChromiumOrFirefox);
}

function pickMimeType(): string | null {
  if (isSafari()) return null;
  const candidates = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
  ];
  for (const type of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  return null;
}

export async function compressVideo(
  file: File,
  options: CompressVideoOptions = {}
): Promise<File> {
  const maxHeight = options.maxHeight ?? MAX_HEIGHT_DEFAULT;
  const videoBitsPerSecond = options.videoBitsPerSecond ?? BITRATE_DEFAULT;

  if (typeof window === "undefined" || typeof MediaRecorder === "undefined") {
    return file;
  }

  const mimeType = pickMimeType();
  if (!mimeType) return file;

  try {
    return await new Promise<File>((resolve) => {
      const video = document.createElement("video");
      video.muted = true;
      video.playsInline = true;
      video.src = URL.createObjectURL(file);

      let settled = false;
      const finish = (result: File) => {
        if (settled) return;
        settled = true;
        URL.revokeObjectURL(video.src);
        resolve(result);
      };

      // Si alguna cosa triga massa o queda penjada, no bloquegem la pujada:
      // al cap d'un temps raonable, ens quedem amb l'original.
      const safetyTimeout = setTimeout(() => finish(file), 60_000);

      video.onloadedmetadata = () => {
        const scale = Math.min(1, maxHeight / video.videoHeight || 1);
        const width = Math.round((video.videoWidth || 1) * scale);
        const height = Math.round((video.videoHeight || 1) * scale);

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          clearTimeout(safetyTimeout);
          finish(file);
          return;
        }

        const canvasStream = canvas.captureStream(30);

        // Afegim l'àudio original de la font al stream que gravem, si n'hi ha.
        const videoWithAudio = video as HTMLVideoElement & {
          captureStream?: () => MediaStream;
          mozCaptureStream?: () => MediaStream;
        };
        const audioSource = videoWithAudio.captureStream?.() ?? videoWithAudio.mozCaptureStream?.();
        const audioTracks = audioSource?.getAudioTracks() ?? [];
        for (const track of audioTracks) canvasStream.addTrack(track);

        const chunks: BlobPart[] = [];
        let recorder: MediaRecorder;
        try {
          recorder = new MediaRecorder(canvasStream, { mimeType, videoBitsPerSecond });
        } catch {
          clearTimeout(safetyTimeout);
          finish(file);
          return;
        }

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunks.push(e.data);
        };

        recorder.onerror = () => {
          clearTimeout(safetyTimeout);
          finish(file);
        };

        recorder.onstop = () => {
          clearTimeout(safetyTimeout);
          if (chunks.length === 0) {
            finish(file);
            return;
          }
          const blob = new Blob(chunks, { type: mimeType });
          // Si la "compressió" ha acabat pesant més que l'original (vídeos
          // ja petits, o navegadors amb codecs poc eficients), ens quedem
          // amb l'original.
          if (blob.size >= file.size) {
            finish(file);
            return;
          }
          const newName = file.name.replace(/\.[^.]+$/, "") + ".webm";
          finish(new File([blob], newName, { type: mimeType }));
        };

        let rafId: number;
        const draw = () => {
          if (video.paused || video.ended) return;
          ctx.drawImage(video, 0, 0, width, height);
          if (video.duration) {
            options.onProgress?.(Math.min(99, Math.round((video.currentTime / video.duration) * 100)));
          }
          rafId = requestAnimationFrame(draw);
        };

        video.onplay = () => {
          recorder.start();
          draw();
        };

        video.onended = () => {
          cancelAnimationFrame(rafId);
          options.onProgress?.(100);
          if (recorder.state !== "inactive") recorder.stop();
        };

        video.onerror = () => {
          cancelAnimationFrame(rafId);
          clearTimeout(safetyTimeout);
          finish(file);
        };

        video.play().catch(() => {
          clearTimeout(safetyTimeout);
          finish(file);
        });
      };

      video.onerror = () => {
        clearTimeout(safetyTimeout);
        finish(file);
      };
    });
  } catch {
    return file;
  }
}
