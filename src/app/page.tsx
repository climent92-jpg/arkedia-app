import Link from "next/link";
import { GraduationCap, Music4, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";

const demoAccess = [
  {
    href: "/familia",
    icon: GraduationCap,
    title: "Sóc família / alumne",
    desc: "Horari, deures, partitures i vídeos",
  },
  {
    href: "/professor",
    icon: Music4,
    title: "Sóc professor/a",
    desc: "Agenda, alumnes i material",
  },
  {
    href: "/admin",
    icon: ShieldCheck,
    title: "Sóc administració",
    desc: "Gestió de l'escola i importador",
  },
];

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col bg-arkedia-blue">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-6 py-10">
        <div className="flex flex-1 flex-col items-center justify-center gap-8 text-white">
          <Logo size="lg" className="items-center text-white [&_span]:text-white" />

          <Card className="w-full border-none">
            <CardContent className="flex flex-col gap-4 p-5 sm:p-6">
              <div>
                <h1 className="text-lg font-bold">Benvinguts/des!</h1>
                <p className="text-sm text-muted">
                  Inicia sessió per accedir al teu portal.
                </p>
              </div>

              <form className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="email">Correu electrònic</Label>
                  <Input id="email" type="email" placeholder="nom@exemple.com" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="password">Contrasenya</Label>
                  <Input id="password" type="password" placeholder="••••••••" />
                </div>
                <Button type="submit" size="lg" className="mt-1 w-full">
                  Entrar
                </Button>
              </form>

              <div className="flex items-center gap-3 text-xs font-semibold text-muted">
                <span className="h-px flex-1 bg-border" />
                O prova una demo ràpida
                <span className="h-px flex-1 bg-border" />
              </div>

              <div className="flex flex-col gap-2">
                {demoAccess.map((d) => (
                  <Link
                    key={d.href}
                    href={d.href}
                    className="flex items-center gap-3 rounded-xl border border-border px-3.5 py-3 text-left transition-colors hover:border-arkedia-blue hover:bg-arkedia-blue-light"
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-arkedia-blue-light text-arkedia-blue">
                      <d.icon className="size-5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-bold text-foreground">
                        {d.title}
                      </span>
                      <span className="block truncate text-xs text-muted">
                        {d.desc}
                      </span>
                    </span>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <p className="pt-6 text-center text-xs text-white/70">
          © {new Date().getFullYear()} ARK#ÈDIA Escola de Música
        </p>
      </div>
    </div>
  );
}
