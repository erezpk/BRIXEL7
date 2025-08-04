// client/src/pages/dashboard/projects/index.tsx
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { type Project, type Client } from "@shared/schema";

export interface ProjectWithRelations extends Omit<Project, "createdBy"> {
  client?: Client;
  status: string;
  type: string;
}

export default function Projects() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | string>("all");

  const { data = [], isLoading } = useQuery<ProjectWithRelations[]>({
    queryKey: ["projects"],
    queryFn: () => fetch("/api/projects").then((r) => r.json()),
  });

  const filtered = data.filter((p) => {
    const byName =
      !search || p.name.toLowerCase().includes(search.toLowerCase());
    const byStatus = status === "all" || p.status === status;
    return byName && byStatus;
  });

  return (
    <div className="p-6 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">ניהול פרויקטים</h1>
        <Link href="/dashboard/projects/new">
          <Button size="lg">
            <Plus className="h-5 w-5" /> פרויקט חדש
          </Button>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          placeholder="חפש..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1"
        />
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-full sm:w-48">סטטוס</SelectTrigger>
          <SelectContent>
            <SelectItem value="all">כל הסטטוסים</SelectItem>
            <SelectItem value="planning">תכנון</SelectItem>
            <SelectItem value="active">פעיל</SelectItem>
            <SelectItem value="completed">הושלם</SelectItem>
            <SelectItem value="cancelled">בוטל</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <p className="text-center py-12">טוען…</p>
      ) : filtered.length === 0 ? (
        <p className="text-center py-12">אין פרויקטים.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((p) => (
            <Card key={p.id} className="flex flex-col justify-between">
              <CardHeader>
                <h2 className="text-xl font-semibold">{p.name}</h2>
                <p className="text-sm text-muted-foreground">
                  {p.client?.name ?? "—"}
                </p>
              </CardHeader>
              <CardContent className="flex-1 space-y-1">
                <p>
                  <strong>סטטוס:</strong> {p.status}
                </p>
                <p>
                  <strong>סוג:</strong> {p.type}
                </p>
              </CardContent>
              <div className="p-4 pt-0">
                <Link href={`/dashboard/projects/${p.id}`}>
                  <Button variant="outline" className="w-full">
                    פתח כרטיסיה
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
