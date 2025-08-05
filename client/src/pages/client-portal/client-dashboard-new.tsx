import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
  TrendingUp
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mock data - in real app, this would come from the server
  const clientProjects: Project[] = [
    { id: '1', name: 'אתר הזמנות', description: 'פיתוח אתר הזמנות למסעדה', status: 'in_progress', progress: 65 },
    { id: '2', name: 'מערכת ניהול', description: 'מערכת ניהול לקוחות פנימית', status: 'planning', progress: 20 }
  ];

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

  const leads: Lead[] = [
    { id: '1', name: 'משה כהן', email: 'moshe@example.com', phone: '050-1234567', source: 'google', status: 'new', value: 15000, notes: 'מעוניין באתר למסעדה' },
    { id: '2', name: 'שרה לוי', email: 'sara@example.com', phone: '052-7654321', source: 'referral', status: 'contacted', value: 8000, notes: 'צריכה חנות מקוונת' }
  ];

  const clients: Client[] = [
    { id: '1', name: 'מסעדת הבשר', contactName: 'דוד כהן', email: 'david@restaurant.com', phone: '03-1234567', industry: 'מסעדות', status: 'active', projectsCount: 2 },
    { id: '2', name: 'חנות האופנה', contactName: 'רחל לוי', email: 'rachel@fashion.com', phone: '09-7654321', industry: 'אופנה', status: 'active', projectsCount: 1 }
  ];

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

  const handleSaveLead = () => {
    // In real app, this would make an API call
    toast({
      title: editingLead ? "ליד עודכן" : "ליד נוסף",
      description: editingLead ? "הליד עודכן בהצלחה" : "ליד חדש נוסף בהצלחה"
    });
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
  };

  const handleSaveClient = () => {
    // In real app, this would make an API call
    toast({
      title: editingClient ? "לקוח עודכן" : "לקוח נוסף",
      description: editingClient ? "הלקוח עודכן בהצלחה" : "לקוח חדש נוסף בהצלחה"
    });
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

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="text-xl font-bold text-primary">לוח הבקרה שלי</div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm">
                <Bell className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <User className="h-4 w-4" />
                החשבון שלי
              </Button>
              <Button variant="outline" size="sm">
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
                onClick={() => setActiveTab('clients')}
                className={`w-full flex items-center gap-3 px-4 py-3 text-right rounded-lg transition-colors ${
                  activeTab === 'clients' 
                    ? 'bg-blue-50 text-blue-700 border-r-4 border-blue-700' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Users className="h-5 w-5" />
                לקוחות
              </button>
              <button
                onClick={() => setActiveTab('assets')}
                className={`w-full flex items-center gap-3 px-4 py-3 text-right rounded-lg transition-colors ${
                  activeTab === 'assets' 
                    ? 'bg-blue-50 text-blue-700 border-r-4 border-blue-700' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <FileText className="h-5 w-5" />
                נכסים דיגיטליים
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
                  ליד חדש
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
                        <TableHead className="text-right">פעולות</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leads.map((lead) => (
                        <TableRow key={lead.id}>
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

          {/* Clients Tab */}
          {activeTab === 'clients' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-900">ניהול לקוחות</h1>
                <Button onClick={() => setShowClientModal(true)}>
                  <Plus className="h-4 w-4 ml-2" />
                  לקוח חדש
                </Button>
              </div>

              <Card>
                <CardContent className="p-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">שם החברה</TableHead>
                        <TableHead className="text-right">איש קשר</TableHead>
                        <TableHead className="text-right">אימייל</TableHead>
                        <TableHead className="text-right">טלפון</TableHead>
                        <TableHead className="text-right">תחום</TableHead>
                        <TableHead className="text-right">סטטוס</TableHead>
                        <TableHead className="text-right">פרויקטים</TableHead>
                        <TableHead className="text-right">פעולות</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {clients.map((client) => (
                        <TableRow key={client.id}>
                          <TableCell className="text-right font-medium">{client.name}</TableCell>
                          <TableCell className="text-right">{client.contactName}</TableCell>
                          <TableCell className="text-right">{client.email}</TableCell>
                          <TableCell className="text-right">{client.phone}</TableCell>
                          <TableCell className="text-right">{client.industry}</TableCell>
                          <TableCell className="text-right">{getStatusBadge(client.status)}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant="outline">{client.projectsCount}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                              <Button size="sm" variant="outline" onClick={() => {
                                setEditingClient(client);
                                setClientForm(client);
                                setShowClientModal(true);
                              }}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="outline">
                                <Eye className="h-4 w-4" />
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

          {/* Assets Tab */}
          {activeTab === 'assets' && (
            <div className="space-y-6">
              <h1 className="text-3xl font-bold text-gray-900">נכסים דיגיטליים</h1>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {clientAssets.map((asset) => (
                  <Card key={asset.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-right">{asset.name}</CardTitle>
                        <Badge variant="outline">{asset.type}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-2">{asset.value}</p>
                      {asset.expiryDate && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>פוגה: {new Date(asset.expiryDate).toLocaleDateString('he-IL')}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Messages Tab */}
          {activeTab === 'messages' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-900">תקשורת עם הסוכנות</h1>
                <Button onClick={() => setShowMessageModal(true)}>
                  <Send className="h-4 w-4 ml-2" />
                  הודעה חדשה
                </Button>
              </div>

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
        </div>
      </div>

      {/* Lead Modal */}
      <Dialog open={showLeadModal} onOpenChange={setShowLeadModal}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right">
              {editingLead ? 'עריכת ליד' : 'הוספת ליד חדש'}
            </DialogTitle>
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
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right">
              {editingClient ? 'עריכת לקוח' : 'הוספת לקוח חדש'}
            </DialogTitle>
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
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right">הודעה חדשה לסוכנות</DialogTitle>
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
    </div>
  );
}