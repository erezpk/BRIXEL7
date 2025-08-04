import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, Projector, Calendar, User, Building } from "lucide-react";
import { type Project, type Client, type User as UserType } from "@shared/schema";
import { format } from "date-fns";
import { he } from "date-fns/locale";

interface ProjectWithRelations extends Project {
  client?: Client;
  assignedUser?: UserType;
  createdBy?: UserType;
}

export default function Projects() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: projects, isLoading } = useQuery<ProjectWithRelations[]>({
    queryKey: ['/api/projects'],
    staleTime: 30000, // 30 seconds
  });

  const filteredProjects = projects?.filter(project => {
    const matchesSearch = !searchQuery || 
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.client?.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || project.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning':
        return 'bg-blue-100 text-blue-800';
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
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
      case 'active':
        return 'פעיל';
      case 'completed':
        return 'הושלם';
      case 'cancelled':
        return 'בוטל';
      default:
        return status;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low':
        return 'bg-blue-100 text-blue-800';
      case 'medium':
        return 'bg-gray-100 text-gray-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'urgent':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'low':
        return 'נמוך';
      case 'medium':
        return 'בינוני';
      case 'high':
        return 'גבוה';
      case 'urgent':
        return 'דחוף';
      default:
        return priority;
    }
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
            עקבו אחר כל הפרויקטים שלכם במקום אחד
          </p>
        </div>
        <Button 
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
            <SelectItem value="active">פעיל</SelectItem>
            <SelectItem value="completed">הושלם</SelectItem>
            <SelectItem value="cancelled">בוטל</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Projects Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <Skeleton className="h-6 w-32 mb-2" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-2 w-full" />
                  </div>
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !filteredProjects || filteredProjects.length === 0 ? (
        <div className="text-center py-12" data-testid="no-projects">
          <Projector className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {searchQuery || statusFilter !== "all" ? "לא נמצאו פרויקטים" : "אין פרויקטים עדיין"}
          </h3>
          <p className="text-gray-600 mb-6">
            {searchQuery || statusFilter !== "all" 
              ? "נסה לשנות את החיפוש או הסינון"
              : "התחל על ידי יצירת הפרויקט הראשון שלך"
            }
          </p>
          {!searchQuery && statusFilter === "all" && (
            <Button data-testid="button-add-first-project">
              <Plus className="h-4 w-4 ml-2" />
              הוסף פרויקט ראשון
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <Card key={project.id} className="card-hover" data-testid={`project-card-${project.id}`}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-semibold text-gray-900 mb-1" data-testid="project-name">
                      {project.name}
                    </CardTitle>
                    {project.client && (
                      <p className="text-sm text-gray-600" data-testid="project-client">
                        {project.client.name}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center space-x-reverse space-x-2">
                    <Badge className={getStatusColor(project.status)} data-testid="project-status">
                      {getStatusText(project.status)}
                    </Badge>
                    {project.priority !== 'medium' && (
                      <Badge className={getPriorityColor(project.priority)} data-testid="project-priority">
                        {getPriorityText(project.priority)}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {project.description && (
                  <p className="text-sm text-gray-600 mb-4" data-testid="project-description">
                    {project.description}
                  </p>
                )}
                
                {/* Progress - placeholder for now */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>התקדמות</span>
                    <span data-testid="project-progress">
                      {project.status === 'completed' ? '100%' :
                       project.status === 'active' ? '60%' :
                       project.status === 'planning' ? '10%' : '0%'}
                    </span>
                  </div>
                  <Progress 
                    value={
                      project.status === 'completed' ? 100 :
                      project.status === 'active' ? 60 :
                      project.status === 'planning' ? 10 : 0
                    } 
                    className="h-2" 
                  />
                </div>

                <div className="space-y-2 text-sm text-gray-600">
                  {project.assignedUser && (
                    <div className="flex items-center space-x-reverse space-x-1">
                      <User className="h-4 w-4" />
                      <span data-testid="project-assigned-user">{project.assignedUser.fullName}</span>
                    </div>
                  )}
                  
                  {project.budget && (
                    <div className="flex justify-between">
                      <span>תקציב:</span>
                      <span data-testid="project-budget">₪{(project.budget / 100).toLocaleString()}</span>
                    </div>
                  )}
                  
                  {project.endDate && (
                    <div className="flex items-center justify-between">
                      <span>תאריך סיום:</span>
                      <span data-testid="project-end-date">
                        {format(new Date(project.endDate), 'dd/MM/yyyy', { locale: he })}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
