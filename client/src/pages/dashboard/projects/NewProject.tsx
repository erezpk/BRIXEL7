// client/src/pages/dashboard/projects/NewProject.tsx
import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
      Select,
      SelectTrigger,
      SelectContent,
      SelectItem,
} from "@/components/ui/select";
import { type Client } from "@shared/schema";

const projectTypes = [
      { value: "web", label: "בניית אתרים" },
      { value: "marketing", label: "שיווק" },
      { value: "video", label: "סרטונים" },
];

export default function NewProject() {
      const [name, setName] = useState("");
      const [clientId, setClient] = useState("");
      const [type, setType] = useState("web");
      const [, setLoc] = useLocation();
      const qc = useQueryClient();

      const { data: clients = [] } = useQuery<Client[]>({
            queryKey: ["clients"],
            queryFn: () => fetch("/api/clients").then((r) => r.json()),
      });

      const create = useMutation({
            mutationFn: (body: {
                  name: string;
                  clientId: string;
                  type: string;
            }) =>
                  fetch("/api/projects", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(body),
                  }).then((r) => r.json()),
            onSuccess: (proj) => {
                  qc.invalidateQueries(["projects"]);
                  setLoc(`/dashboard/projects/${proj.id}`);
            },
      });

      const disabled = !name || !clientId || create.isLoading;
      return (
            <Card className="max-w-md mx-auto p-6 space-y-4">
                  <CardHeader>
                        <h2 className="text-xl font-semibold">
                              צור פרויקט חדש
                        </h2>
                  </CardHeader>
                  <CardContent className="space-y-4">
                        <Input
                              placeholder="שם פרויקט"
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                        />
                        <Select value={clientId} onValueChange={setClient}>
                              <SelectTrigger placeholder="בחר לקוח" />
                              <SelectContent>
                                    {clients.map((c) => (
                                          <SelectItem key={c.id} value={c.id}>
                                                {c.name}
                                          </SelectItem>
                                    ))}
                              </SelectContent>
                        </Select>
                        <Select value={type} onValueChange={setType}>
                              <SelectTrigger placeholder="סוג פרויקט" />
                              <SelectContent>
                                    {projectTypes.map((pt) => (
                                          <SelectItem
                                                key={pt.value}
                                                value={pt.value}
                                          >
                                                {pt.label}
                                          </SelectItem>
                                    ))}
                              </SelectContent>
                        </Select>
                        <Button
                              onClick={() =>
                                    create.mutate({ name, clientId, type })
                              }
                              disabled={disabled}
                        >
                              {create.isLoading ? "יוצר..." : "צור"}
                        </Button>
                  </CardContent>
            </Card>
      );
}
