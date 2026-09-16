import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Els fitxers grans (vídeos) es pugen directament del navegador a
  // Supabase Storage i mai passen per cap Server Action — les accions
  // només reben strings petits (títol, storagePath...). Ampliem igualment
  // el límit per defecte (1MB) com a marge de seguretat per a qualsevol
  // acció que en el futur rebi un payload més gran.
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
