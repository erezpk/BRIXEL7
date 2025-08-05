import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Calendar, 
  MessageSquare,
  Download,
  Eye
} from 'lucide-react';
import { type Project, type Task, type DigitalAsset } from '@shared/schema';

export default function ClientDashboard() {
  // Mock client ID - in real app, get from auth context
  const clientId = "client-123";

  const { data: clientProjects = [] } = useQuery<Project[]>({
    queryKey: ['/api/client/projects', clientId],
  });

  const { data: clientTasks = [] } = useQuery<Task[]>({
    queryKey: ['/api/client/tasks', clientId],
  });

  const { data: clientAssets = [] } = useQuery<DigitalAsset[]>({
    queryKey: ['/api/client/assets', clientId],
  });

  const getProjectProgress = (project: Project) => {
    const projectTasks = clientTasks.filter(task => task.projectId === project.id);
    if (projectTasks.length === 0) return 0;
    
    const completedTasks = projectTasks.filter(task => task.status === 'completed');
    return Math.round((completedTasks.length / projectTasks.length) * 100);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'planning': { label: 'תכנון', color: 'bg-blue-100 text-blue-800' },
      'in_progress': { label: 'בתהליך', color: 'bg-yellow-100 text-yellow-800' },
      'review': { label: 'בבדיקה', color: 'bg-orange-100 text-orange-800' },
      'completed': { label: 'הושלם', color: 'bg-green-100 text-green-800' },
      'on_hold': { label: 'מושהה', color: 'bg-gray-100 text-gray-800' },
    }[status] || { label: status, color: 'bg-gray-100 text-gray-800' };

    return (
      <Badge className={statusConfig.color} variant="secondary">
        {statusConfig.label}
      </Badge>
    );
  };

  const getTaskStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'review':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="container mx-auto p-6" dir="rtl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-right mb-2">לוח הבקרה שלך</h1>
        <p className="text-muted-foreground text-right">עקוב אחר התקדמות הפרויקטים שלך</p>
      </div>

      {/* Project Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {clientProjects.map((project) => {
          const progress = getProjectProgress(project);
          const projectTasks = clientTasks.filter(task => task.projectId === project.id);
          const completedTasks = projectTasks.filter(task => task.status === 'completed').length;

          return (
            <Card key={project.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start mb-2">
                  <CardTitle className="text-lg font-semibold text-right flex-1">
                    {project.name}
                  </CardTitle>
                  {getStatusBadge(project.status)}
                </div>
                <p className="text-sm text-muted-foreground text-right line-clamp-2">
                  {project.description}
                </p>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">התקדמות</span>
                    <span className="font-medium">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>

                {/* Task Summary */}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">משימות</span>
                  <span className="font-medium">
                    {completedTasks} מתוך {projectTasks.length}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button size="sm" variant="outline" className="flex-1">
                    <Eye className="h-4 w-4 ml-1" />
                    פרטים
                  </Button>
                  <Button size="sm" variant="outline">
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Tabs defaultValue="tasks" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="tasks">משימות אחרונות</TabsTrigger>
          <TabsTrigger value="assets">נכסים דיגיטליים</TabsTrigger>
          <TabsTrigger value="files">קבצים</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-right">משימות בפרויקטים שלך</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {clientTasks.slice(0, 10).map((task) => {
                  const project = clientProjects.find(p => p.id === task.projectId);
                  
                  return (
                    <div key={task.id} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex-shrink-0">
                        {getTaskStatusIcon(task.status)}
                      </div>
                      
                      <div className="flex-1 text-right">
                        <h4 className="font-medium">{task.title}</h4>
                        {project && (
                          <p className="text-sm text-muted-foreground">
                            פרויקט: {project.name}
                          </p>
                        )}
                        {task.dueDate && (
                          <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>יעד: {new Date(task.dueDate).toLocaleDateString('he-IL')}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex-shrink-0">
                        {getStatusBadge(task.status)}
                      </div>
                    </div>
                  );
                })}

                {clientTasks.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>אין משימות פעילות כרגע</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-right">הנכסים הדיגיטליים שלך</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {clientAssets.map((asset) => (
                  <div key={asset.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-right">{asset.name}</h4>
                      <Badge variant="outline">{asset.type}</Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-2">{asset.value}</p>
                    
                    {asset.expiryDate && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>פוגה: {new Date(asset.expiryDate).toLocaleDateString('he-IL')}</span>
                      </div>
                    )}
                  </div>
                ))}

                {clientAssets.length === 0 && (
                  <div className="col-span-full text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>אין נכסים דיגיטליים רשומים</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="files" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-right">קבצים והחזקות</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Mock files - in real app, fetch from backend */}
                {[
                  { name: "תיק עיצוב לוגו - גרסה סופית.zip", size: "2.4 MB", date: "2024-01-15" },
                  { name: "מסמכי פרויקט אתר.pdf", size: "847 KB", date: "2024-01-12" },
                  { name: "הצעת מחיר עדכנית.pdf", size: "245 KB", date: "2024-01-10" }
                ].map((file, index) => (
                  <div key={index} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50">
                    <FileText className="h-8 w-8 text-blue-600 flex-shrink-0" />
                    
                    <div className="flex-1 text-right">
                      <h4 className="font-medium">{file.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {file.size} • {new Date(file.date).toLocaleDateString('he-IL')}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}

                <div className="text-center py-4">
                  <Button variant="outline">
                    <FileText className="h-4 w-4 ml-2" />
                    טען קבצים נוספים
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}