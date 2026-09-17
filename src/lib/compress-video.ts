"use client";

// Comprimeix un vídeo al navegador abans de pujar-lo, per reduir el temps de
// pujada i l'espai a Supabase Storage: el reproduïm en un <video> ocult
// (però enganxat al DOM — vegeu la nota més avall), el dibuixem a un
// <canvas> (limitant l'alçada/amplada a 720p) i gravem el resultat amb
// MediaRecorder a un bitrate reduït.
//
// Si el navegador no suporta MediaRecorder/captureStream, qualsevol pas
// falla, o el resultat final no es pot ni reproduir, retornem el fitxer
// original sense tocar-lo: és molt millor pujar un vídeo gran (i sempre
// reproduïble) que no pujar-ne cap, o pujar-ne un de corrupte.

export interface CompressVideoOptions {
  maxHeight?: number;
  videoBitsPerSecond?: number;
  onProgress?: (progress: number) => void;
}

const MAX_HEIGHT_DEFAULT = 720;
const BITRATE_DEFAULT = 1_500_000; // ~1.5 Mbps
const COMPRESSION_TIMEOUT_MS = 60_000;
const VALIDATION_TIMEOUT_MS = 8_000;

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
  if (typeof MediaRecorder === "undefined") return null;
  if (typeof HTMLCanvasElement === "undefined" || !HTMLCanvasElement.prototype.captureStream) {
    return null;
  }
  const candidates = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"];
  for (const type of candidates) {
    if (MediaRecorder.isTypeSupported(type)) return type;
  }
  return null;
}

// Un <video>/<canvas> mai enganxat al document pot no arribar a decodificar
// ni pintar cap fotograma en alguns navegadors (el bucle de dibuix mai
// avança i captureStream() grava un vídeo negre o buit, que és exactament
// el símptoma reportat: ni comprimeix bé ni el resultat es pot reproduir).
// Per evitar-ho, els enganxem fora de pantalla (mai amb display:none, que sí
// pot aturar el renderitzat) i els traiem sempre en acabar.
function attachOffscreen<T extends HTMLElement>(el: T): T {
  el.style.position = "fixed";
  el.style.left = "-9999px";
  el.style.top = "-9999px";
  el.style.width = "1px";
  el.style.height = "1px";
  el.style.opacity = "0";
  el.style.pointerEvents = "none";
  document.body.appendChild(el);
  return el;
}

// Comprova que el fitxer resultant és realment reproduïble (té metadades i
// una durada > 0) abans de confiar-hi: és la xarxa de seguretat final contra
// pujar un vídeo "comprimit" que en realitat està corrupte.
function isPlayableVideo(file: File, timeoutMs = VALIDATION_TIMEOUT_MS): Promise<boolean> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.preload = "metadata";
    const url = URL.createObjectURL(file);

    let done = false;
    const finish = (ok: boolean) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      video.removeAttribute("src");
      video.load();
      URL.revokeObjectURL(url);
      resolve(ok);
    };

    const timer = setTimeout(() => finish(false), timeoutMs);
    video.onloadedmetadata = () => finish(Number.isFinite(video.duration) && video.duration > 0);
    video.onerror = () => finish(false);
    video.src = url;
  });
}

function runCompression(
  file: File,
  mimeType: string,
  maxHeight: number,
  videoBitsPerSecond: number,
  onProgress?: (progress: number) => void
): Promise<File | null> {
  return new Promise((resolve) => {
    const video = attachOffscreen(document.createElement("video"));
    video.muted = true;
    video.playsInline = true;
    video.src = URL.createObjectURL(file);

    let settled = false;
    let canvasStream: MediaStream | null = null;
    const cleanup = () => {
      URL.revokeObjectURL(video.src);
      video.removeAttribute("src");
      video.load();
      video.remove();
      canvasStream?.getTracks().forEach((t) => t.stop());
    };
    const finish = (result: File | null) => {
      if (settled) return;
      settled = true;
      clearTimeout(safetyTimeout);
      cleanup();
      resolve(result);
    };

    // Si alguna cosa triga massa o queda penjada, no bloquegem la pujada.
    const safetyTimeout = setTimeout(() => finish(null), COMPRESSION_TIMEOUT_MS);

    video.onloadedmetadata = () => {
      const scale = Math.min(1, maxHeight / video.videoHeight || 1);
      const width = Math.round((video.videoWidth || 1) * scale);
      const height = Math.round((video.videoHeight || 1) * scale);
      if (!width || !height) {
        finish(null);
        return;
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        finish(null);
        return;
      }

      try {
        canvasStream = canvas.captureStream(30);
      } catch {
        finish(null);
        return;
      }

      // Afegim l'àudio original de la font al stream que gravem, si n'hi ha.
      const videoWithAudio = video as HTMLVideoElement & {
        captureStream?: () => MediaStream;
        mozCaptureStream?: () => MediaStream;
      };
      try {
        const audioSource = videoWithAudio.captureStream?.() ?? videoWithAudio.mozCaptureStream?.();
        const audioTracks = audioSource?.getAudioTracks() ?? [];
        for (const track of audioTracks) canvasStream.addTrack(track);
      } catch {
        // Sense àudio és millor que cap vídeo: continuem sense bloquejar.
      }

      const chunks: BlobPart[] = [];
      let recorder: MediaRecorder;
      try {
        recorder = new MediaRecorder(canvasStream, { mimeType, videoBitsPerSecond });
      } catch {
        finish(null);
        return;
      }

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      recorder.onerror = () => finish(null);
      recorder.onstop = () => {
        if (chunks.length === 0) {
          finish(null);
          return;
        }
        const blob = new Blob(chunks, { type: mimeType });
        if (blob.size === 0 || blob.size >= file.size) {
          // Sense contingut útil, o la "compressió" ha acabat pesant més
          // que l'original: no val la pena quedar-se-la.
          finish(null);
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
          onProgress?.(Math.min(99, Math.round((video.currentTime / video.duration) * 100)));
        }
        rafId = requestAnimationFrame(draw);
      };

      video.onplay = () => {
        recorder.start();
        draw();
      };
      video.onended = () => {
        cancelAnimationFrame(rafId);
        onProgress?.(100);
        if (recorder.state !== "inactive") recorder.stop();
      };
      video.onerror = () => finish(null);

      video.play().catch(() => finish(null));
    };

    video.onerror = () => finish(null);
  });
}

export async function compressVideo(
  file: File,
  options: CompressVideoOptions = {}
): Promise<File> {
  const maxHeight = options.maxHeight ?? MAX_HEIGHT_DEFAULT;
  const videoBitsPerSecond = options.videoBitsPerSecond ?? BITRATE_DEFAULT;

  if (typeof window === "undefined") return file;

  const mimeType = pickMimeType();
  if (!mimeType) return file;

  try {
    const compressed = await runCompression(
      file,
      mimeType,
      maxHeight,
      videoBitsPerSecond,
      options.onProgress
    );
    if (!compressed) return file;

    // Última comprovació: si el fitxer "comprimit" no es pot ni carregar,
    // no l'acceptem mai — millor pujar l'original que un vídeo corrupte.
    const playable = await isPlayableVideo(compressed);
    return playable ? compressed : file;
  } catch (error) {
    console.error("compressVideo: s'ha produït un error inesperat, es fa servir l'original", error);
    return file;
  }
}
