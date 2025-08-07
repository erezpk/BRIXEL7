import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowRight, 
  Edit, 
  Phone, 
  Mail, 
  Building, 
  User,
  Calendar,
  FileText,
  Folder,
  Save,
  X,
  Send,
  Eye,
  ExternalLink,
  Receipt,
  Download,
  MapPin,
  CreditCard,
  Clock,
  DollarSign,
  Activity,
  Users,
  Plus,
  Settings,
  MoreVertical,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { type Client, type Project } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { ContactMeetings } from "@/components/contact-meetings";
import { MeetingScheduler } from "@/components/meeting-scheduler";

export default function ClientDetails() {
  const [, params] = useRoute("/dashboard/clients/:id");
  const [, navigate] = useLocation();
  const clientId = params?.id;
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddNoteModal, setShowAddNoteModal] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<Client>>({});
  const [newNote, setNewNote] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: client, isLoading: clientLoading } = useQuery<Client>({
    queryKey: ['/api/clients', clientId],
    enabled: !!clientId,
  });

  const { data: projects, isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
    select: (data) => data?.filter(p => p.clientId === clientId) || [],
  });

  // Fetch quotes for this client
  const { data: allQuotes = [], isLoading: quotesLoading } = useQuery({
    queryKey: ['/api/quotes'],
  });
  
  const quotes = allQuotes.filter((quote: any) => quote.clientId === clientId);

  const updateClientMutation = useMutation({
    mutationFn: async (updatedClient: Partial<Client>) => {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedClient),
      });

      if (!response.ok) {
        throw new Error('שגיאה בעדכון הלקוח');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clients', clientId] });
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      setShowEditModal(false);
      toast({
        title: "הלקוח עודכן בהצלחה",
        description: "פרטי הלקוח נשמרו במערכת",
      });
    },
    onError: () => {
      toast({
        title: "שגיאה בעדכון הלקוח",
        description: "אנא נסה שוב מאוחר יותר",
        variant: "destructive",
      });
    },
  });

  const sendCredentialsMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/clients/${clientId}/send-credentials`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('שגיאה בשליחת פרטי התחברות');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "פרטי התחברות נשלחו בהצלחה",
        description: "הלקוח יקבל אימייל עם פרטי ההתחברות לדאשבורד",
      });
    },
    onError: () => {
      toast({
        title: "שגיאה בשליחת פרטי התחברות",
        description: "אנא ודא שכתובת האימייל של הלקוח תקינה ונסה שוב",
        variant: "destructive",
      });
    },
  });

  const addNoteMutation = useMutation({
    mutationFn: async (note: string) => {
      const currentNotes = client?.notes || '';
      const timestamp = new Date().toLocaleString('he-IL');
      const newNotesContent = currentNotes 
        ? `${currentNotes}\n\n[${timestamp}]\n${note}`
        : `[${timestamp}]\n${note}`;

      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notes: newNotesContent }),
      });

      if (!response.ok) {
        throw new Error('שגיאה בהוספת הערה');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clients', clientId] });
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      setShowAddNoteModal(false);
      setNewNote('');
      toast({
        title: "הערה נוספה בהצלחה",
        description: "ההערה נשמרה במערכת",
      });
    },
    onError: () => {
      toast({
        title: "שגיאה בהוספת הערה",
        description: "אנא נסה שוב מאוחר יותר",
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'פעיל';
      case 'inactive':
        return 'לא פעיל';
      case 'pending':
        return 'ממתין';
      default:
        return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4" />;
      case 'inactive':
        return <XCircle className="h-4 w-4" />;
      case 'pending':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const handleEditClick = () => {
    if (client) {
      setEditFormData({
        name: client.name,
        contactName: client.contactName || '',
        email: client.email || '',
        phone: client.phone || '',
        industry: client.industry || '',
        status: client.status,
        notes: client.notes || '',
      });
      setShowEditModal(true);
    }
  };

  const handleSendCredentials = () => {
    if (!client?.email) {
      toast({
        title: "שגיאה",
        description: "ללקוח אין כתובת אימייל",
        variant: "destructive",
      });
      return;
    }
    sendCredentialsMutation.mutate();
  };

  const handleViewClientDashboard = () => {
    if (client?.id) {
      window.open(`/client-portal?clientId=${client.id}`, '_blank');
    }
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateClientMutation.mutate(editFormData);
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (newNote.trim()) {
      addNoteMutation.mutate(newNote.trim());
    }
  };

  if (clientLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="h-64 bg-gray-200 rounded-xl"></div>
                <div className="h-96 bg-gray-200 rounded-xl"></div>
              </div>
              <div className="space-y-6">
                <div className="h-80 bg-gray-200 rounded-xl"></div>
                <div className="h-48 bg-gray-200 rounded-xl"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">לקוח לא נמצא</h1>
          <p className="text-gray-600 mb-6">הלקוח שחיפשת אינו קיים במערכת</p>
          <Button onClick={() => navigate('/dashboard/clients')}>
            <ArrowRight className="h-4 w-4 ml-2" />
            חזרה לרשימת הלקוחות
          </Button>
        </div>
      </div>
    );
  }

  // Calculate stats
  const totalQuotes = quotes.length;
  const approvedQuotes = quotes.filter(q => q.status === 'approved').length;
  const totalQuoteValue = quotes.reduce((sum, quote) => sum + (quote.totalAmount || 0), 0);
  const approvedQuoteValue = quotes.filter(q => q.status === 'approved').reduce((sum, quote) => sum + (quote.totalAmount || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-reverse space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/dashboard/clients')}
                className="text-gray-500 hover:text-gray-700"
              >
                <ArrowRight className="h-4 w-4 ml-2" />
                חזרה לרשימת הלקוחות
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 font-rubik">{client.name}</h1>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={`${getStatusColor(client.status)} border text-sm px-3 py-1`}>
                        {getStatusIcon(client.status)}
                        <span className="mr-1">{getStatusText(client.status)}</span>
                      </Badge>
                      {client.industry && (
                        <span className="text-sm text-gray-500">• {client.industry}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <MeetingScheduler
                contactType="client"
                contactId={client.id}
                contactName={client.name}
                trigger={
                  <Button variant="outline" size="sm">
                    <Calendar className="h-4 w-4 ml-2" />
                    קבע פגישה
                  </Button>
                }
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleSendCredentials}
                disabled={sendCredentialsMutation.isPending || !client.email}
              >
                <Send className="h-4 w-4 ml-2" />
                {sendCredentialsMutation.isPending ? 'שולח...' : 'שלח פרטי התחברות'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleViewClientDashboard}
              >
                <ExternalLink className="h-4 w-4 ml-2" />
                דאשבורד לקוח
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleEditClick}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Edit className="h-4 w-4 ml-2" />
                ערוך פרטים
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-emerald-50 border-l-4 border-l-green-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-600">סה״כ הצעות מחיר</p>
                      <p className="text-2xl font-bold text-green-900 font-rubik">{totalQuotes}</p>
                    </div>
                    <Receipt className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-cyan-50 border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-600">הצעות מחיר מאושרות</p>
                      <p className="text-2xl font-bold text-blue-900 font-rubik">{approvedQuotes}</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-violet-50 border-l-4 border-l-purple-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-600">סה״כ ערך הצעות</p>
                      <p className="text-xl font-bold text-purple-900 font-rubik">₪{totalQuoteValue.toLocaleString()}</p>
                    </div>
                    <DollarSign className="h-8 w-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm bg-gradient-to-br from-orange-50 to-amber-50 border-l-4 border-l-orange-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-orange-600">ערך מאושר</p>
                      <p className="text-xl font-bold text-orange-900 font-rubik">₪{approvedQuoteValue.toLocaleString()}</p>
                    </div>
                    <CreditCard className="h-8 w-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tabs Content */}
            <Card className="border-0 shadow-sm">
              <Tabs defaultValue="overview" className="w-full">
                <div className="border-b border-gray-200 px-6">
                  <TabsList className="h-12 p-0 bg-transparent border-0">
                    <TabsTrigger 
                      value="overview" 
                      className="h-12 px-6 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                    >
                      סקירה כללית
                    </TabsTrigger>
                    <TabsTrigger 
                      value="quotes" 
                      className="h-12 px-6 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                    >
                      הצעות מחיר ({totalQuotes})
                    </TabsTrigger>
                    <TabsTrigger 
                      value="projects" 
                      className="h-12 px-6 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                    >
                      פרויקטים ({projects?.length || 0})
                    </TabsTrigger>
                    <TabsTrigger 
                      value="meetings" 
                      className="h-12 px-6 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                    >
                      פגישות
                    </TabsTrigger>
                    <TabsTrigger 
                      value="documents" 
                      className="h-12 px-6 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                    >
                      מסמכים
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="overview" className="p-6 space-y-6">
                  {/* Recent Activity */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">פעילות אחרונה</h3>
                    <div className="space-y-3">
                      {quotes.slice(0, 3).map((quote: any) => (
                        <div key={quote.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <Receipt className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">הצעת מחיר #{quote.quoteNumber}</p>
                              <p className="text-sm text-gray-500">
                                {new Date(quote.createdAt).toLocaleDateString('he-IL')} • ₪{quote.totalAmount?.toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <Badge className={quote.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                            {quote.status === 'approved' ? 'מאושר' : quote.status === 'pending' ? 'ממתין' : 'דחוי'}
                          </Badge>
                        </div>
                      ))}
                      {quotes.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <Receipt className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                          <p>אין פעילות אחרונה להצגה</p>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="quotes" className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">הצעות מחיר</h3>
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="h-4 w-4 ml-2" />
                        הצעת מחיר חדשה
                      </Button>
                    </div>

                    <div className="grid gap-4">
                      {quotes.map((quote: any) => (
                        <Card key={quote.id} className="border border-gray-200 hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                  <Receipt className="h-6 w-6 text-blue-600" />
                                </div>
                                <div>
                                  <h4 className="font-semibold text-gray-900">הצעת מחיר #{quote.quoteNumber}</h4>
                                  <p className="text-sm text-gray-500">
                                    נוצר: {new Date(quote.createdAt).toLocaleDateString('he-IL')}
                                  </p>
                                  <p className="text-lg font-bold text-blue-600 font-rubik">₪{quote.totalAmount?.toLocaleString()}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <Badge className={quote.status === 'approved' ? 'bg-green-100 text-green-800' : quote.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}>
                                  {quote.status === 'approved' ? 'מאושר' : quote.status === 'pending' ? 'ממתין' : 'דחוי'}
                                </Badge>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => window.open(`/quote-approval/${quote.id}`, '_blank')}>
                                      <Eye className="ml-2 h-4 w-4" />
                                      צפה בהצעת מחיר
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                      <Download className="ml-2 h-4 w-4" />
                                      הורד PDF
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                      <Edit className="ml-2 h-4 w-4" />
                                      ערוך הצעת מחיר
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      
                      {quotes.length === 0 && (
                        <div className="text-center py-12">
                          <Receipt className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">אין הצעות מחיר</h3>
                          <p className="text-gray-500 mb-6">עדיין לא נוצרו הצעות מחיר עבור לקוח זה</p>
                          <Button className="bg-blue-600 hover:bg-blue-700">
                            <Plus className="h-4 w-4 ml-2" />
                            צור הצעת מחיר ראשונה
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="meetings" className="p-6">
                  <ContactMeetings
                    contactType="client"
                    contactId={client.id}
                    contactName={client.name}
                  />
                </TabsContent>

                <TabsContent value="projects" className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">פרויקטים</h3>
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="h-4 w-4 ml-2" />
                        פרויקט חדש
                      </Button>
                    </div>

                    <div className="grid gap-4">
                      {projects?.map((project) => (
                        <Card key={project.id} className="border border-gray-200 hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                  <Folder className="h-6 w-6 text-purple-600" />
                                </div>
                                <div>
                                  <h4 className="font-semibold text-gray-900">{project.name}</h4>
                                  <p className="text-sm text-gray-500">{project.description}</p>
                                  <div className="flex items-center gap-4 mt-2">
                                    <Badge className={project.status === 'completed' ? 'bg-green-100 text-green-800' : project.status === 'in_progress' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}>
                                      {project.status === 'completed' ? 'הושלם' : project.status === 'in_progress' ? 'בתהליך' : 'ממתין'}
                                    </Badge>
                                    <span className="text-sm text-gray-500">
                                      עודכן: {new Date(project.updatedAt).toLocaleDateString('he-IL')}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <Button variant="ghost" size="sm" onClick={() => navigate(`/dashboard/projects/${project.id}`)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      
                      {(!projects || projects.length === 0) && (
                        <div className="text-center py-12">
                          <Folder className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">אין פרויקטים</h3>
                          <p className="text-gray-500 mb-6">עדיין לא נוצרו פרויקטים עבור לקוח זה</p>
                          <Button className="bg-blue-600 hover:bg-blue-700">
                            <Plus className="h-4 w-4 ml-2" />
                            צור פרויקט ראשון
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="documents" className="p-6">
                  <div className="text-center py-12">
                    <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">מסמכים</h3>
                    <p className="text-gray-500 mb-6">תכונה זו תהיה זמינה בקרוב</p>
                    <Button variant="outline" className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600">
                      <Plus className="h-4 w-4 ml-2" />
                      העלה מסמך
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </Card>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Contact Info Card */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <User className="h-5 w-5" />
                  פרטי התקשרות
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {client.contactName && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-600">איש קשר</p>
                      <p className="font-medium text-gray-900">{client.contactName}</p>
                    </div>
                  </div>
                )}

                {client.email && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <Mail className="h-4 w-4 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-600">אימייל</p>
                      <p className="font-medium text-gray-900">{client.email}</p>
                    </div>
                  </div>
                )}

                {client.phone && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <Phone className="h-4 w-4 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-600">טלפון</p>
                      <p className="font-medium text-gray-900">{client.phone}</p>
                    </div>
                  </div>
                )}

                {client.industry && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <Building className="h-4 w-4 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-600">תחום פעילות</p>
                      <p className="font-medium text-gray-900">{client.industry}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <Calendar className="h-4 w-4 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">תאריך הצטרפות</p>
                    <p className="font-medium text-gray-900">
                      {new Date(client.createdAt).toLocaleDateString('he-IL')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions Card */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  פעולות מהירות
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start h-11" 
                  onClick={handleSendCredentials}
                  disabled={sendCredentialsMutation.isPending || !client.email}
                >
                  <Send className="h-4 w-4 ml-2" />
                  {sendCredentialsMutation.isPending ? 'שולח...' : 'שלח פרטי התחברות'}
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start h-11"
                  onClick={handleViewClientDashboard}
                >
                  <ExternalLink className="h-4 w-4 ml-2" />
                  צפה בדאשבורד לקוח
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start h-11"
                  onClick={handleEditClick}
                >
                  <Edit className="h-4 w-4 ml-2" />
                  ערוך פרטי לקוח
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start h-11"
                  onClick={() => setShowAddNoteModal(true)}
                >
                  <FileText className="h-4 w-4 ml-2" />
                  הוסף הערה
                </Button>
              </CardContent>
            </Card>

            {/* Notes Card */}
            {client.notes && (
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    הערות
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">
                      {client.notes}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Edit Client Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>ערוך פרטי לקוח</DialogTitle>
            <DialogDescription>
              עדכן את פרטי הלקוח במערכת
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">שם הלקוח</Label>
              <Input
                id="name"
                value={editFormData.name || ''}
                onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                className="text-right"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="contactName">איש קשר</Label>
              <Input
                id="contactName"
                value={editFormData.contactName || ''}
                onChange={(e) => setEditFormData({...editFormData, contactName: e.target.value})}
                className="text-right"
              />
            </div>
            
            <div>
              <Label htmlFor="email">אימייל</Label>
              <Input
                id="email"
                type="email"
                value={editFormData.email || ''}
                onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                className="text-right"
              />
            </div>
            
            <div>
              <Label htmlFor="phone">טלפון</Label>
              <Input
                id="phone"
                value={editFormData.phone || ''}
                onChange={(e) => setEditFormData({...editFormData, phone: e.target.value})}
                className="text-right"
              />
            </div>
            
            <div>
              <Label htmlFor="industry">תחום פעילות</Label>
              <Input
                id="industry"
                value={editFormData.industry || ''}
                onChange={(e) => setEditFormData({...editFormData, industry: e.target.value})}
                className="text-right"
              />
            </div>
            
            <div>
              <Label htmlFor="status">סטטוס</Label>
              <Select 
                value={editFormData.status} 
                onValueChange={(value) => setEditFormData({...editFormData, status: value})}
              >
                <SelectTrigger className="text-right">
                  <SelectValue placeholder="בחר סטטוס" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">פעיל</SelectItem>
                  <SelectItem value="pending">ממתין</SelectItem>
                  <SelectItem value="inactive">לא פעיל</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowEditModal(false)}
                className="flex-1"
              >
                ביטול
              </Button>
              <Button 
                type="submit" 
                disabled={updateClientMutation.isPending}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {updateClientMutation.isPending ? 'שומר...' : 'שמור שינויים'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Note Modal */}
      <Dialog open={showAddNoteModal} onOpenChange={setShowAddNoteModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>הוסף הערה</DialogTitle>
            <DialogDescription>
              הוסף הערה חדשה עבור הלקוח
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddNote} className="space-y-4">
            <div>
              <Label htmlFor="note">הערה</Label>
              <Textarea
                id="note"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className="text-right min-h-[100px]"
                placeholder="רשום כאן את ההערה..."
                required
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddNoteModal(false)}
                className="flex-1"
              >
                ביטול
              </Button>
              <Button 
                type="submit" 
                disabled={addNoteMutation.isPending}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {addNoteMutation.isPending ? 'מוסיף...' : 'הוסף הערה'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}