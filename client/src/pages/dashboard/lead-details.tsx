import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowRight, Phone, Mail, Calendar, DollarSign, Star, Edit, Save, X, User, Clock, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ContactMeetings } from "@/components/contact-meetings";
import { MeetingScheduler } from "@/components/meeting-scheduler";

interface Lead {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  source: string;
  status: string;
  priority: string;
  value?: number;
  notes?: string;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
}

const statusOptions = [
  { value: "new", label: "חדש", color: "bg-blue-500" },
  { value: "contacted", label: "נוצר קשר", color: "bg-yellow-500" },
  { value: "qualified", label: "מוכשר", color: "bg-orange-500" },
  { value: "won", label: "נמכר", color: "bg-green-500" },
  { value: "lost", label: "אבוד", color: "bg-red-500" },
];

const sourceOptions = [
  { value: "website", label: "אתר" },
  { value: "facebook", label: "פייסבוק" },
  { value: "google", label: "גוגל" },
  { value: "referral", label: "הפניה" },
  { value: "manual", label: "ידני" },
];

const priorityOptions = [
  { value: "low", label: "נמוכה", color: "text-green-600" },
  { value: "medium", label: "בינונית", color: "text-yellow-600" },
  { value: "high", label: "גבוהה", color: "text-red-600" },
];

