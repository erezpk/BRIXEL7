import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { type Project, type Client } from "@shared/schema";

type ProjectType = "web" | "marketing" | "video";

interface ProjectWithRelations extends Omit<Project, "createdBy"> {
  client?: Client;
  status: string;
  type: ProjectType;
}

export default function ProjectDetails({ projectId }: { projectId: string }) {
  const { data: project, isLoading } = useQuery<ProjectWithRelations>({
    queryKey: [`/api/projects/${projectId}`],
    queryFn: () => fetch(`/api/projects/${projectId}`).then((r) => r.json()),
  });

  if (isLoading) return <p>טוען פרטי פרויקט…</p>;
  if (!project) return <p>לא נמצא פרויקט עם מזהה זה.</p>;

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <h2 className="text-2xl font-semibold">{project.name}</h2>
      </CardHeader>
      <CardContent>
        <p>
          <strong>לקוח:</strong> {project.client?.name || "—"}
        </p>
        <p>
          <strong>סטטוס:</strong> {project.status}
        </p>
        <p>
          <strong>סוג פרויקט:</strong> {project.type}
        </p>
        {/* כאן ניתן להוסיף רכיבי ניהול מטלות, נכסים דיגיטליים וכו׳ */}
      </CardContent>
    </Card>
  );
}
