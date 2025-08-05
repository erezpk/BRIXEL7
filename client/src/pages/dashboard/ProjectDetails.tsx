import React, { useState } from 'react';
import { useParams } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Clock,
  DollarSign,
  User,
  Edit,
  Trash2,
  CheckSquare,
  Globe,
  Eye,
  Calendar,
  FileText,
  Plus
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { type Client, type Project, type Task, type DigitalAsset } from '@shared/schema';

export default function ProjectDetails() {
  const { projectId } = useParams();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [showEditModal, setShowEditModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showAssetModal, setShowAssetModal] = useState(false);

  const [editData, setEditData] = useState({
    name: "",
    description: "",
    type: "",
    status: "",
    clientId: "",
  });

  const [taskData, setTaskData] = useState({
    title: "",
    description: "",
    priority: "medium" as const,
    dueDate: "",
  });

  const [assetData, setAssetData] = useState({
    name: "",
    type: "domain" as const,
    value: "",
    expiryDate: "",
    notes: "",
  });

  // Fetch project data
  const { data: project, isLoading: projectLoading } = useQuery<Project & { client?: Client }>({
    queryKey: [`/api/projects/${projectId}`],
    enabled: !!projectId,
  });

  // Fetch project tasks
  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: [`/api/projects/${projectId}/tasks`],
    enabled: !!projectId,
  });

  // Fetch project assets
  const { data: assets = [] } = useQuery<DigitalAsset[]>({
    queryKey: [`/api/projects/${projectId}/assets`],
    enabled: !!projectId,
  });

  // Fetch clients for edit modal
  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ['/api/clients'],
  });

  // Update project mutation
  const updateProjectMutation = useMutation({
    mutationFn: async (data: Partial<Project>) => {
      const response = await apiRequest('PUT', `/api/projects/${projectId}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}`] });
      setShowEditModal(false);
      toast({
        title: "פרויקט עודכן בהצלחה",
        description: "השינויים נשמרו במערכת",
      });
    },
    onError: (error: any) => {
      toast({
        title: "שגיאה בעדכון פרויקט",
        description: error?.message || "אירעה שגיאה לא צפויה",
        variant: "destructive",
      });
    },
  });

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/tasks', {
        ...data,
        projectId,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/tasks`] });
      setShowTaskModal(false);
      resetTaskForm();
      toast({
        title: "משימה נוספה בהצלחה",
        description: "המשימה החדשה נוספה לפרויקט",
      });
    },
  });

  // Create asset mutation
  const createAssetMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/assets', {
        ...data,
        projectId,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/assets`] });
      setShowAssetModal(false);
      resetAssetForm();
      toast({
        title: "נכס נוסף בהצלחה",
        description: "הנכס החדש נוסף לפרויקט",
      });
    },
  });

  const openEditModal = () => {
    if (project) {
      setEditData({
        name: project.name || "",
        description: project.description || "",
        type: project.type || "",
        status: project.status || "",
        clientId: project.clientId || "",
      });
      setShowEditModal(true);
    }
  };

  const resetTaskForm = () => {
    setTaskData({
      title: "",
      description: "",
      priority: "medium",
      dueDate: "",
    });
  };

  const resetAssetForm = () => {
    setAssetData({
      name: "",
      type: "domain",
      value: "",
      expiryDate: "",
      notes: "",
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProjectMutation.mutate(editData);
  };

  const handleTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createTaskMutation.mutate(taskData);
  };

  const handleAssetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createAssetMutation.mutate(assetData);
  };

  if (projectLoading) {
    return <div className="container mx-auto p-6">טוען פרויקט...</div>;
  }

  if (!project) {
    return <div className="container mx-auto p-6">פרויקט לא נמצא</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex justify-between items-start">
        <div className="text-right">
          <h1 className="text-3xl font-bold">{project.name}</h1>
          <p className="text-muted-foreground mt-2">{project.description}</p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="default" 
            size="sm" 
            onClick={openEditModal}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-sm transition-all duration-200 hover:shadow-md"
          >
            <Edit className="h-4 w-4 ml-2" />
            עריכה
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              // עבור לעמוד פרטי הלקוח
              window.location.href = `/dashboard/clients/${project.clientId}`;
            }}
            className="border-blue-500 text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg shadow-sm transition-all duration-200 hover:shadow-md"
          >
            <User className="h-4 w-4 ml-2" />
            צפה בפרטי הלקוח
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              if (confirm('האם אתה בטוח שברצונך למחוק את הפרויקט? פעולה זו לא ניתנת לביטול.')) {
                // כאן נוסיף פונקציה למחיקת פרויקט
                toast({
                  title: "מחיקת פרויקט",
                  description: "הפרויקט נמחק בהצלחה",
                });
              }
            }}
            className="border-red-500 text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg shadow-sm transition-all duration-200 hover:shadow-md"
          >
            <Trash2 className="h-4 w-4 ml-2" />
            מחיקה
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">סטטוס</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Badge variant="secondary">{project.status}</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">לקוח</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{project.client?.name || "ללא לקוח"}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">משימות</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{tasks.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">נכסים</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{assets.length}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">סקירה כללית</TabsTrigger>
          <TabsTrigger value="tasks">משימות</TabsTrigger>
          <TabsTrigger value="files">קבצים</TabsTrigger>
          <TabsTrigger value="communication">תקשורת</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-right">פרטי הפרויקט</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span>סוג פרויקט:</span>
                  <span>{project.type || "לא הוגדר"}</span>
                </div>
                <div className="flex justify-between">
                  <span>תאריך יצירה:</span>
                  <span>{new Date(project.createdAt).toLocaleDateString('he-IL')}</span>
                </div>
                <div className="flex justify-between">
                  <span>סטטוס:</span>
                  <Badge variant="secondary">{project.status}</Badge>
                </div>
                {project.client && (
                  <div className="flex justify-between">
                    <span>לקוח:</span>
                    <span>{project.client.name}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-right">סטטיסטיקות</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span>משימות פעילות:</span>
                  <span>{tasks.filter(t => t.status !== 'completed').length}</span>
                </div>
                <div className="flex justify-between">
                  <span>משימות הושלמו:</span>
                  <span>{tasks.filter(t => t.status === 'completed').length}</span>
                </div>
                <div className="flex justify-between">
                  <span>נכסים:</span>
                  <span>{assets.length}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Leads Section */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="text-right">
                <CardTitle className="text-right">לידים שנכנסו</CardTitle>
                <CardDescription className="text-right">כל הלידים שנכנסו למערכת</CardDescription>
              </div>
              <div className="flex gap-2">
                <select className="px-3 py-1 border rounded-md text-sm">
                  <option value="all">כל התקופות</option>
                  <option value="today">היום</option>
                  <option value="week">השבוע</option>
                  <option value="month">החודש</option>
                  <option value="quarter">הרבעון</option>
                  <option value="year">השנה</option>
                </select>
                <input
                  type="date"
                  className="px-3 py-1 border rounded-md text-sm"
                  placeholder="מתאריך"
                />
                <input
                  type="date"
                  className="px-3 py-1 border rounded-md text-sm"
                  placeholder="עד תאריך"
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Mock leads data - in real app this would come from API */}
                {[
                  { id: '1', name: 'דוד כהן', email: 'david@example.com', phone: '050-1234567', status: 'qualified', value: 15000, createdAt: '2024-01-15' },
                  { id: '2', name: 'רחל לוי', email: 'rachel@example.com', phone: '052-7654321', status: 'proposal', value: 8000, createdAt: '2024-01-10' },
                  { id: '3', name: 'משה יוסף', email: 'moshe@example.com', phone: '053-9876543', status: 'new', value: 12000, createdAt: '2024-01-08' },
                  { id: '4', name: 'שרה אברהם', email: 'sara@example.com', phone: '054-1122334', status: 'contacted', value: 9500, createdAt: '2024-01-05' }
                ].map((lead) => (
                  <div key={lead.id} className="bg-gray-50 p-4 rounded-lg flex justify-between items-center">
                    <div className="text-right">
                      <p className="font-medium">{lead.name}</p>
                      <p className="text-sm text-gray-500">{lead.email}</p>
                      <p className="text-sm text-gray-500">{lead.phone}</p>
                      <p className="text-xs text-gray-400">נכנס ב: {new Date(lead.createdAt).toLocaleDateString('he-IL')}</p>
                    </div>
                    <div className="text-left">
                      <Badge variant={lead.status === 'qualified' ? 'default' : lead.status === 'proposal' ? 'secondary' : lead.status === 'contacted' ? 'outline' : 'destructive'}>
                        {lead.status === 'qualified' ? 'מוכשר' : 
                         lead.status === 'proposal' ? 'הצעה' : 
                         lead.status === 'contacted' ? 'נוצר קשר' :
                         lead.status === 'new' ? 'חדש' : lead.status}
                      </Badge>
                      <p className="text-sm font-medium mt-1">₪{lead.value.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
                
                {/* Summary stats */}
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="text-lg font-bold text-blue-600">4</div>
                      <div className="text-sm text-gray-600">סה"כ לידים</div>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg">
                      <div className="text-lg font-bold text-green-600">₪44,500</div>
                      <div className="text-sm text-gray-600">ערך כולל</div>
                    </div>
                    <div className="bg-purple-50 p-3 rounded-lg">
                      <div className="text-lg font-bold text-purple-600">₪11,125</div>
                      <div className="text-sm text-gray-600">ערך ממוצע</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          <Card>
            <CardHeader className="flex justify-between items-center">
              <div className="text-right">
                <CardTitle>משימות פרויקט</CardTitle>
                <CardDescription>רשימת המשימות הפתוחות והמושלמות</CardDescription>
              </div>
              <Button 
                onClick={() => setShowTaskModal(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow-sm transition-all duration-200 hover:shadow-md"
              >
                <Plus className="h-4 w-4 ml-2" />
                הוסף משימה
              </Button>
            </CardHeader>
            <CardContent>
              {tasks.length > 0 ? (
                <div className="space-y-4">
                  {tasks.map((task) => (
                    <div key={task.id} className="flex justify-between items-center p-3 border rounded-md">
                      <div>
                        <h4 className="font-medium">{task.title}</h4>
                        <p className="text-sm text-muted-foreground">{task.description}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <Calendar className="h-3 w-3" />
                          <span>{task.dueDate ? new Date(task.dueDate).toLocaleDateString('he-IL') : 'ללא תאריך'}</span>
                          <Badge variant={task.priority === 'high' ? 'destructive' : task.priority === 'medium' ? 'outline' : 'secondary'}>{task.priority}</Badge>
                        </div>
                      </div>
                      <Badge variant={task.status === 'completed' ? 'default' : 'outline'}>{task.status}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground">אין משימות להצגה</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="files" className="space-y-4">
          <Card>
            <CardHeader className="flex justify-between items-center">
              <div className="text-right">
                <CardTitle>קבצי הפרויקט</CardTitle>
                <CardDescription>מסמכים וקבצים הקשורים לפרויקט</CardDescription>
              </div>
              <Button 
                onClick={() => setShowAssetModal(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg shadow-sm transition-all duration-200 hover:shadow-md"
              >
                <Plus className="h-4 w-4 ml-2" />
                הוסף נכס
              </Button>
            </CardHeader>
            <CardContent>
              {assets.length > 0 ? (
                <div className="space-y-4">
                  {assets.map((asset) => (
                    <div key={asset.id} className="flex justify-between items-center p-3 border rounded-md">
                      <div>
                        <h4 className="font-medium">{asset.name}</h4>
                        <p className="text-sm text-muted-foreground">סוג: {asset.type}</p>
                        <p className="text-sm text-muted-foreground">ספק: {asset.provider}</p>
                        {asset.renewalDate && <p className="text-sm text-muted-foreground">תפוגה: {new Date(asset.renewalDate).toLocaleDateString('he-IL')}</p>}
                        {asset.notes && <p className="text-sm text-muted-foreground">הערות: {asset.notes}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground">אין קבצים להצגה</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="communication" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-right">תקשורת עם הלקוח</CardTitle>
              <CardDescription className="text-right">
                הודעות ותכתובות
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground">אין הודעות להצגה</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Project Modal */}
      {showEditModal && project && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">עריכת פרויקט</h2>
              <Button variant="ghost" onClick={() => setShowEditModal(false)}>X</Button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium">שם הפרויקט</label>
                  <input
                    type="text"
                    value={editData.name}
                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">תיאור</label>
                  <textarea
                    value={editData.description}
                    onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">סטטוס</label>
                  <select
                    value={editData.status}
                    onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    required
                  >
                    <option value="">בחר סטטוס</option>
                    <option value="בתהליך">בתהליך</option>
                    <option value="הושלם">הושלם</option>
                    <option value="בהמתנה">בהמתנה</option>
                    <option value="בוטל">בוטל</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium">סוג פרויקט</label>
                  <input
                    type="text"
                    value={editData.type}
                    onChange={(e) => setEditData({ ...editData, type: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">לקוח</label>
                  <select
                    value={editData.clientId}
                    onChange={(e) => setEditData({ ...editData, clientId: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  >
                    <option value="">בחר לקוח</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setShowEditModal(false)}
                  className="px-6 py-2 rounded-lg border-gray-300 hover:bg-gray-50 transition-all duration-200"
                >
                  ביטול
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateProjectMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg shadow-sm transition-all duration-200 hover:shadow-md disabled:opacity-50"
                >
                  {updateProjectMutation.isPending ? "שומר..." : "שמור שינויים"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">הוספת משימה חדשה</h2>
              <Button variant="ghost" onClick={() => setShowTaskModal(false)}>X</Button>
            </div>
            <form onSubmit={handleTaskSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium">כותרת משימה</label>
                  <input
                    type="text"
                    value={taskData.title}
                    onChange={(e) => setTaskData({ ...taskData, title: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">תיאור</label>
                  <textarea
                    value={taskData.description}
                    onChange={(e) => setTaskData({ ...taskData, description: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">עדיפות</label>
                  <select
                    value={taskData.priority}
                    onChange={(e) => setTaskData({ ...taskData, priority: e.target.value as any })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  >
                    <option value="low">נמוכה</option>
                    <option value="medium">בינונית</option>
                    <option value="high">גבוהה</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium">תאריך יעד</label>
                  <input
                    type="date"
                    value={taskData.dueDate}
                    onChange={(e) => setTaskData({ ...taskData, dueDate: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    required
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setShowTaskModal(false)}
                  className="px-6 py-2 rounded-lg border-gray-300 hover:bg-gray-50 transition-all duration-200"
                >
                  ביטול
                </Button>
                <Button 
                  type="submit" 
                  disabled={createTaskMutation.isPending}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg shadow-sm transition-all duration-200 hover:shadow-md disabled:opacity-50"
                >
                  {createTaskMutation.isPending ? "מוסיף..." : "הוסף משימה"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Asset Modal */}
      {showAssetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">הוספת נכס חדש</h2>
              <Button variant="ghost" onClick={() => setShowAssetModal(false)}>X</Button>
            </div>
            <form onSubmit={handleAssetSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium">שם הנכס</label>
                  <input
                    type="text"
                    value={assetData.name}
                    onChange={(e) => setAssetData({ ...assetData, name: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">סוג נכס</label>
                  <select
                    value={assetData.type}
                    onChange={(e) => setAssetData({ ...assetData, type: e.target.value as any })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  >
                    <option value="domain">דומיין</option>
                    <option value="server">שרת</option>
                    <option value="storage">אחסון</option>
                    <option value="other">אחר</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium">ערך (למשל, כתובת)</label>
                  <input
                    type="text"
                    value={assetData.value}
                    onChange={(e) => setAssetData({ ...assetData, value: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">תאריך תפוגה</label>
                  <input
                    type="date"
                    value={assetData.expiryDate}
                    onChange={(e) => setAssetData({ ...assetData, expiryDate: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">הערות</label>
                  <textarea
                    value={assetData.notes}
                    onChange={(e) => setAssetData({ ...assetData, notes: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    rows={3}
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setShowAssetModal(false)}
                  className="px-6 py-2 rounded-lg border-gray-300 hover:bg-gray-50 transition-all duration-200"
                >
                  ביטול
                </Button>
                <Button 
                  type="submit" 
                  disabled={createAssetMutation.isPending}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg shadow-sm transition-all duration-200 hover:shadow-md disabled:opacity-50"
                >
                  {createAssetMutation.isPending ? "מוסיף..." : "הוסף נכס"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}