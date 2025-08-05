import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import NewProjectModal from "@/components/modals/new-project-modal";
import { Plus, Search, Folder, Eye } from "lucide-react";
import { type Project, type Client } from "@shared/schema";
import { useLocation } from "wouter";

export default function Projects() {
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [, navigate] = useLocation();

  const { data: projects, isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
    staleTime: 30000,
  });

  const { data: clients } = useQuery<Client[]>({
    queryKey: ['/api/clients'],
    staleTime: 30000,
  });

  const filteredProjects = projects?.filter(project => {
    const matchesSearch = !searchQuery || 
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || project.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'on_hold':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'planning':
        return 'תכנון';
      case 'in_progress':
        return 'בביצוע';
      case 'completed':
        return 'הושלם';
      case 'on_hold':
        return 'בהמתנה';
      case 'cancelled':
        return 'בוטל';
      default:
        return status;
    }
  };

  const getClientName = (clientId: string | null) => {
    if (!clientId) return 'ללא לקוח';
    const client = clients?.find(c => c.id === clientId);
    return client?.name || 'לקוח לא נמצא';
  };

  const handleViewProject = (projectId: string) => {
    navigate(`/dashboard/projects/${projectId}`);
  };

  return (
    <div className="space-y-6" data-testid="projects-page">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 font-rubik" data-testid="projects-title">
            ניהול פרויקטים
          </h1>
          <p className="text-gray-600 mt-1">
            נהלו את כל הפרויקטים שלכם במקום אחד
          </p>
        </div>
        <Button 
          onClick={() => setShowNewProjectModal(true)}
          className="flex items-center space-x-reverse space-x-2"
          data-testid="button-new-project"
        >
          <Plus className="h-4 w-4" />
          <span>פרויקט חדש</span>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="חיפוש פרויקטים..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10 text-right"
            data-testid="search-projects"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48" data-testid="filter-status">
            <SelectValue placeholder="סינון לפי סטטוס" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">כל הסטטוסים</SelectItem>
            <SelectItem value="planning">תכנון</SelectItem>
            <SelectItem value="in_progress">בביצוע</SelectItem>
            <SelectItem value="completed">הושלם</SelectItem>
            <SelectItem value="on_hold">בהמתנה</SelectItem>
            <SelectItem value="cancelled">בוטל</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Projects Grid */}
      {projectsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <Skeleton className="h-6 w-32 mb-2" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
              <Skeleton className="h-8 w-full" />
            </div>
          ))}
        </div>
      ) : !filteredProjects || filteredProjects.length === 0 ? (
        <div className="text-center py-12" data-testid="no-projects">
          <Folder className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {searchQuery || statusFilter !== "all" ? "לא נמצאו פרויקטים" : "אין פרויקטים עדיין"}
          </h3>
          <p className="text-gray-600 mb-6">
            {searchQuery || statusFilter !== "all" 
              ? "נסה לשנות את החיפוש או הסינון"
              : "התחל על ידי הוספת הפרויקט הראשון שלך"
            }
          </p>
          {!searchQuery && statusFilter === "all" && (
            <Button onClick={() => setShowNewProjectModal(true)} data-testid="button-add-first-project">
              <Plus className="h-4 w-4 ml-2" />
              הוסף פרויקט ראשון
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <Card key={project.id} className="card-hover" data-testid={`project-card-${project.id}`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1" data-testid="project-name">
                      {project.name}
                    </h3>
                    {project.type && (
                      <p className="text-sm text-gray-600 mb-2" data-testid="project-type">
                        {project.type}
                      </p>
                    )}
                    {project.description && (
                      <p className="text-sm text-gray-600 line-clamp-2" data-testid="project-description">
                        {project.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center space-x-reverse space-x-2">
                    <Badge className={getStatusColor(project.status)} data-testid="project-status">
                      {getStatusText(project.status)}
                    </Badge>
                  </div>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">לקוח:</span>
                    <span className="text-gray-900" data-testid="project-client">
                      {getClientName(project.clientId)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">נוצר:</span>
                    <span className="text-gray-900" data-testid="project-created">
                      {new Date(project.createdAt).toLocaleDateString('he-IL')}
                    </span>
                  </div>
                </div>
                
                <div className="flex space-x-reverse space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleViewProject(project.id)}
                    data-testid="project-view-details"
                  >
                    <Eye className="h-4 w-4 ml-2" />
                    צפה בפרויקט
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* New Project Modal */}
      <NewProjectModal
        isOpen={showNewProjectModal}
        onClose={() => setShowNewProjectModal(false)}
      />
    </div>
  );
}