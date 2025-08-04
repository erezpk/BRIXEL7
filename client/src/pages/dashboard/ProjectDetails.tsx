// client/src/pages/dashboard/projects/ProjectDetails.tsx

import { useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ArrowLeft } from "lucide-react";
import {
  type Project,
  type Client,
  type Task,
  type DigitalAsset,
} from "@shared/schema";

type ProjectType = "web" | "marketing" | "video";
type TabKey = "overview" | "tasks" | "assets";

export interface ProjectWithRelations extends Omit<Project, "createdBy"> {
  client?: Client;
  status: string;
  type: ProjectType;
}

export default function ProjectDetails() {
  const { projectId } = useParams<{ projectId: string }>();
  const [tab, setTab] = useState<TabKey>("overview");

  const { data: project, isLoading: loadingProject } =
    useQuery<ProjectWithRelations>({
      queryKey: ["project", projectId],
      queryFn: () => fetch(`/api/projects/${projectId}`).then((r) => r.json()),
      enabled: !!projectId,
    });

  const { data: tasks = [], isLoading: loadingTasks } = useQuery<Task[]>({
    queryKey: ["tasks", projectId],
    queryFn: () =>
      fetch(`/api/projects/${projectId}/tasks`).then((r) => r.json()),
    enabled: !!project,
  });

  const { data: assets = [], isLoading: loadingAssets } = useQuery<
    DigitalAsset[]
  >({
    queryKey: ["assets", project?.client?.id],
    queryFn: () =>
      fetch(`/api/clients/${project!.client!.id}/assets`).then((r) => r.json()),
    enabled: !!project?.client,
  });

  if (loadingProject) return <p className="p-6">טוען פרטי פרויקט…</p>;
  if (!project) return <p className="p-6">לא נמצא פרויקט.</p>;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <Link href="/dashboard/projects">
          <Button variant="ghost" size="icon">
            <ArrowLeft />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">{project.name}</h1>
      </div>

      <Tabs
        value={tab}
        onValueChange={(value) => setTab(value as TabKey)}
        className="w-full"
      >
        <TabsList>
          <TabsTrigger value="overview">סקירה</TabsTrigger>
          <TabsTrigger value="tasks">משימות</TabsTrigger>
          <TabsTrigger value="assets">נכסים</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="pt-4">
          <Card>
            <CardContent className="space-y-2">
              <p>
                <strong>לקוח:</strong> {project.client?.name ?? "—"}
              </p>
              <p>
                <strong>סטטוס:</strong> {project.status}
              </p>
              <p>
                <strong>סוג:</strong> {project.type}
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks" className="pt-4">
          <div className="flex justify-end mb-4">
            <Button onClick={() => setTab("tasks")}>+ משימה חדשה</Button>
          </div>
          {loadingTasks ? (
            <p>טוען משימות…</p>
          ) : tasks.length > 0 ? (
            <div className="space-y-3">
              {tasks.map((t) => (
                <Card key={t.id}>
                  <CardHeader>
                    <h3 className="font-medium">{t.title}</h3>
                  </CardHeader>
                  <CardContent>
                    <p>
                      <strong>סטטוס:</strong> {t.status}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p>אין משימות לפרויקט זה.</p>
          )}
        </TabsContent>

        <TabsContent value="assets" className="pt-4">
          <div className="flex justify-end mb-4">
            <Button onClick={() => setTab("assets")}>+ נכס חדש</Button>
          </div>
          {loadingAssets ? (
            <p>טוען נכסים…</p>
          ) : assets.length > 0 ? (
            <div className="space-y-3">
              {assets.map((a) => (
                <Card key={a.id}>
                  <CardHeader>
                    <h3 className="font-medium">{a.type}</h3>
                  </CardHeader>
                  <CardContent>
                    <p>
                      <strong>Provider:</strong> {a.provider ?? "—"}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p>אין נכסים לפרויקט זה.</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
