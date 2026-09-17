"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// No renderitza res: força un router.refresh() en obrir la pàgina perquè
// els comptadors del menú (calculats al layout) reflecteixin l'estat actual
// a l'instant, en lloc de quedar-se amb el valor calculat abans de navegar
// fins aquí (els layouts de Next.js es reutilitzen entre navegacions
// germanes i no es tornen a executar sols).
export function RefreshNavBadges() {
  const router = useRouter();
  useEffect(() => {
    router.refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
