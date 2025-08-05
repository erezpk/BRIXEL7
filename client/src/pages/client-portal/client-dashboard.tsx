import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Calendar, 
  MessageSquare,
  Download,
  Eye,
  User,
  LogOut,
  Bell,
  Settings,
  Home,
  FolderOpen,
  Activity,
  Send,
  Plus,
  Edit,
  Trash2,
  Phone,
  Mail,
  Building,
  DollarSign,
  Users,
  TrendingUp,
  ArrowRight
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  progress?: number;
  clientId?: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  dueDate: string;
  projectId: string;
}

interface DigitalAsset {
  id: string;
  name: string;
  type: string;
  value: string;
  expiryDate?: string;
  projectId: string;
}

interface ClientMessage {
  id: string;
  content: string;
  timestamp: string;
  isFromClient: boolean;
  projectId?: string;
}

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  source: string;
  status: string;
  value: number;
  notes: string;
}

interface Client {
  id: string;
  name: string;
  contactName: string;
  email: string;
  phone: string;
  industry: string;
  status: string;
  projectsCount: number;
}

export default function ClientDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const { user } = useAuth();
  
  // Check if this is an agency admin viewing a client's dashboard
  const isAgencyAdmin = user?.role === 'agency_admin' || user?.role === 'team_member';
  const urlParams = new URLSearchParams(window.location.search);
  const viewingClientId = urlParams.get('clientId');
  
  // If agency admin is viewing a specific client's dashboard, use that client ID
  const effectiveClientId = isAgencyAdmin && viewingClientId ? viewingClientId : user?.id;
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  
  const [leadForm, setLeadForm] = useState({
    name: '',
    email: '',
    phone: '',
    source: 'website',
    status: 'new',
    value: 0,
    notes: ''
  });

  const [clientForm, setClientForm] = useState({
    name: '',
    contactName: '',
    email: '',
    phone: '',
    industry: '',
    status: 'active'
  });

  const [messageForm, setMessageForm] = useState({
    content: '',
    projectId: ''
  });

  const [profileData, setProfileData] = useState({
    fullName: 'יוסי כהן',
    email: 'yossi@example.com',
    phone: '050-1234567',
    company: 'חברת הדוגמא',
    avatar: null as string | null
  });

  const [showProfileModal, setShowProfileModal] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch client data based on effective client ID
  const { data: clientInfo } = useQuery({
    queryKey: ['/api/clients', effectiveClientId],
    enabled: !!effectiveClientId && isAgencyAdmin && !!viewingClientId,
  });

  const { data: clientProjects = [] } = useQuery({
    queryKey: ['/api/projects', { clientId: effectiveClientId }],
    enabled: !!effectiveClientId,
  });

  const { data: clientStats } = useQuery({
    queryKey: ['/api/client/stats'],
    enabled: !isAgencyAdmin || !viewingClientId,
  });

  const clientTasks: Task[] = [
    { id: '1', title: 'אישור עיצוב', description: 'אישור עיצוב דף הבית', status: 'pending', priority: 'high', dueDate: '2024-02-15', projectId: '1' },
    { id: '2', title: 'בדיקת תוכן', description: 'בדיקת תוכן עמודי המוצר', status: 'completed', priority: 'medium', dueDate: '2024-02-10', projectId: '1' }
  ];

  const clientAssets: DigitalAsset[] = [
    { id: '1', name: 'example.com', type: 'domain', value: 'example.com', expiryDate: '2024-12-01', projectId: '1' },
    { id: '2', name: 'שרת אחסון', type: 'hosting', value: 'shared hosting', expiryDate: '2024-06-01', projectId: '1' }
  ];

  const messages: ClientMessage[] = [
    { id: '1', content: 'שלום, אשמח לעדכון על התקדמות הפרויקט', timestamp: '2024-02-01T10:00:00Z', isFromClient: true, projectId: '1' },
    { id: '2', content: 'היי! הפרויקט מתקדם מצוין, נשלח לך עדכון מפורט בקרוב', timestamp: '2024-02-01T11:00:00Z', isFromClient: false, projectId: '1' }
  ];

  // Fetch leads data
  const { data: leads = [] } = useQuery({
    queryKey: ['/api/client/leads', effectiveClientId],
    enabled: !!effectiveClientId,
  });

  // Fetch clients data  
  const { data: clients = [] } = useQuery({
    queryKey: ['/api/client/clients', effectiveClientId],
    enabled: !!effectiveClientId,
  });

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      'active': { label: 'פעיל', variant: 'default' },
      'inactive': { label: 'לא פעיל', variant: 'secondary' },
      'pending': { label: 'ממתין', variant: 'outline' },
      'completed': { label: 'הושלם', variant: 'default' },
      'in_progress': { label: 'בתהליך', variant: 'outline' },
      'planning': { label: 'תכנון', variant: 'secondary' },
      'new': { label: 'חדש', variant: 'default' },
      'contacted': { label: 'נוצר קשר', variant: 'outline' },
      'qualified': { label: 'מוכשר', variant: 'default' },
      'proposal': { label: 'הצעה', variant: 'outline' },
      'won': { label: 'נסגר', variant: 'default' },
      'lost': { label: 'אבוד', variant: 'destructive' }
    };

    const statusInfo = statusMap[status] || { label: status, variant: 'outline' as const };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const getSourceIcon = (source: string) => {
    const sourceIcons: Record<string, string> = {
      'google': '🔍',
      'facebook': '📘',
      'website': '🌐',
      'referral': '👥'
    };
    
    return sourceIcons[source] || '❓';
  };

  // Mutations for leads
  const saveLeadMutation = useMutation({
    mutationFn: async (leadData: any) => {
      const url = editingLead ? `/api/client/leads/${editingLead.id}` : '/api/client/leads';
      const method = editingLead ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ...leadData, clientId: effectiveClientId })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'שגיאה בשמירת הליד');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: editingLead ? "ליד עודכן" : "ליד נוסף",
        description: editingLead ? "הליד עודכן בהצלחה" : "ליד חדש נוסף בהצלחה"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/client/leads'] });
      setShowLeadModal(false);
      setEditingLead(null);
      setLeadForm({
        name: '',
        email: '',
        phone: '',
        source: 'website',
        status: 'new',
        value: 0,
        notes: ''
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "שגיאה",
        description: error.message
      });
    }
  });

  const saveClientMutation = useMutation({
    mutationFn: async (clientData: any) => {
      const url = editingClient ? `/api/client/clients/${editingClient.id}` : '/api/client/clients';
      const method = editingClient ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(clientData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'שגיאה בשמירת הלקוח');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: editingClient ? "לקוח עודכן" : "לקוח נוסף",
        description: editingClient ? "הלקוח עודכן בהצלחה" : "לקוח חדש נוסף בהצלחה"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/client/clients'] });
      setShowClientModal(false);
      setEditingClient(null);
      setClientForm({
        name: '',
        contactName: '',
        email: '',
        phone: '',
        industry: '',
        status: 'active'
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "שגיאה",
        description: error.message
      });
    }
  });

  const handleSaveLead = () => {
    saveLeadMutation.mutate(leadForm);
  };

  const handleSaveClient = () => {
    saveClientMutation.mutate(clientForm);
  };

  const handleSendMessage = () => {
    // In real app, this would make an API call
    toast({
      title: "הודעה נשלחה",
      description: "ההודעה נשלחה בהצלחה לסוכנות"
    });
    setShowMessageModal(false);
    setMessageForm({
      content: '',
      projectId: ''
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        setProfileData(prev => ({ ...prev, avatar: imageUrl }));
        // In real app, upload to server
        toast({
          title: "תמונה הועלתה",
          description: "תמונת הפרופיל עודכנה בהצלחה"
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = () => {
    // In real app, this would make an API call
    toast({
      title: "פרופיל עודכן",
      description: "הפרטים שלך נשמרו בהצלחה"
    });
    setShowProfileModal(false);
  };

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="text-xl font-bold text-primary">
                {isAgencyAdmin && viewingClientId 
                  ? `דאשבורד לקוח: ${clientInfo?.name || 'טוען...'}` 
                  : 'לוח הבקרה שלי'}
              </div>
              {isAgencyAdmin && viewingClientId && (
                <Badge variant="outline" className="mr-2">
                  מצב צפיה - מנהל סוכנות
                </Badge>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm">
                <Bell className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setActiveTab('profile')}>
                <User className="h-4 w-4" />
                החשבון שלי
              </Button>
              {isAgencyAdmin && viewingClientId && (
                <Button variant="outline" size="sm" onClick={() => {
                  if (window.opener) {
                    window.close();
                  } else {
                    window.location.href = `/dashboard/clients/${viewingClientId}`;
                  }
                }}>
                  <ArrowRight className="h-4 w-4 ml-2" />
                  חזור לפרטי לקוח
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => {
                // Clear auth data and redirect to login
                localStorage.removeItem('authToken');
                window.location.href = '/auth/login';
              }}>
                <LogOut className="h-4 w-4 ml-2" />
                יציאה
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex min-h-screen bg-gray-50">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-lg">
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-800">לוח בקרה</h2>
          </div>
          <nav className="mt-6">
            <div className="px-6 space-y-2">
              <button
                onClick={() => setActiveTab('overview')}
                className={`w-full flex items-center gap-3 px-4 py-3 text-right rounded-lg transition-colors ${
                  activeTab === 'overview' 
                    ? 'bg-blue-50 text-blue-700 border-r-4 border-blue-700' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Home className="h-5 w-5" />
                סקירה כללית
              </button>
              <button
                onClick={() => setActiveTab('projects')}
                className={`w-full flex items-center gap-3 px-4 py-3 text-right rounded-lg transition-colors ${
                  activeTab === 'projects' 
                    ? 'bg-blue-50 text-blue-700 border-r-4 border-blue-700' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <FolderOpen className="h-5 w-5" />
                הפרויקטים שלי
              </button>
              <button
                onClick={() => setActiveTab('leads')}
                className={`w-full flex items-center gap-3 px-4 py-3 text-right rounded-lg transition-colors ${
                  activeTab === 'leads' 
                    ? 'bg-blue-50 text-blue-700 border-r-4 border-blue-700' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <TrendingUp className="h-5 w-5" />
                לידים
              </button>
              <button
                onClick={() => setActiveTab('messages')}
                className={`w-full flex items-center gap-3 px-4 py-3 text-right rounded-lg transition-colors ${
                  activeTab === 'messages' 
                    ? 'bg-blue-50 text-blue-700 border-r-4 border-blue-700' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <MessageSquare className="h-5 w-5" />
                הודעות
              </button>
              <button
                onClick={() => setActiveTab('profile')}
                className={`w-full flex items-center gap-3 px-4 py-3 text-right rounded-lg transition-colors ${
                  activeTab === 'profile' 
                    ? 'bg-blue-50 text-blue-700 border-r-4 border-blue-700' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <User className="h-5 w-5" />
                הפרופיל שלי
              </button>
            </div>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <h1 className="text-3xl font-bold text-gray-900">סקירה כללית</h1>
              
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">פרויקטים פעילים</CardTitle>
                    <FolderOpen className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{clientProjects.length}</div>
                    <p className="text-xs text-muted-foreground">+2 השבוע</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">לידים חדשים</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{leads.filter(l => l.status === 'new').length}</div>
                    <p className="text-xs text-muted-foreground">+5 השבוע</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">ערך כולל</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">₪{leads.reduce((sum, lead) => sum + lead.value, 0).toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">+12% השבוע</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">משימות פתוחות</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {clientTasks.filter(task => task.status !== 'completed').length}
                    </div>
                    <p className="text-xs text-muted-foreground">-3 השבוע</p>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-right">פעילות אחרונה</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { action: 'ליד חדש נוסף', time: 'לפני 2 שעות', icon: '👤' },
                      { action: 'פרויקט עודכן', time: 'לפני 4 שעות', icon: '📁' },
                      { action: 'הודעה נשלחה', time: 'לפני יום', icon: '💬' },
                      { action: 'לקוח חדש נוסף', time: 'לפני יומיים', icon: '🏢' }
                    ].map((activity, index) => (
                      <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                        <span className="text-2xl">{activity.icon}</span>
                        <div className="flex-1 text-right">
                          <p className="font-medium">{activity.action}</p>
                          <p className="text-sm text-muted-foreground">{activity.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Projects Tab */}
          {activeTab === 'projects' && (
            <div className="space-y-6">
              <h1 className="text-3xl font-bold text-gray-900">הפרויקטים שלי</h1>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {clientProjects.map((project) => (
                  <Card key={project.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start mb-2">
                        <CardTitle className="text-lg font-semibold text-right flex-1">
                          {project.name}
                        </CardTitle>
                        {getStatusBadge(project.status)}
                      </div>
                      <p className="text-sm text-muted-foreground text-right">
                        {project.description}
                      </p>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">התקדמות</span>
                          <span className="font-medium">{project.progress || 0}%</span>
                        </div>
                        <Progress value={project.progress || 0} className="h-2" />
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button size="sm" variant="outline" className="flex-1">
                          <Eye className="h-4 w-4 ml-1" />
                          פרטים
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setSelectedProjectId(project.id);
                            setShowMessageModal(true);
                          }}
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Leads Tab */}
          {activeTab === 'leads' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-900">ניהול לידים</h1>
                <Button onClick={() => setShowLeadModal(true)}>
                  <Plus className="h-4 w-4 ml-2" />
                  הוסף ליד חדש
                </Button>
              </div>

              <Card>
                <CardContent className="p-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">שם</TableHead>
                        <TableHead className="text-right">אימייל</TableHead>
                        <TableHead className="text-right">טלפון</TableHead>
                        <TableHead className="text-right">מקור</TableHead>
                        <TableHead className="text-right">סטטוס</TableHead>
                        <TableHead className="text-right">ערך</TableHead>
                        <TableHead className="text-right">הערות</TableHead>
                        <TableHead className="text-right">פעולות</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leads.map((lead) => (
                        <TableRow key={lead.id} className="hover:bg-gray-50">
                          <TableCell className="text-right font-medium">{lead.name}</TableCell>
                          <TableCell className="text-right">{lead.email}</TableCell>
                          <TableCell className="text-right">{lead.phone}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center gap-2 justify-end">
                              <span>{getSourceIcon(lead.source)}</span>
                              <span className="capitalize">{lead.source}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">{getStatusBadge(lead.status)}</TableCell>
                          <TableCell className="text-right font-medium">₪{lead.value.toLocaleString()}</TableCell>
                          <TableCell className="text-right text-sm text-gray-600 max-w-[200px] truncate">
                            {lead.notes || 'ללא הערות'}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                              <Button size="sm" variant="outline" onClick={() => {
                                setEditingLead(lead);
                                setLeadForm(lead);
                                setShowLeadModal(true);
                              }}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="outline">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Messages Tab */}
          {activeTab === 'messages' && (
            <div className="space-y-6">
              <h1 className="text-3xl font-bold text-gray-900">תקשורת עם הסוכנות</h1>

              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div key={message.id} className={`p-4 rounded-lg ${
                        message.isFromClient ? 'bg-blue-50 mr-8' : 'bg-gray-50 ml-8'
                      }`}>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-muted-foreground">
                            {new Date(message.timestamp).toLocaleString('he-IL')}
                          </span>
                          <Badge variant={message.isFromClient ? 'default' : 'secondary'}>
                            {message.isFromClient ? 'אתה' : 'הסוכנות'}
                          </Badge>
                        </div>
                        <p className="text-right">{message.content}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-900">הפרופיל שלי</h1>
                <Button onClick={() => setShowProfileModal(true)}>
                  <Edit className="h-4 w-4 ml-2" />
                  ערוך פרופיל
                </Button>
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                {/* Profile Card */}
                <Card className="md:col-span-1">
                  <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                      <div className="relative">
                        {profileData.avatar ? (
                          <img 
                            src={profileData.avatar} 
                            alt="Profile" 
                            className="h-24 w-24 rounded-full object-cover border-4 border-white shadow-lg"
                          />
                        ) : (
                          <div className="h-24 w-24 rounded-full bg-blue-500 flex items-center justify-center text-white text-2xl font-bold">
                            {profileData.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                        )}
                        <button 
                          onClick={() => document.getElementById('avatar-upload')?.click()}
                          className="absolute bottom-0 right-0 bg-blue-500 text-white rounded-full p-1 hover:bg-blue-600 transition-colors"
                        >
                          <Edit className="h-3 w-3" />
                        </button>
                        <input
                          id="avatar-upload"
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </div>
                    </div>
                    <CardTitle className="text-xl">{profileData.fullName}</CardTitle>
                    <Badge variant="secondary" className="mx-auto">לקוח</Badge>
                  </CardHeader>
                  <CardContent className="text-center space-y-4">
                    <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                      <Mail className="h-4 w-4" />
                      {profileData.email}
                    </div>
                    <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                      <Phone className="h-4 w-4" />
                      {profileData.phone}
                    </div>
                    <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                      <Building className="h-4 w-4" />
                      {profileData.company}
                    </div>
                  </CardContent>
                </Card>

                {/* Activity Summary */}
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle>סיכום פעילות</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{clientProjects.length}</div>
                        <div className="text-sm text-gray-600">פרויקטים פעילים</div>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{clientTasks.filter(t => t.status === 'completed').length}</div>
                        <div className="text-sm text-gray-600">משימות הושלמו</div>
                      </div>
                      <div className="text-center p-4 bg-orange-50 rounded-lg">
                        <div className="text-2xl font-bold text-orange-600">{clientAssets.length}</div>
                        <div className="text-sm text-gray-600">נכסים דיגיטליים</div>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">{messages.length}</div>
                        <div className="text-sm text-gray-600">הודעות</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lead Modal */}
      <Dialog open={showLeadModal} onOpenChange={setShowLeadModal}>
        <DialogContent className="max-w-md" dir="rtl" aria-describedby="lead-modal-description">
          <DialogHeader>
            <DialogTitle className="text-right">
              {editingLead ? 'עריכת ליד' : 'הוספת ليד חדש'}
            </DialogTitle>
            <DialogDescription id="lead-modal-description" className="text-right">
              {editingLead ? 'ערוך את פרטי הליد' : 'הוסף ליד חדש למערכת'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-right">שם מלא</Label>
                <Input
                  value={leadForm.name}
                  onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })}
                  className="text-right"
                  placeholder="הכנס שם מלא"
                />
              </div>
              <div>
                <Label className="text-right">אימייל</Label>
                <Input
                  type="email"
                  value={leadForm.email}
                  onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
                  className="text-right"
                  placeholder="הכנס אימייל"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-right">טלפון</Label>
                <Input
                  value={leadForm.phone}
                  onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })}
                  className="text-right"
                  placeholder="הכנס טלפון"
                />
              </div>
              <div>
                <Label className="text-right">ערך צפוי (₪)</Label>
                <Input
                  type="number"
                  value={leadForm.value}
                  onChange={(e) => setLeadForm({ ...leadForm, value: Number(e.target.value) })}
                  className="text-right"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-right">מקור</Label>
                <Select value={leadForm.source} onValueChange={(value) => setLeadForm({ ...leadForm, source: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="google">Google</SelectItem>
                    <SelectItem value="facebook">Facebook</SelectItem>
                    <SelectItem value="website">אתר</SelectItem>
                    <SelectItem value="referral">הפניה</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-right">סטטוס</Label>
                <Select value={leadForm.status} onValueChange={(value) => setLeadForm({ ...leadForm, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">חדש</SelectItem>
                    <SelectItem value="contacted">נוצר קשר</SelectItem>
                    <SelectItem value="qualified">מוכשר</SelectItem>
                    <SelectItem value="proposal">הצעה</SelectItem>
                    <SelectItem value="won">נסגר</SelectItem>
                    <SelectItem value="lost">אבד</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-right">הערות</Label>
              <Textarea
                value={leadForm.notes}
                onChange={(e) => setLeadForm({ ...leadForm, notes: e.target.value })}
                className="text-right"
                placeholder="הערות נוספות..."
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowLeadModal(false)}>
                ביטול
              </Button>
              <Button onClick={handleSaveLead}>
                {editingLead ? 'עדכן' : 'הוסף'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Client Modal */}
      <Dialog open={showClientModal} onOpenChange={setShowClientModal}>
        <DialogContent className="max-w-md" dir="rtl" aria-describedby="client-modal-description">
          <DialogHeader>
            <DialogTitle className="text-right">
              {editingClient ? 'עריכת לקוח' : 'הוספת לקוח חדש'}
            </DialogTitle>
            <DialogDescription id="client-modal-description" className="text-right">
              {editingClient ? 'ערוך את פרטי הלקוח' : 'הוסף לקוח חדש למערכת'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-right">שם החברה</Label>
              <Input
                value={clientForm.name}
                onChange={(e) => setClientForm({ ...clientForm, name: e.target.value })}
                className="text-right"
                placeholder="הכנס שם החברה"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-right">איש קשר</Label>
                <Input
                  value={clientForm.contactName}
                  onChange={(e) => setClientForm({ ...clientForm, contactName: e.target.value })}
                  className="text-right"
                  placeholder="שם איש הקשר"
                />
              </div>
              <div>
                <Label className="text-right">אימייל</Label>
                <Input
                  type="email"
                  value={clientForm.email}
                  onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })}
                  className="text-right"
                  placeholder="אימייל"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-right">טלפון</Label>
                <Input
                  value={clientForm.phone}
                  onChange={(e) => setClientForm({ ...clientForm, phone: e.target.value })}
                  className="text-right"
                  placeholder="טלפון"
                />
              </div>
              <div>
                <Label className="text-right">תחום</Label>
                <Input
                  value={clientForm.industry}
                  onChange={(e) => setClientForm({ ...clientForm, industry: e.target.value })}
                  className="text-right"
                  placeholder="תחום עיסוק"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowClientModal(false)}>
                ביטול
              </Button>
              <Button onClick={handleSaveClient}>
                {editingClient ? 'עדכן' : 'הוסף'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Message Modal */}
      <Dialog open={showMessageModal} onOpenChange={setShowMessageModal}>
        <DialogContent className="max-w-md" dir="rtl" aria-describedby="message-modal-description">
          <DialogHeader>
            <DialogTitle className="text-right">הודעה חדשה לסוכנות</DialogTitle>
            <DialogDescription id="message-modal-description" className="text-right">
              שלח הודעה לסוכנות בנוגע לפרויקט
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-right">פרויקט (אופציונלי)</Label>
              <Select value={messageForm.projectId} onValueChange={(value) => setMessageForm({ ...messageForm, projectId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="בחר פרויקט" />
                </SelectTrigger>
                <SelectContent>
                  {clientProjects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-right">תוכן ההודעה</Label>
              <Textarea
                value={messageForm.content}
                onChange={(e) => setMessageForm({ ...messageForm, content: e.target.value })}
                className="text-right"
                placeholder="כתוב את ההודעה שלך כאן..."
                rows={4}
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowMessageModal(false)}>
                ביטול
              </Button>
              <Button onClick={handleSendMessage}>
                שלח הודעה
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Profile Edit Modal */}
      <Dialog open={showProfileModal} onOpenChange={setShowProfileModal}>
        <DialogContent className="max-w-lg" dir="rtl" aria-describedby="profile-modal-description">
          <DialogHeader>
            <DialogTitle className="text-right">עריכת פרופיל</DialogTitle>
            <DialogDescription id="profile-modal-description" className="text-right">
              ערוך את פרטי הפרופיל שלך
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex justify-center mb-4">
              <div className="relative">
                {profileData.avatar ? (
                  <img 
                    src={profileData.avatar} 
                    alt="Profile" 
                    className="h-20 w-20 rounded-full object-cover border-4 border-white shadow-lg"
                  />
                ) : (
                  <div className="h-20 w-20 rounded-full bg-blue-500 flex items-center justify-center text-white text-xl font-bold">
                    {profileData.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                )}
                <button 
                  onClick={() => document.getElementById('modal-avatar-upload')?.click()}
                  className="absolute bottom-0 right-0 bg-blue-500 text-white rounded-full p-1 hover:bg-blue-600 transition-colors"
                >
                  <Edit className="h-3 w-3" />
                </button>
                <input
                  id="modal-avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-right">שם מלא</Label>
                <Input
                  value={profileData.fullName}
                  onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                  className="text-right"
                  placeholder="הכנס שם מלא"
                />
              </div>
              <div>
                <Label className="text-right">אימייל</Label>
                <Input
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  className="text-right"
                  placeholder="הכנס אימייל"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-right">טלפון</Label>
                <Input
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  className="text-right"
                  placeholder="הכנס טלפון"
                />
              </div>
              <div>
                <Label className="text-right">חברה</Label>
                <Input
                  value={profileData.company}
                  onChange={(e) => setProfileData({ ...profileData, company: e.target.value })}
                  className="text-right"
                  placeholder="שם החברה"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowProfileModal(false)}>
                ביטול
              </Button>
              <Button onClick={handleSaveProfile}>
                שמור שינויים
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}