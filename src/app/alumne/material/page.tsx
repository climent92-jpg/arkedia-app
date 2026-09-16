import { Download, FileText } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UploadVideo } from "@/components/upload-video";
import { VideoPlayer } from "@/components/video-player";
import {
  getMyMaterials,
  getMyStudentProfile,
  getMySubmittedVideos,
  getMyTeachers,
} from "@/lib/student-data";
import { NoStudentProfile } from "@/app/alumne/agenda/page";
import { SubmittedVideosList } from "./submitted-videos-list";

// Depèn de la sessió i de dades en viu de Supabase: no es pot prerenderitzar.
export const dynamic = "force-dynamic";

export default async function AlumneMaterialPage() {
  const student = await getMyStudentProfile();

  if (!student) {
    return (
      <div>
        <PageHeader title="Material" />
        <NoStudentProfile />
      </div>
    );
  }

  const teachers = await getMyTeachers(student.id);
  const [materials, submittedVideos] = await Promise.all([
    getMyMaterials(student.id, teachers.map((t) => t.id)),
    getMySubmittedVideos(student.id),
  ]);

  const partitures = materials.filter((m) => m.type === "partitura");
  const videosProf = materials.filter((m) => m.type === "video");

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
                  <p className="truncate font-semibold">{m.title}</p>
                  {m.description && (
                    <p className="truncate text-sm text-muted">{m.description}</p>
                  )}
                  <p className="truncate text-xs text-muted">
                    {m.teacherFirstName} {m.teacherLastName}
                  </p>
                </div>
                {m.url ? (
                  <a
                    href={m.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex size-9 shrink-0 items-center justify-center rounded-lg text-arkedia-blue hover:bg-arkedia-blue-light"
                    aria-label="Descarregar"
                  >
                    <Download className="size-5" />
                  </a>
                ) : (
                  <Download className="size-5 shrink-0 text-border" />
                )}
              </CardContent>
            </Card>
          ))}
          {partitures.length === 0 && (
            <EmptyState text="Encara no hi ha partitures penjades." />
          )}
        </TabsContent>

        <TabsContent value="videos-prof" className="flex flex-col gap-4">
          {videosProf.map((m) => (
            <Card key={m.id}>
              <CardContent className="flex flex-col gap-2.5 p-4">
                <VideoPlayer src={m.url ?? "#"} title={m.title} />
                <div>
                  <p className="font-semibold">{m.title}</p>
                  {m.description && <p className="text-sm text-muted">{m.description}</p>}
                  <p className="text-xs text-muted">
                    {m.teacherFirstName} {m.teacherLastName}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
          {videosProf.length === 0 && (
            <EmptyState text="Encara no hi ha vídeos del professor." />
          )}
        </TabsContent>

        <TabsContent value="meu-video" className="flex flex-col gap-4">
          <UploadVideo student={student} teachers={teachers} />
          <SubmittedVideosList videos={submittedVideos} />
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
