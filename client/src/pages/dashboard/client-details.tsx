import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute } from "wouter";
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
  Download
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { type Client, type Project } from "@shared/schema";

export default function ClientDetails() {
  const [, params] = useRoute("/dashboard/clients/:id");
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
  const { data: quotes, isLoading: quotesLoading } = useQuery({
    queryKey: ['/api/quotes', { clientId }],
    enabled: !!clientId,
  });

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
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
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

  const handleAddNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newNote.trim()) {
      addNoteMutation.mutate(newNote.trim());
    }
  };

  const handleInputChange = (field: keyof Client, value: string) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (clientLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">לקוח לא נמצא</h2>
        <p className="text-gray-600">הלקוח שחיפשת לא קיים במערכת</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="client-details">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-reverse space-x-4">
          <Button variant="ghost" size="sm" className="p-2">
            <ArrowRight className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 font-rubik">
              {client.name}
            </h1>
            <p className="text-gray-600 mt-1">פרטי לקוח</p>
          </div>
        </div>
        <div className="flex items-center space-x-reverse space-x-3">
          <Badge className={getStatusColor(client.status)}>
            {getStatusText(client.status)}
          </Badge>
          <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={async () => {
                    try {
                      const response = await fetch(`/api/clients/${client.id}/send-credentials`, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                          username: client.email,
                          password: `${client.name.toLowerCase().replace(/\s+/g, '')}_${Date.now().toString().slice(-8)}`
                        }),
                      });

                      const data = await response.json();

                      if (response.ok) {
                        toast({
                          title: "פרטי התחברות נשלחו",
                          description: `פרטי ההתחברות נשלחו בהצלחה לכתובת ${client.email}`,
                        });
                      } else {
                        toast({
                          title: "שגיאה בשליחת האימייל",
                          description: data.message || "אירעה שגיאה בשליחת פרטי ההתחברות",
                          variant: "destructive",
                        });
                      }
                    } catch (error) {
                      toast({
                        title: "שגיאה בשליחת האימייל",
                        description: "אירעה שגיאה בחיבור לשרת",
                        variant: "destructive",
                      });
                    }
                  }}
                  disabled={!client?.email || sendCredentialsMutation.isPending}
                  className="flex items-center gap-2"
                >
                  <Send className="h-4 w-4" />
                  {sendCredentialsMutation.isPending ? 'שולח...' : 'שלח פרטי התחברות'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleViewClientDashboard}
                  className="flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  צפה בדאשבורד
                  <ExternalLink className="h-3 w-3" />
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleEditClick}
                  className="flex items-center gap-2"
                >
                  <Edit className="h-4 w-4" />
                  ערוך לקוח
                </Button>
              </div>
        </div>
      </div>

      {/* Client Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-reverse space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">איש קשר</p>
                <p className="font-semibold">{client.contactName || 'לא צוין'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-reverse space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Mail className="h-5 w-5 text-green-600" />
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">אימייל</p>
                <p className="font-semibold">{client.email || 'לא צוין'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-reverse space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Phone className="h-5 w-5 text-purple-600" />
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">טלפון</p>
                <p className="font-semibold">{client.phone || 'לא צוין'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-reverse space-x-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Building className="h-5 w-5 text-orange-600" />
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">תחום</p>
                <p className="font-semibold">{client.industry || 'לא צוין'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="projects" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="projects">פרויקטים</TabsTrigger>
          <TabsTrigger value="quotes">הצעות מחיר</TabsTrigger>
          <TabsTrigger value="notes">הערות</TabsTrigger>
          <TabsTrigger value="history">היסטוריה</TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-reverse space-x-2">
                <Folder className="h-5 w-5" />
                <span>פרויקטים פעילים</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {projectsLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse flex items-center space-x-reverse space-x-4 p-4 border rounded-lg">
                      <div className="h-12 w-12 bg-gray-200 rounded-lg"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : !projects || projects.length === 0 ? (
                <div className="text-center py-8">
                  <Folder className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">אין פרויקטים</h3>
                  <p className="text-gray-600 mb-4">טרם נוצרו פרויקטים עבור לקוח זה</p>
                  <Button>
                    צור פרויקט חדש
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {projects.map((project) => (
                    <div 
                      key={project.id} 
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => window.location.href = `/dashboard/projects/${project.id}`}
                    >
                      <div className="flex items-center space-x-reverse space-x-4">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Folder className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="text-right">
                          <h4 className="font-semibold">{project.name}</h4>
                          <p className="text-sm text-gray-600">{project.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-reverse space-x-2">
                        <Badge variant="outline">{project.status}</Badge>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.location.href = `/dashboard/projects/${project.id}`;
                          }}
                        >
                          צפה בפרויקט
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quotes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-reverse space-x-2">
                <Receipt className="h-5 w-5" />
                <span>הצעות מחיר</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {quotesLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse flex items-center space-x-reverse space-x-4 p-4 border rounded-lg">
                      <div className="h-12 w-12 bg-gray-200 rounded-lg"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : !quotes || (quotes as any[]).length === 0 ? (
                <div className="text-center py-8">
                  <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">אין הצעות מחיר</h3>
                  <p className="text-gray-600 mb-4">טרם נשלחו הצעות מחיר ללקוח זה</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {(quotes as any[]).map((quote: any) => (
                    <div 
                      key={quote.id} 
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center space-x-reverse space-x-4">
                        <div className={`p-2 rounded-lg ${
                          quote.status === 'approved' ? 'bg-green-100' :
                          quote.status === 'sent' ? 'bg-blue-100' :
                          quote.status === 'viewed' ? 'bg-yellow-100' :
                          'bg-gray-100'
                        }`}>
                          <Receipt className={`h-5 w-5 ${
                            quote.status === 'approved' ? 'text-green-600' :
                            quote.status === 'sent' ? 'text-blue-600' :
                            quote.status === 'viewed' ? 'text-yellow-600' :
                            'text-gray-600'
                          }`} />
                        </div>
                        <div className="text-right">
                          <h4 className="font-semibold">{quote.title}</h4>
                          <p className="text-sm text-gray-600">
                            סכום: ₪{(quote.totalAmount / 100)?.toLocaleString()} | 
                            נשלח: {quote.sentAt ? new Date(quote.sentAt).toLocaleDateString('he-IL') : 'טרם נשלח'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-reverse space-x-2">
                        <Badge variant={
                          quote.status === 'approved' ? 'default' :
                          quote.status === 'sent' ? 'secondary' :
                          quote.status === 'viewed' ? 'outline' :
                          'outline'
                        }>
                          {quote.status === 'approved' ? 'אושר' :
                           quote.status === 'sent' ? 'נשלח' :
                           quote.status === 'viewed' ? 'נצפה' :
                           'טיוטה'}
                        </Badge>
                        {quote.status === 'sent' && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => window.open(`/quote-approval/${quote.id}`, '_blank')}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-reverse space-x-2">
                <FileText className="h-5 w-5" />
                <span>הערות לקוח</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {client.notes ? (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-800 whitespace-pre-wrap">{client.notes}</p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">אין הערות</h3>
                  <p className="text-gray-600 mb-4">טרם נוספו הערות עבור לקוח זה</p>
                  <Button variant="outline" onClick={() => setShowAddNoteModal(true)}>
                    הוסף הערה
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-reverse space-x-2">
                <Calendar className="h-5 w-5" />
                <span>היסטוריית פעילות</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">אין פעילות להצגה</h3>
                <p className="text-gray-600">היסטוריית הפעילות של הלקוח תוצג כאן</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Client Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto" aria-describedby="edit-client-description">
          <DialogHeader>
            <DialogTitle className="text-right font-rubik">ערוך לקוח</DialogTitle>
            <DialogDescription id="edit-client-description" className="text-right">
              ערוך את פרטי הלקוח במערכת
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="clientName" className="text-right">שם הלקוח *</Label>
              <Input
                id="clientName"
                value={editFormData.name || ''}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="הכנס שם הלקוח"
                className="text-right"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactName" className="text-right">איש קשר</Label>
              <Input
                id="contactName"
                value={editFormData.contactName || ''}
                onChange={(e) => handleInputChange('contactName', e.target.value)}
                placeholder="שם איש הקשר"
                className="text-right"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-right">אימייל</Label>
              <Input
                id="email"
                type="email"
                value={editFormData.email || ''}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="כתובת אימייל"
                className="text-right"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-right">טלפון</Label>
              <Input
                id="phone"
                value={editFormData.phone || ''}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="מספר טלפון"
                className="text-right"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="industry" className="text-right">תחום עיסוק</Label>
              <Select value={editFormData.industry || ''} onValueChange={(value) => handleInputChange('industry', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="בחר תחום עיסוק" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="technology">טכנולוגיה</SelectItem>
                  <SelectItem value="healthcare">בריאות</SelectItem>
                  <SelectItem value="education">חינוך</SelectItem>
                  <SelectItem value="finance">פיננסים</SelectItem>
                  <SelectItem value="retail">קמעונאות</SelectItem>
                  <SelectItem value="food">מזון ומשקאות</SelectItem>
                  <SelectItem value="real-estate">נדל"ן</SelectItem>
                  <SelectItem value="legal">משפטים</SelectItem>
                  <SelectItem value="consulting">ייעוץ</SelectItem>
                  <SelectItem value="other">אחר</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status" className="text-right">סטטוס</Label>
              <Select value={editFormData.status || ''} onValueChange={(value) => handleInputChange('status', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="בחר סטטוס" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">פעיל</SelectItem>
                  <SelectItem value="inactive">לא פעיל</SelectItem>
                  <SelectItem value="pending">ממתין</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes" className="text-right">הערות</Label>
              <Textarea
                id="notes"
                value={editFormData.notes || ''}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="הערות נוספות"
                className="text-right"
                rows={3}
              />
            </div>

            <div className="flex space-x-reverse space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowEditModal(false)}
              >
                ביטול
              </Button>
              <Button
                type="submit"
                disabled={updateClientMutation.isPending}
              >
                {updateClientMutation.isPending ? "שומר..." : "שמור"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Note Modal */}
      <Dialog open={showAddNoteModal} onOpenChange={setShowAddNoteModal}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto" aria-describedby="add-note-description">
          <DialogHeader>
            <DialogTitle className="text-right font-rubik">הוסף הערה</DialogTitle>
            <DialogDescription id="add-note-description" className="text-right">
              הוסף הערה חדשה עבור הלקוח
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddNoteSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newNote" className="text-right">הערה חדשה</Label>
              <Textarea
                id="newNote"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="הכנס הערה חדשה..."
                className="text-right"
                rows={4}
                required
              />
            </div>

            <div className="flex space-x-reverse space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAddNoteModal(false);
                  setNewNote('');
                }}
              >
                ביטול
              </Button>
              <Button
                type="submit"
                disabled={addNoteMutation.isPending || !newNote.trim()}
              >
                {addNoteMutation.isPending ? "מוסיף..." : "הוסף הערה"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}