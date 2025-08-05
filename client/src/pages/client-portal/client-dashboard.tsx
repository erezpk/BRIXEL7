
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  projectId: string;
}

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  source: string; // google, facebook, website, referral
  status: string; // new, contacted, qualified, proposal, won, lost
  value: number;
  notes: string;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
}

interface Client {
  id: string;
  name: string;
  contactName: string;
  email: string;
  phone: string;
  industry: string;
  status: string;
  totalValue: number;
  projectsCount: number;
  lastContact: string;
}

export default function ClientDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [activeTab, setActiveTab] = useState('overview');
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
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

  // Get client ID from URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const clientId = urlParams.get('clientId');
  const projectId = urlParams.get('projectId');

  const { data: clientProjects = [] } = useQuery<Project[]>({
    queryKey: ['/api/client/projects', clientId],
    enabled: isAuthenticated && !!clientId,
  });

  const { data: clientTasks = [] } = useQuery<Task[]>({
    queryKey: ['/api/client/tasks', clientId],
    enabled: isAuthenticated && !!clientId,
  });

  const { data: clientAssets = [] } = useQuery<DigitalAsset[]>({
    queryKey: ['/api/client/assets', clientId],
    enabled: isAuthenticated && !!clientId,
  });

  const { data: messages = [] } = useQuery<ClientMessage[]>({
    queryKey: ['/api/client/messages', clientId],
    enabled: isAuthenticated && !!clientId,
  });

  const { data: leads = [] } = useQuery<Lead[]>({
    queryKey: ['/api/client/leads', clientId],
    enabled: isAuthenticated && !!clientId,
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ['/api/client/clients', clientId],
    enabled: isAuthenticated && !!clientId,
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginForm.email && loginForm.password) {
      setIsAuthenticated(true);
      toast({
        title: "התחברות מוצלחת",
        description: "ברוך הבא לפורטל הלקוח שלך",
      });
    }
  };

  const handleSendMessage = () => {
    if (newMessage.trim() && selectedProjectId) {
      toast({
        title: "הודעה נשלחה",
        description: "ההודעה נשלחה לצוות הסוכנות",
      });
      setNewMessage('');
      setShowMessageModal(false);
    }
  };

  const handleSaveLead = () => {
    if (leadForm.name && leadForm.email) {
      toast({
        title: editingLead ? "ליד עודכן" : "ליד נוסף",
        description: editingLead ? "הליד עודכן בהצלחה" : "ליד חדש נוסף למערכת",
      });
      setShowLeadModal(false);
      setEditingLead(null);
      setLeadForm({ name: '', email: '', phone: '', source: 'website', status: 'new', value: 0, notes: '' });
    }
  };

  const handleSaveClient = () => {
    if (clientForm.name && clientForm.email) {
      toast({
        title: editingClient ? "לקוח עודכן" : "לקוח נוסף",
        description: editingClient ? "הלקוח עודכן בהצלחה" : "לקוח חדש נוסף למערכת",
      });
      setShowClientModal(false);
      setEditingClient(null);
      setClientForm({ name: '', contactName: '', email: '', phone: '', industry: '', status: 'active' });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'planning': { label: 'תכנון', color: 'bg-blue-100 text-blue-800' },
      'in_progress': { label: 'בתהליך', color: 'bg-yellow-100 text-yellow-800' },
      'review': { label: 'בבדיקה', color: 'bg-orange-100 text-orange-800' },
      'completed': { label: 'הושלם', color: 'bg-green-100 text-green-800' },
      'on_hold': { label: 'מושהה', color: 'bg-gray-100 text-gray-800' },
      'new': { label: 'חדש', color: 'bg-blue-100 text-blue-800' },
      'contacted': { label: 'נוצר קשר', color: 'bg-yellow-100 text-yellow-800' },
      'qualified': { label: 'מוכשר', color: 'bg-orange-100 text-orange-800' },
      'proposal': { label: 'הצעה', color: 'bg-purple-100 text-purple-800' },
      'won': { label: 'נסגר', color: 'bg-green-100 text-green-800' },
      'lost': { label: 'אבד', color: 'bg-red-100 text-red-800' },
      'active': { label: 'פעיל', color: 'bg-green-100 text-green-800' },
      'inactive': { label: 'לא פעיל', color: 'bg-gray-100 text-gray-800' },
    }[status] || { label: status, color: 'bg-gray-100 text-gray-800' };

    return (
      <Badge className={statusConfig.color} variant="secondary">
        {statusConfig.label}
      </Badge>
    );
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'google': return '🔍';
      case 'facebook': return '📘';
      case 'website': return '🌐';
      case 'referral': return '👥';
      default: return '📧';
    }
  };

  // אם המשתמש לא מחובר, הצג מסך התחברות
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center" dir="rtl">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">פורטל הלקוח</CardTitle>
            <p className="text-muted-foreground">התחבר כדי לגשת לפרויקטים שלך</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">אימייל</Label>
                <Input
                  id="email"
                  type="email"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                  placeholder="הכנס אימייל"
                  className="text-right"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">סיסמה</Label>
                <Input
                  id="password"
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  placeholder="הכנס סיסמה"
                  className="text-right"
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                התחבר
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Building className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-800">פורטל הלקוח</h1>
                <p className="text-sm text-gray-600">מערכת CRM מתקדמת</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm">
                <Bell className="h-4 w-4" />
                <span className="sr-only">התראות</span>
              </Button>
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
                <span className="sr-only">הגדרות</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsAuthenticated(false)}
              >
                <LogOut className="h-4 w-4 ml-2" />
                התנתק
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 bg-white p-1 rounded-lg shadow-sm">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              סקירה
            </TabsTrigger>
            <TabsTrigger value="projects" className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4" />
              פרויקטים
            </TabsTrigger>
            <TabsTrigger value="leads" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              לידים
            </TabsTrigger>
            <TabsTrigger value="clients" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              לקוחות
            </TabsTrigger>
            <TabsTrigger value="assets" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              נכסים
            </TabsTrigger>
            <TabsTrigger value="messages" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              הודעות
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
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
          </TabsContent>

          {/* Projects Tab */}
          <TabsContent value="projects" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">הפרויקטים שלי</h2>
              <Button onClick={() => setShowMessageModal(true)}>
                <Plus className="h-4 w-4 ml-2" />
                פרויקט חדש
              </Button>
            </div>

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
          </TabsContent>

          {/* Leads Tab */}
          <TabsContent value="leads" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">ניהול לידים</h2>
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
          </TabsContent>

          {/* Clients Tab */}
          <TabsContent value="clients" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">ניהול לקוחות</h2>
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
          </TabsContent>

          {/* Assets Tab */}
          <TabsContent value="assets" className="space-y-6">
            <h2 className="text-2xl font-bold">נכסים דיגיטליים</h2>
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
          </TabsContent>

          {/* Messages Tab */}
          <TabsContent value="messages" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">תקשורת עם הסוכנות</h2>
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
          </TabsContent>
        </Tabs>
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
                <Label className="text-right">ערך צפוי</Label>
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
            <DialogTitle className="text-right">שלח הודעה לסוכנות</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-right">תוכן ההודעה</Label>
              <Textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="כתוב את ההודעה שלך כאן..."
                className="text-right min-h-[100px]"
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowMessageModal(false)}>
                ביטול
              </Button>
              <Button onClick={handleSendMessage}>
                <Send className="h-4 w-4 ml-2" />
                שלח
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
