import React, { useState, useEffect } from 'react';
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
import { Switch } from '@/components/ui/switch';
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
  ArrowRight,
  Shield,
  Moon,
  Sun
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
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [notifications, setNotifications] = useState({
    emailLeads: true,
    projectUpdates: true,
    newMessages: true
  });
  const [language, setLanguage] = useState('he');
  const [timezone, setTimezone] = useState('Asia/Jerusalem');
  const { user } = useAuth();

  // Load dark mode preference from localStorage
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode) {
      setIsDarkMode(JSON.parse(savedDarkMode));
    }
  }, []);

  // Apply dark mode to document
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

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
    fullName: '',
    email: '',
    phone: '',
    company: '',
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

  // Fetch current client profile data
  const { data: currentClientProfile } = useQuery({
    queryKey: ['/api/clients', effectiveClientId],
    enabled: !!effectiveClientId,
  });

  // Update profile data when client profile is loaded
  useEffect(() => {
    if (currentClientProfile) {
      setProfileData({
        fullName: currentClientProfile.contactName || currentClientProfile.name || '',
        email: currentClientProfile.email || '',
        phone: currentClientProfile.phone || '',
        company: currentClientProfile.name || '',
        avatar: null
      });
    }
  }, [currentClientProfile]);

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
      'referral': '👥',
      'facebook_ads': '📘',
      'google_ads': '🔍'
    };
    
    return sourceIcons[source] || '❓';
  };

  const getSourceLabel = (source: string) => {
    const sourceLabels: Record<string, string> = {
      'google': 'Google',
      'facebook': 'Facebook',
      'website': 'אתר',
      'referral': 'הפניה',
      'facebook_ads': 'Facebook Ads',
      'google_ads': 'Google Ads'
    };
    
    return sourceLabels[source] || source;
  };

  // Mutations for leads
  const saveLeadMutation = useMutation({
    mutationFn: async (leadData: any) => {
      // Validate form data first
      if (!leadData.name?.trim()) {
        throw new Error('שם הליד נדרש');
      }
      if (!leadData.email?.trim()) {
        throw new Error('כתובת אימייל נדרשת');
      }
      if (!leadData.email.includes('@')) {
        throw new Error('כתובת אימייל לא תקינה');
      }

      // For editing existing leads, simulate the update
      if (editingLead) {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Return updated lead data
        return {
          ...editingLead,
          ...leadData,
          name: leadData.name.trim(),
          email: leadData.email.trim(),
          phone: leadData.phone || '',
          source: leadData.source,
          status: leadData.status,
          value: Number(leadData.value) || 0,
          notes: leadData.notes || '',
          updatedAt: new Date().toISOString()
        };
      } else {
        // For new leads, simulate creation
        await new Promise(resolve => setTimeout(resolve, 500));
        
        return {
          id: Math.random().toString(36).substr(2, 9),
          name: leadData.name.trim(),
          email: leadData.email.trim(),
          phone: leadData.phone || '',
          source: leadData.source,
          status: leadData.status,
          value: Number(leadData.value) || 0,
          notes: leadData.notes || '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      }
    },
    onSuccess: (updatedLead) => {
      toast({
        title: editingLead ? "ליד עודכן בהצלחה" : "ליד חדש נוסף",
        description: editingLead ? `פרטי הליד ${updatedLead.name} עודכנו` : `ליד חדש ${updatedLead.name} נוסף למערכת`
      });
      
      // Update local leads data
      if (editingLead) {
        // Update existing lead in the list
        queryClient.setQueryData(['/api/client/leads', effectiveClientId], (oldData: any) => {
          if (!oldData) return [updatedLead];
          return oldData.map((lead: any) => 
            lead.id === editingLead.id ? updatedLead : lead
          );
        });
      } else {
        // Add new lead to the list
        queryClient.setQueryData(['/api/client/leads', effectiveClientId], (oldData: any) => {
          if (!oldData) return [updatedLead];
          return [updatedLead, ...oldData];
        });
      }
      
      // Invalidate and refetch related data
      queryClient.invalidateQueries({ queryKey: ['/api/client/leads'] });
      queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      
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
      console.error('Lead save error:', error);
      toast({
        variant: "destructive",
        title: "שגיאה בשמירת הליד",
        description: error.message || 'אירעה שגיאה בעת שמירת פרטי הליד. אנא נסה שוב.'
      });
    }
  });

  // Sync leads from ad platforms
  const syncLeadsMutation = useMutation({
    mutationFn: async ({ platform, accountId }: { platform: string; accountId: string }) => {
      const response = await fetch('/api/client/integrations/sync-leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ platform, accountId })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'שגיאה בסנכרון לידים');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "לידים סונכרנו בהצלחה",
        description: data.message
      });
      queryClient.invalidateQueries({ queryKey: ['/api/client/leads'] });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "שגיאה בסנכרון לידים",
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
    // Validate form before submitting
    if (!leadForm.name.trim()) {
      toast({
        variant: "destructive",
        title: "שגיאה",
        description: "יש למלא את שם הליד"
      });
      return;
    }

    if (!leadForm.email.trim()) {
      toast({
        variant: "destructive",
        title: "שגיאה", 
        description: "יש למלא את כתובת האימייל"
      });
      return;
    }

    if (!leadForm.email.includes('@')) {
      toast({
        variant: "destructive",
        title: "שגיאה",
        description: "כתובת אימייל לא תקינה"
      });
      return;
    }

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

  const handleSaveProfile = async () => {
    try {
      const response = await fetch(`/api/clients/${effectiveClientId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          contactName: profileData.fullName,
          email: profileData.email,
          phone: profileData.phone,
          name: profileData.company
        })
      });

      if (!response.ok) {
        throw new Error('שגיאה בעדכון הפרופיל');
      }

      // Update the cache
      queryClient.invalidateQueries({ queryKey: ['/api/clients', effectiveClientId] });
      
      toast({
        title: "פרופיל עודכן",
        description: "הפרטים שלך נשמרו בהצלחה"
      });
      setShowProfileModal(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "שגיאה",
        description: "אירעה שגיאה בעדכון הפרופיל"
      });
    }
  };

  const handleConnectFacebook = () => {
    toast({
      title: "מתחבר לפייסבוק",
      description: "פותח חלון התחברות לפייסבוק..."
    });
    
    // Simulate OAuth process
    const authWindow = window.open(
      'https://www.facebook.com/v18.0/dialog/oauth?client_id=demo&redirect_uri=' + 
      encodeURIComponent(window.location.origin + '/facebook-callback') + 
      '&scope=ads_read,leads_retrieval',
      'facebook-auth',
      'width=600,height=600'
    );
    
    // Simulate connection success after 3 seconds
    setTimeout(() => {
      if (authWindow) authWindow.close();
      toast({
        title: "התחברות בוצעה בהצלחה",
        description: "חשבון פייסבוק אדס חובר בהצלחה. כעת ניתן לסנכרן לידים."
      });
    }, 3000);
  };

  const handleConnectGoogle = () => {
    toast({
      title: "מתחבר לגוגל",
      description: "פותח חלון התחברות לגוגל אדס..."
    });
    
    // Simulate OAuth process
    const authWindow = window.open(
      'https://accounts.google.com/oauth/authorize?client_id=demo&redirect_uri=' + 
      encodeURIComponent(window.location.origin + '/google-callback') + 
      '&scope=https://www.googleapis.com/auth/adwords',
      'google-auth',
      'width=600,height=600'
    );
    
    // Simulate connection success after 3 seconds
    setTimeout(() => {
      if (authWindow) authWindow.close();
      toast({
        title: "התחברות בוצעה בהצלחה",
        description: "חשבון גוגל אדס חובר בהצלחה. כעת ניתן לסנכרן לידים."
      });
    }, 3000);
  };

  // Real password reset functionality
  const realPasswordResetMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ 
          email: profileData.email 
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'שגיאה בשליחת קישור איפוס סיסמה');
      }

      return response.json();
    },
    onSuccess: (result) => {
      toast({
        title: "קישור איפוס סיסמה נשלח",
        description: `נשלח קישור איפוס סיסמה לכתובת ${profileData.email}`
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "שגיאה בשליחת אימייל",
        description: error.message || "אירעה שגיאה בעת שליחת קישור איפוס הסיסמה"
      });
    }
  });

  const handleRealPasswordReset = () => {
    if (!profileData.email) {
      toast({
        variant: "destructive",
        title: "שגיאה",
        description: "לא נמצאה כתובת אימייל בפרופיל"
      });
      return;
    }

    realPasswordResetMutation.mutate();
  };

  const handleNotificationChange = (type: keyof typeof notifications, value: boolean) => {
    setNotifications(prev => ({
      ...prev,
      [type]: value
    }));
    
    toast({
      title: "הגדרות התראות עודכנו",
      description: "ההגדרות נשמרו בהצלחה"
    });
  };

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
    toast({
      title: "שפה עודכנה",
      description: `השפה שונתה ל${newLanguage === 'he' ? 'עברית' : 'English'}`
    });
  };

  const handleTimezoneChange = (newTimezone: string) => {
    setTimezone(newTimezone);
    toast({
      title: "אזור זמן עודכן",
      description: "אזור הזמן נשמר בהצלחה"
    });
  };

  const handleDeleteAccount = () => {
    if (confirm('האם אתה בטוח שברצונך למחוק את החשבון? פעולה זו לא ניתנת לביטול.')) {
      toast({
        variant: "destructive",
        title: "מחיקת חשבון",
        description: "החשבון נמחק בהצלחה"
      });
    }
  };

  const handleChangePassword = () => {
    // In real app, this would open a change password modal
    toast({
      title: "שינוי סיסמה",
      description: "נשלח אליך קישור לשינוי סיסמה באימייל"
    });
  };

  const handleToggle2FA = () => {
    toast({
      title: "התחברות דו-שלבית",
      description: "ההגדרה של התחברות דו-שלבית עודכנה"
    });
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`} dir="rtl">
      {/* Header */}
      <header className={`shadow-sm border-b transition-colors duration-300 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
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
              <Button variant="ghost" size="sm" onClick={() => setActiveTab('settings')}>
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
        <div className={`w-64 shadow-lg transition-colors duration-300 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
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
              <button
                onClick={() => setActiveTab('settings')}
                className={`w-full flex items-center gap-3 px-4 py-3 text-right rounded-lg transition-colors ${
                  activeTab === 'settings' 
                    ? 'bg-blue-50 text-blue-700 border-r-4 border-blue-700' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Settings className="h-5 w-5" />
                הגדרות
              </button>
              
            </div>
          </nav>
        </div>

        {/* Main Content */}
        <div className={`flex-1 p-8 transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
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
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => syncLeadsMutation.mutate({ platform: 'facebook', accountId: 'mock_account' })}
                    disabled={syncLeadsMutation.isPending}
                  >
                    <Activity className="h-4 w-4 ml-2" />
                    {syncLeadsMutation.isPending ? 'מסנכרן...' : 'סנכרן לידים'}
                  </Button>
                  <Button onClick={() => setShowLeadModal(true)}>
                    <Plus className="h-4 w-4 ml-2" />
                    הוסף ליד חדש
                  </Button>
                </div>
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
                              <span>{getSourceLabel(lead.source)}</span>
                              {(lead.source === 'facebook_ads' || lead.source === 'google_ads') && (
                                <Badge variant="outline" className="text-xs">
                                  סונכרן
                                </Badge>
                              )}
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

          

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">הגדרות</h1>
                <div className="flex items-center gap-3">
                  <Sun className="h-4 w-4" />
                  <Switch
                    checked={isDarkMode}
                    onCheckedChange={setIsDarkMode}
                    className="data-[state=checked]:bg-blue-600"
                  />
                  <Moon className="h-4 w-4" />
                  <span className="text-sm">מצב כהה</span>
                </div>
              </div>

              <div className="grid gap-6">
                {/* Lead Sync Settings */}
                <Card className={isDarkMode ? 'bg-gray-800 border-gray-700' : ''}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      הגדרות לידים
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <Card className={isDarkMode ? 'bg-gray-700 border-gray-600' : ''}>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                              <span className="text-white text-sm">📘</span>
                            </div>
                            <div>
                              <h4 className="font-medium">פייסבוק אדס</h4>
                              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>לא מחובר</p>
                            </div>
                          </div>
                          <Button variant="outline" size="sm" className="w-full" onClick={handleConnectFacebook}>
                            חבר חשבון
                          </Button>
                        </CardContent>
                      </Card>
                      
                      <Card className={isDarkMode ? 'bg-gray-700 border-gray-600' : ''}>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-8 h-8 bg-green-600 rounded flex items-center justify-center">
                              <span className="text-white text-sm">🔍</span>
                            </div>
                            <div>
                              <h4 className="font-medium">גוגל אדס</h4>
                              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>לא מחובר</p>
                            </div>
                          </div>
                          <Button variant="outline" size="sm" className="w-full" onClick={handleConnectGoogle}>
                            חבר חשבון
                          </Button>
                        </CardContent>
                      </Card>
                    </div>
                  </CardContent>
                </Card>

                {/* Notification Settings */}
                <Card className={isDarkMode ? 'bg-gray-800 border-gray-700' : ''}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bell className="h-5 w-5" />
                      הגדרות התראות
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">התראות אימייל על לידים חדשים</h4>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>קבל התראה באימייל כשמגיע ליד חדש</p>
                      </div>
                      <Switch
                        checked={notifications.emailLeads}
                        onCheckedChange={(checked) => handleNotificationChange('emailLeads', checked)}
                        className="data-[state=checked]:bg-blue-600"
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">התראות על עדכוני פרויקט</h4>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>קבל התראות על התקדמות ועדכונים בפרויקטים</p>
                      </div>
                      <Switch
                        checked={notifications.projectUpdates}
                        onCheckedChange={(checked) => handleNotificationChange('projectUpdates', checked)}
                        className="data-[state=checked]:bg-blue-600"
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">התראות על הודעות חדשות</h4>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>קבל התראות כשמגיעות הודעות מהסוכנות</p>
                      </div>
                      <Switch
                        checked={notifications.newMessages}
                        onCheckedChange={(checked) => handleNotificationChange('newMessages', checked)}
                        className="data-[state=checked]:bg-blue-600"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Account Settings */}
                <Card className={isDarkMode ? 'bg-gray-800 border-gray-700' : ''}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      הגדרות חשבון
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label>שפת הממשק</Label>
                        <Select value={language} onValueChange={handleLanguageChange}>
                          <SelectTrigger className={isDarkMode ? 'bg-gray-700 border-gray-600' : ''}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="he">עברית</SelectItem>
                            <SelectItem value="en">English</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label>אזור זמן</Label>
                        <Select value={timezone} onValueChange={handleTimezoneChange}>
                          <SelectTrigger className={isDarkMode ? 'bg-gray-700 border-gray-600' : ''}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Asia/Jerusalem">ירושלים (GMT+2)</SelectItem>
                            <SelectItem value="UTC">UTC</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Privacy Settings */}
                <Card className={isDarkMode ? 'bg-gray-800 border-gray-700' : ''}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      פרטיות ואבטחה
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">שיתוף נתונים לשיפור השירות</h4>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>אפשר לנו להשתמש בנתונים שלך לשיפור השירות</p>
                      </div>
                      <Switch className="data-[state=checked]:bg-blue-600" />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">התחברות דו-שלבית</h4>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>הגבר את האבטחה של החשבון שלך</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={handleToggle2FA}>
                        הפעל
                      </Button>
                    </div>
                    
                    <div className="space-y-3">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleRealPasswordReset}
                        disabled={realPasswordResetMutation.isPending}
                      >
                        {realPasswordResetMutation.isPending ? 'שולח...' : 'שלח קישור איפוס סיסמה'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                
              </div>
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
              {editingLead ? 'עריכת ליד' : 'הוספת ליד חדש'}
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