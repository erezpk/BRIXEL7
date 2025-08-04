import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Project {
  id: string;
  name: string;
}

export default function ProjectsList() {
  const queryClient = useQueryClient();

  // טוען את רשימת הפרויקטים
  const {
    data: projects = [],
    isLoading,
    isError,
    error,
  } = useQuery<Project[]>(["projects"], () =>
    fetch("/api/projects").then((r) => {
      if (!r.ok) throw new Error("Fetch failed");
      return r.json();
    }),
  );

  // Mutation ליצירת פרויקט חדש
  const createProject = useMutation<Project, Error, { name: string }>(
    (newProj) =>
      fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProj),
      }).then((r) => {
        if (!r.ok) throw new Error("Failed to create project");
        return r.json();
      }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["projects"]);
      },
    },
  );

  // טיפול בלחיצה על הכפתור
  const handleCreate = () => {
    const name = prompt("הקלד שם הפרויקט החדש:");
    if (!name) return;
    createProject.mutate({ name });
  };

  if (isLoading) return <p>טוען פרויקטים…</p>;
  if (isError)
    return <p className="text-red-500">{(error as Error).message}</p>;

  return (
    <Card>
      <CardHeader className="flex justify-between items-center">
        <CardTitle>רשימת פרויקטים</CardTitle>
        <Button onClick={handleCreate} disabled={createProject.isLoading}>
          {createProject.isLoading ? "יוצר..." : "פרויקט חדש"}
        </Button>
      </CardHeader>
      <CardContent>
        {projects.length === 0 ? (
          <p>אין פרויקטים.</p>
        ) : (
          <ul className="space-y-2">
            {projects.map((p) => (
              <li key={p.id} className="p-2 border rounded">
                {p.name}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
