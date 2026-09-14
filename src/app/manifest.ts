import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ARK#ÈDIA Escola de Música",
    short_name: "ARK#ÈDIA",
    description:
      "Gestió integral de l'escola de música: horaris, deures, partitures, vídeos i xat entre famílies i professorat.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f8fa",
    theme_color: "#1E51A4",
    orientation: "portrait-primary",
    lang: "ca",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