export default function LeadDetails() {
  const [, params] = useRoute("/dashboard/leads/:leadId");
  const leadId = params?.leadId;
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddNoteModal, setShowAddNoteModal] = useState(false);
  const [newNote, setNewNote] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: lead, isLoading, error } = useQuery<Lead>({
    queryKey: ['/api/leads', leadId],
    enabled: !!leadId,
  });

  // Debug logging removed - lead fetching working correctly

  const { data: users = [] } = useQuery({
    queryKey: ['/api/users'],
  });

  const [leadForm, setLeadForm] = useState({
    name: "",
    email: "",
    phone: "",
    source: "website",
    status: "new",
    priority: "medium",
    value: 0,
    notes: "",
    assignedTo: "unassigned",
  });

  // Set form data when lead loads
  useEffect(() => {
    if (lead) {
      setLeadForm({
        name: lead.name,
        email: lead.email || "",
        phone: lead.phone || "",
        source: lead.source,
        status: lead.status,
        priority: lead.priority,
        value: lead.value || 0,
        notes: lead.notes || "",
        assignedTo: lead.assignedTo || "unassigned",
      });
    }
  }, [lead]);

  const updateLeadMutation = useMutation({
    mutationFn: async (updatedLead: Partial<Lead>) => {
      const response = await fetch(`/api/leads/${leadId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedLead),
      });

      if (!response.ok) {
        throw new Error('שגיאה בעדכון הליד');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/leads', leadId] });
      queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
      setShowEditModal(false);
      toast({
        title: "הליד עודכן בהצלחה",
        description: "פרטי הליד נשמרו במערכת",
      });
    },
    onError: () => {
      toast({
        title: "שגיאה בעדכון הליד",
        description: "אנא נסה שוב מאוחר יותר",
        variant: "destructive",
      });
    },
  });

  const addNoteMutation = useMutation({
    mutationFn: async (note: string) => {
      const currentNotes = lead?.notes || '';
      const timestamp = new Date().toLocaleString('he-IL');
      const newNotesContent = currentNotes 
        ? `${currentNotes}\n\n[${timestamp}]\n${note}`
        : `[${timestamp}]\n${note}`;

      const response = await fetch(`/api/leads/${leadId}`, {
        method: 'PUT',
        credentials: 'include',
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
      queryClient.invalidateQueries({ queryKey: ['/api/leads', leadId] });
      queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
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
    return statusOptions.find(s => s.value === status)?.color || "bg-gray-500";
  };

  const getStatusLabel = (status: string) => {
    return statusOptions.find(s => s.value === status)?.label || status;
  };

  const getPriorityColor = (priority: string) => {
    return priorityOptions.find(p => p.value === priority)?.color || "text-gray-600";
  };

  const getPriorityLabel = (priority: string) => {
    return priorityOptions.find(p => p.value === priority)?.label || priority;
  };

  if (isLoading) {
    return <div className="p-6">טוען...</div>;
  }

  if (!lead && !isLoading) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">ליד לא נמצא</h2>
          <p className="text-muted-foreground">Lead ID: {leadId}</p>
          <p className="text-muted-foreground">Error: {error?.message || 'Unknown error'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => window.history.back()}>
            <ArrowRight className="h-4 w-4 ml-2" />
            חזור ללידים
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{lead.name}</h1>
            <p className="text-muted-foreground">פרטי ליד</p>
          </div>
        </div>
        <div className="flex gap-2">
          <MeetingScheduler
            contactType="lead"
            contactId={lead.id}
            contactName={lead.name}
            trigger={
              <Button>
                <Calendar className="h-4 w-4 ml-2" />
                קבע פגישה
              </Button>
            }
          />
          <Button onClick={() => setShowEditModal(true)}>
            <Edit className="h-4 w-4 ml-2" />
            עריכה
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lead Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>פרטי הליד</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Badge className={`${getStatusColor(lead.status)} text-white`}>
                  {getStatusLabel(lead.status)}
                </Badge>
                <Badge variant="outline" className={getPriorityColor(lead.priority)}>
                  <Star className="h-3 w-3 ml-1" />
                  {getPriorityLabel(lead.priority)}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {lead.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{lead.email}</span>
                  </div>
                )}
                {lead.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{lead.phone}</span>
                  </div>
                )}
                {lead.value && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span>{lead.value.toLocaleString()} ₪</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>מקור: {sourceOptions.find(s => s.value === lead.source)?.label}</span>
                </div>
              </div>

              {lead.notes && (
                <div>
                  <h4 className="font-medium mb-2">הערות</h4>
                  <div className="bg-muted/50 p-3 rounded-lg whitespace-pre-wrap">
                    {lead.notes}
                  </div>
                </div>
              )}

              <Button
                variant="outline"
                onClick={() => setShowAddNoteModal(true)}
                className="w-full"
              >
                הוסף הערה
              </Button>
            </CardContent>
          </Card>

          {/* Meetings Tab */}
          <Tabs defaultValue="meetings" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="meetings">פגישות</TabsTrigger>
              <TabsTrigger value="activity">פעילות</TabsTrigger>
            </TabsList>
            
            <TabsContent value="meetings" className="space-y-4">
              <ContactMeetings
                contactType="lead"
                contactId={lead.id}
                contactName={lead.name}
              />
            </TabsContent>
            
            <TabsContent value="activity">
              <Card>
                <CardContent className="p-4">
                  <p className="text-center text-muted-foreground">אין פעילות להציג</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>מידע נוסף</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-sm text-muted-foreground">נוצר</Label>
                <p className="text-sm">{new Date(lead.createdAt).toLocaleDateString('he-IL')}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">עודכן</Label>
                <p className="text-sm">{new Date(lead.updatedAt).toLocaleDateString('he-IL')}</p>
              </div>
              {lead.assignedTo && lead.assignedTo !== "unassigned" && (
                <div>
                  <Label className="text-sm text-muted-foreground">משויך ל</Label>
                  <p className="text-sm">
                    {(users as any[]).find((user: any) => user.id === lead.assignedTo)?.firstName} {(users as any[]).find((user: any) => user.id === lead.assignedTo)?.lastName}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto p-6" aria-describedby="edit-lead-description">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-right mb-2">עריכת ליד</DialogTitle>
          </DialogHeader>
          <div id="edit-lead-description" className="sr-only">טופס לעריכת פרטי הליד</div>
          
          <div className="space-y-6">
            {/* Basic Information Section */}
            <div>
              <h3 className="text-lg font-semibold text-right mb-4 border-b pb-2">פרטים בסיסיים</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-base font-medium">שם מלא *</Label>
                  <Input
                    id="name"
                    value={leadForm.name}
                    onChange={(e) => setLeadForm({...leadForm, name: e.target.value})}
                    placeholder="הכנס שם מלא"
                    className="text-right h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-base font-medium">כתובת אימייל</Label>
                  <Input
                    id="email"
                    type="email"
                    value={leadForm.email}
                    onChange={(e) => setLeadForm({...leadForm, email: e.target.value})}
                    placeholder="example@mail.com"
                    className="text-right h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-base font-medium">מספר טלפון</Label>
                  <Input
                    id="phone"
                    value={leadForm.phone}
                    onChange={(e) => setLeadForm({...leadForm, phone: e.target.value})}
                    placeholder="05X-XXX-XXXX"
                    className="text-right h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="value" className="text-base font-medium">ערך פוטנציאלי (₪)</Label>
                  <Input
                    id="value"
                    type="number"
                    value={leadForm.value}
                    onChange={(e) => setLeadForm({...leadForm, value: Number(e.target.value)})}
                    placeholder="0"
                    className="text-right h-11"
                  />
                </div>
              </div>
            </div>

            {/* Lead Management Section */}
            <div>
              <h3 className="text-lg font-semibold text-right mb-4 border-b pb-2">ניהול ליד</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="source" className="text-base font-medium">מקור הליד</Label>
                  <Select value={leadForm.source} onValueChange={(value) => setLeadForm({...leadForm, source: value})}>
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {sourceOptions.map(source => (
                        <SelectItem key={source.value} value={source.value}>
                          {source.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status" className="text-base font-medium">סטטוס</Label>
                  <Select value={leadForm.status} onValueChange={(value) => setLeadForm({...leadForm, status: value})}>
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map(status => (
                        <SelectItem key={status.value} value={status.value}>
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${status.color}`}></span>
                            {status.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority" className="text-base font-medium">עדיפות</Label>
                  <Select value={leadForm.priority} onValueChange={(value) => setLeadForm({...leadForm, priority: value})}>
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {priorityOptions.map(priority => (
                        <SelectItem key={priority.value} value={priority.value}>
                          <span className={priority.color}>{priority.label}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="assignedTo" className="text-base font-medium">משויך ל</Label>
                  <Select value={leadForm.assignedTo} onValueChange={(value) => setLeadForm({...leadForm, assignedTo: value})}>
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">לא משויך</SelectItem>
                      {(users as any[]).map((user: any) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.firstName} {user.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Notes Section */}
            <div>
              <h3 className="text-lg font-semibold text-right mb-4 border-b pb-2">הערות</h3>
              <div className="space-y-2">
                <Label htmlFor="notes" className="text-base font-medium">הערות נוספות</Label>
                <Textarea
                  id="notes"
                  value={leadForm.notes}
                  onChange={(e) => setLeadForm({...leadForm, notes: e.target.value})}
                  placeholder="הכנס הערות נוספות על הליד..."
                  rows={4}
                  className="text-right resize-none"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-3 pt-6 border-t">
            <Button variant="outline" onClick={() => setShowEditModal(false)} className="px-6">
              ביטול
            </Button>
            <Button
              onClick={() => updateLeadMutation.mutate(leadForm)}
              disabled={updateLeadMutation.isPending}
              className="px-6"
            >
              <Save className="h-4 w-4 ml-2" />
              {updateLeadMutation.isPending ? "שומר..." : "שמור שינויים"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Note Modal */}
      <Dialog open={showAddNoteModal} onOpenChange={setShowAddNoteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>הוסף הערה</DialogTitle>
          </DialogHeader>
          
          <div>
            <Label htmlFor="note">הערה חדשה</Label>
            <Textarea
              id="note"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="הקלד את ההערה כאן..."
              rows={4}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddNoteModal(false)}>
              ביטול
            </Button>
            <Button
              onClick={() => addNoteMutation.mutate(newNote)}
              disabled={addNoteMutation.isPending || !newNote.trim()}
            >
              {addNoteMutation.isPending ? "שומר..." : "שמור הערה"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}