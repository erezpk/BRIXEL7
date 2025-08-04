import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectContent, SelectItem } from "@/components/ui/select";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Plus, Projector } from "lucide-react";
import { type Project, type Client } from "@shared/schema";

interface ProjectWithRelations extends Omit<Project, "createdBy"> {
  client?: Client;
  status: string;
  type: "web" | "marketing" | "video";
}

export default function Projects() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [selectedClientId, setSelectedClientId] = useState("");
  const [projectType, setProjectType] = useState<"web" | "marketing" | "video">("web");
  const queryClient = useQueryClient();

  const { data: projects = [], isLoading } = useQuery<ProjectWithRelations[]>({
    queryKey: ["/api/projects"],
    queryFn: () => fetch("/api/projects").then(res => res.json()),
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
    queryFn: () => fetch("/api/clients").then(res => res.json()),
  });

  const createProject = useMutation<ProjectWithRelations, Error, {
    name: string;
    clientId: string;
    type: string;
  }>({
    mutationFn: payload =>
      fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).then(res => {
        if (!res.ok) throw new Error("Failed to create project");
        return res.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
    },
  });

  const isCreating = createProject.status === "loading";

  const filtered = projects.filter(p => {
    const bySearch = !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const byStatus = statusFilter === "all" || p.status === statusFilter;
    return bySearch && byStatus;
  });

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <div className="flex justify-between items-center mb-6" data-testid="projects-page">
        <h1 className="text-3xl font-bold">ניהול פרויקטים</h1>
        <DialogTrigger asChild>
          <Button disabled={isCreating} data-testid="button-new-project">
            <Plus className="h-4 w-4" />
            {isCreating ? "יוצר..." : "פרויקט חדש"}
          </Button>
        </DialogTrigger>
      </div>

      <div className="flex gap-4 mb-6">
        <Input
          placeholder="חיפוש..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="flex-1"
        />
        <Select value={statusFilter} onValueChange={v => setStatusFilter(v)}>
          <SelectTrigger>סטטוס</SelectTrigger>
          <SelectContent>
            <SelectItem value="all">הכל</SelectItem>
            <SelectItem value="planning">תכנון</SelectItem>
            <SelectItem value="active">פעיל</SelectItem>
            <SelectItem value="completed">הושלם</SelectItem>
            <SelectItem value="cancelled">בוטל</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <p>טוען פרויקטים…</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <Projector className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <p className="mb-4">
            {searchQuery || statusFilter !== "all"
              ? "לא נמצאו פרויקטים"
              : "אין פרויקטים עדיין"}
          </p>
          <DialogTrigger asChild>
            <Button disabled={isCreating} data-testid="button-add-first-project">
              <Plus className="h-4 w-4" />
              {isCreating ? "יוצר..." : "הוסף פרויקט ראשון"}
            </Button>
          </DialogTrigger>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(p => (
            <Card key={p.id} data-testid={`project-card-${p.id}`}>
              <CardHeader>{p.name}</CardHeader>
              <CardContent>
                {p.client && <p>לקוח: {p.client.name}</p>}
                <p>סטטוס: {p.status}</p>
                <p>
                  סוג פרויקט:{" "}
                  {p.type === "web"
                    ? "בניית אתרים"
                    : p.type === "marketing"
                    ? "פרויקט שיווק"
                    : "פרויקט סרטונים"}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <DialogContent>
        <DialogHeader>
          <DialogTitle>צור פרויקט חדש</DialogTitle>
        </DialogHeader>
        <Input
          placeholder="שם הפרויקט"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          className="w-full mb-4"
        />
        <Select onValueChange={v => setSelectedClientId(v)}>
          <SelectTrigger className="mb-4">בחר לקוח</SelectTrigger>
          <SelectContent>
            {clients.map(c => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select onValueChange={v => setProjectType(v as "web" | "marketing" | "video")}>
          <SelectTrigger className="mb-4">סוג פרויקט</SelectTrigger>
          <SelectContent>
            <SelectItem value="web">בניית אתרים</SelectItem>
            <SelectItem value="marketing">פרויקט שיווק</SelectItem>
            <SelectItem value="video">פרויקט סרטונים</SelectItem>
          </SelectContent>
        </Select>
        <DialogFooter className="flex justify-end space-x-2">
          <Button variant="secondary" onClick={() => setIsDialogOpen(false)}>
            ביטול
          </Button>
          <Button
            onClick={() => {
              mutate({ name: newName, clientId: selectedClientId, type: projectType });
              setNewName("");
              setSelectedClientId("");
              setProjectType("web");
              setIsDialogOpen(false);
            }}
            disabled={isCreating || !newName || !selectedClientId}
          >
            אישור
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
