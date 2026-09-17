"use client";

import { useEffect } from "react";
import { markAvisosSeen } from "@/lib/nav-badges-actions";

// No renderitza res: només avisa el servidor, en obrir la pàgina, que
// l'usuari ja ha vist els avisos actuals (perquè el punt de notificació del
// menú s'apagui).
export function MarkAvisosSeen() {
  useEffect(() => {
    markAvisosSeen();
  }, []);
  return null;
}
