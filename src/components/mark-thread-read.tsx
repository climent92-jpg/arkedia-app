"use client";

import { useEffect } from "react";
import { markThreadRead } from "@/lib/nav-badges-actions";

// No renderitza res: només avisa el servidor, en obrir un fil de xat, que
// l'usuari ja n'ha llegit els missatges (perquè el punt de notificació del
// menú s'apagui).
export function MarkThreadRead({ threadId }: { threadId: string }) {
  useEffect(() => {
    markThreadRead(threadId);
  }, [threadId]);
  return null;
}
