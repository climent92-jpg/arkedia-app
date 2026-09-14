import { Download, FileText, MessageSquareQuote } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UploadVideo } from "@/components/upload-video";
import { VideoPlayer } from "@/components/video-player";
import { DEMO_STUDENT_ID } from "@/lib/demo-session";
import { materialsForStudent, submittedVideos } from "@/lib/mock-data";

export default function FamiliaMaterialPage() {
  const materials = materialsForStudent(DEMO_STUDENT_ID);
  const partitures = materials.filter((m) => m.tipus === "partitura");
  const videosProf = materials.filter((m) => m.tipus === "video");
  const meusVideos = submittedVideos.filter(
    (v) => v.studentId === DEMO_STUDENT_ID
  );

  return (
    <div>
      <PageHeader
        title="Material"
        description="Partitures, vídeos del professor i els teus propis vídeos."
      />

      <Tabs defaultValue="partitures">
        <TabsList>
          <TabsTrigger value="partitures">Partitures</TabsTrigger>
          <TabsTrigger value="videos-prof">Vídeos del profe</TabsTrigger>
          <TabsTrigger value="meu-video">El meu vídeo</TabsTrigger>
        </TabsList>

        <TabsContent value="partitures" className="flex flex-col gap-2.5">
          {partitures.map((m) => (
            <Card key={m.id}>
              <CardContent className="flex items-center gap-3 p-4">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-arkedia-blue-light text-arkedia-blue">
                  <FileText className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{m.titol}</p>
                  {m.descripcio && (
                    <p className="truncate text-sm text-muted">{m.descripcio}</p>
                  )}
                </div>
                <a
                  href={m.url}
                  className="flex size-9 shrink-0 items-center justify-center rounded-lg text-arkedia-blue hover:bg-arkedia-blue-light"
                  aria-label="Descarregar"
                >
                  <Download className="size-5" />
                </a>
              </CardContent>
            </Card>
          ))}
          {partitures.length === 0 && <EmptyState text="Encara no hi ha partitures penjades." />}
        </TabsContent>

        <TabsContent value="videos-prof" className="flex flex-col gap-4">
          {videosProf.map((m) => (
            <Card key={m.id}>
              <CardContent className="flex flex-col gap-2.5 p-4">
                <VideoPlayer src={m.url} title={m.titol} />
                <div>
                  <p className="font-semibold">{m.titol}</p>
                  {m.descripcio && (
                    <p className="text-sm text-muted">{m.descripcio}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          {videosProf.length === 0 && <EmptyState text="Encara no hi ha vídeos del professor." />}
        </TabsContent>

        <TabsContent value="meu-video" className="flex flex-col gap-4">
          <UploadVideo />

          {meusVideos.length > 0 && (
            <div>
              <h2 className="mb-2 mt-2 text-sm font-bold uppercase tracking-wide text-muted">
                Vídeos enviats
              </h2>
              <div className="flex flex-col gap-3">
                {meusVideos.map((v) => (
                  <Card key={v.id}>
                    <CardContent className="flex flex-col gap-2.5 p-4">
                      <VideoPlayer src={v.url} title={v.titol} />
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold">{v.titol}</p>
                        <Badge variant={v.revisat ? "success" : "warning"}>
                          {v.revisat ? "Revisat" : "Pendent de revisió"}
                        </Badge>
                      </div>
                      {v.comentariProfessor && (
                        <p className="flex items-start gap-2 rounded-lg bg-arkedia-blue-light/50 p-3 text-sm text-arkedia-blue">
                          <MessageSquareQuote className="size-4 shrink-0 mt-0.5" />
                          {v.comentariProfessor}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <Card>
      <CardContent className="p-6 text-center text-sm text-muted">{text}</CardContent>
    </Card>
  );
}
