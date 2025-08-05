import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserPlus, Filter, MoreHorizontal, Phone, Mail, DollarSign, Calendar, TrendingUp, Users, Plus, Edit, Trash2, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { rtlClass } from "@/lib/rtl";
import { apiRequest } from "@/lib/queryClient";

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  source: string;
  status: string;
  priority: string;
  value: number;
  notes?: string;
  assignedTo?: string;
  createdAt: string;
  updatedAt?: string;
}

export default function Leads() {
  const [activeTab, setActiveTab] = useState("all");
  const [isLeadDialogOpen, setIsLeadDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterSource, setFilterSource] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [leadForm, setLeadForm] = useState({
    name: "",
    email: "",
    phone: "",
    source: "website",
    status: "new",
    priority: "medium",
    value: 0,
    notes: "",
    assignedTo: ""
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch leads with filters
  const { data: leads = [], isLoading } = useQuery({
    queryKey: ['/api/leads', { status: filterStatus, source: filterSource, priority: filterPriority }],
  }) as { data: Lead[], isLoading: boolean };

  // Create/Update lead mutation
  const leadMutation = useMutation({
    mutationFn: async (data: typeof leadForm) => {
      const url = editingLead ? `/api/leads/${editingLead.id}` : '/api/leads';
      const method = editingLead ? 'PUT' : 'POST';
      
      return await apiRequest({
        url,
        method,
        body: data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
      setIsLeadDialogOpen(false);
      resetForm();
      toast({
        title: editingLead ? "ליד עודכן" : "ליד נוצר",
        description: editingLead ? "הליד עודכן בהצלחה" : "ליד חדש נוסף למערכת"
      });
    },
    onError: () => {
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בשמירת הליד",
        variant: "destructive"
      });
    }
  });

  // Convert lead to client mutation
  const convertMutation = useMutation({
    mutationFn: async (leadId: string) => {
      return await apiRequest({
        url: `/api/leads/${leadId}/convert`,
        method: 'POST',
        body: {
          name: leads.find(l => l.id === leadId)?.name || "",
          email: leads.find(l => l.id === leadId)?.email || "",
          phone: leads.find(l => l.id === leadId)?.phone || ""
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      toast({
        title: "המרה הושלמה",
        description: "הליד הומר ללקוח בהצלחה"
      });
    },
    onError: () => {
      toast({
        title: "שגיאה בהמרה",
        description: "לא הצלחנו להמיר את הליד ללקוח",
        variant: "destructive"
      });
    }
  });

  const resetForm = () => {
    setLeadForm({
      name: "",
      email: "",
      phone: "",
      source: "website",
      status: "new",
      priority: "medium",
      value: 0,
      notes: "",
      assignedTo: ""
    });
    setEditingLead(null);
  };

  const handleEditLead = (lead: Lead) => {
    setEditingLead(lead);
    setLeadForm({
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      source: lead.source,
      status: lead.status,
      priority: lead.priority,
      value: lead.value,
      notes: lead.notes || "",
      assignedTo: lead.assignedTo || ""
    });
    setIsLeadDialogOpen(true);
  };

  const handleNewLead = () => {
    resetForm();
    setIsLeadDialogOpen(true);
  };

  const handleSubmit = () => {
    leadMutation.mutate(leadForm);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      new: { label: "חדש", variant: "default" as const, color: "bg-blue-100 text-blue-800" },
      contacted: { label: "נוצר קשר", variant: "secondary" as const, color: "bg-yellow-100 text-yellow-800" },
      qualified: { label: "מוכשר", variant: "default" as const, color: "bg-green-100 text-green-800" },
      proposal: { label: "הצעה", variant: "outline" as const, color: "bg-purple-100 text-purple-800" },
      won: { label: "נסגר", variant: "default" as const, color: "bg-green-500 text-white" },
      lost: { label: "אבד", variant: "destructive" as const, color: "bg-red-100 text-red-800" }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.new;
    return <Badge variant={config.variant} className={config.color}>{config.label}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      low: { label: "נמוכה", color: "bg-gray-100 text-gray-800" },
      medium: { label: "בינונית", color: "bg-blue-100 text-blue-800" },
      high: { label: "גבוהה", color: "bg-orange-100 text-orange-800" },
      urgent: { label: "דחופה", color: "bg-red-100 text-red-800" }
    };

    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.medium;
    return <Badge variant="outline" className={config.color}>{config.label}</Badge>;
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'facebook': return '📘';
      case 'google': return '🔍';
      case 'website': return '🌐';
      case 'referral': return '👥';
      default: return '📝';
    }
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = searchQuery === "" || 
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTab = activeTab === "all" || lead.status === activeTab;
    
    return matchesSearch && matchesTab;
  });

  const leadStats = {
    total: leads.length,
    new: leads.filter(l => l.status === 'new').length,
    qualified: leads.filter(l => l.status === 'qualified').length,
    won: leads.filter(l => l.status === 'won').length,
    totalValue: leads.reduce((sum, lead) => sum + (lead.value || 0), 0)
  };

  return (
    <div className={cn("space-y-8", rtlClass())}>
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">ניהול לידים</h1>
          <p className="text-muted-foreground">
            נהל את כל הלידים שלך במקום אחד
          </p>
        </div>
        <Button onClick={handleNewLead} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          ליד חדש
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">סה"כ לידים</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leadStats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">לידים חדשים</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{leadStats.new}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">מוכשרים</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{leadStats.qualified}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">נסגרו</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{leadStats.won}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ערך כולל</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₪{leadStats.totalValue.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            סינון וחיפוש
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Label>חיפוש</Label>
              <Input
                placeholder="חפש לפי שם או אימייל..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div>
              <Label>סינון לפי מקור</Label>
              <Select value={filterSource} onValueChange={setFilterSource}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="כל המקורות" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">כל המקורות</SelectItem>
                  <SelectItem value="facebook">Facebook</SelectItem>
                  <SelectItem value="google">Google</SelectItem>
                  <SelectItem value="website">אתר</SelectItem>
                  <SelectItem value="referral">הפניה</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>סינון לפי עדיפות</Label>
              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="כל העדיפויות" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">כל העדיפויות</SelectItem>
                  <SelectItem value="low">נמוכה</SelectItem>
                  <SelectItem value="medium">בינונית</SelectItem>
                  <SelectItem value="high">גבוהה</SelectItem>
                  <SelectItem value="urgent">דחופה</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Leads Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="all">הכל ({leadStats.total})</TabsTrigger>
          <TabsTrigger value="new">חדשים ({leadStats.new})</TabsTrigger>
          <TabsTrigger value="contacted">נוצר קשר</TabsTrigger>
          <TabsTrigger value="qualified">מוכשרים</TabsTrigger>
          <TabsTrigger value="proposal">הצעות</TabsTrigger>
          <TabsTrigger value="won">נסגרו</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>רשימת לידים</CardTitle>
              <CardDescription>
                {filteredLeads.length} לידים מתוך {leads.length}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">טוען לידים...</div>
              ) : filteredLeads.length === 0 ? (
                <div className="text-center py-8">
                  <UserPlus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium">אין לידים</h3>
                  <p className="text-muted-foreground mb-4">התחל בהוספת הליד הראשון שלך</p>
                  <Button onClick={handleNewLead}>הוסף ליד חדש</Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">שם</TableHead>
                      <TableHead className="text-right">יצירת קשר</TableHead>
                      <TableHead className="text-right">מקור</TableHead>
                      <TableHead className="text-right">סטטוס</TableHead>
                      <TableHead className="text-right">עדיפות</TableHead>
                      <TableHead className="text-right">ערך צפוי</TableHead>
                      <TableHead className="text-right">תאריך יצירה</TableHead>
                      <TableHead className="text-right">פעולות</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLeads.map((lead) => (
                      <TableRow key={lead.id}>
                        <TableCell className="font-medium text-right">
                          <div>
                            <div className="font-medium">{lead.name}</div>
                            {lead.notes && (
                              <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                                {lead.notes}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-sm">
                              <Mail className="h-3 w-3" />
                              {lead.email}
                            </div>
                            <div className="flex items-center gap-1 text-sm">
                              <Phone className="h-3 w-3" />
                              {lead.phone}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center gap-2">
                            <span>{getSourceIcon(lead.source)}</span>
                            {lead.source}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {getStatusBadge(lead.status)}
                        </TableCell>
                        <TableCell className="text-right">
                          {getPriorityBadge(lead.priority)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ₪{lead.value?.toLocaleString() || 0}
                        </TableCell>
                        <TableCell className="text-right">
                          {new Date(lead.createdAt).toLocaleDateString('he-IL')}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditLead(lead)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            {lead.status !== 'won' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => convertMutation.mutate(lead.id)}
                                disabled={convertMutation.isPending}
                              >
                                <ArrowRight className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Lead Dialog */}
      <Dialog open={isLeadDialogOpen} onOpenChange={setIsLeadDialogOpen}>
        <DialogContent className="max-w-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle>
              {editingLead ? 'עריכת ליד' : 'הוספת ליד חדש'}
            </DialogTitle>
            <DialogDescription>
              {editingLead ? 'ערוך את פרטי הליד' : 'הוסף ליד חדש למערכת'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">שם מלא *</Label>
                <Input
                  id="name"
                  value={leadForm.name}
                  onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })}
                  placeholder="הכנס שם מלא"
                />
              </div>
              <div>
                <Label htmlFor="email">אימייל *</Label>
                <Input
                  id="email"
                  type="email"
                  value={leadForm.email}
                  onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
                  placeholder="example@domain.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">טלפון</Label>
                <Input
                  id="phone"
                  value={leadForm.phone}
                  onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })}
                  placeholder="050-1234567"
                />
              </div>
              <div>
                <Label htmlFor="value">ערך צפוי (₪)</Label>
                <Input
                  id="value"
                  type="number"
                  value={leadForm.value}
                  onChange={(e) => setLeadForm({ ...leadForm, value: Number(e.target.value) })}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="source">מקור</Label>
                <Select value={leadForm.source} onValueChange={(value) => setLeadForm({ ...leadForm, source: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="facebook">Facebook</SelectItem>
                    <SelectItem value="google">Google</SelectItem>
                    <SelectItem value="website">אתר</SelectItem>
                    <SelectItem value="referral">הפניה</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="status">סטטוס</Label>
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
              <div>
                <Label htmlFor="priority">עדיפות</Label>
                <Select value={leadForm.priority} onValueChange={(value) => setLeadForm({ ...leadForm, priority: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">נמוכה</SelectItem>
                    <SelectItem value="medium">בינונית</SelectItem>
                    <SelectItem value="high">גבוהה</SelectItem>
                    <SelectItem value="urgent">דחופה</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="notes">הערות</Label>
              <Textarea
                id="notes"
                value={leadForm.notes}
                onChange={(e) => setLeadForm({ ...leadForm, notes: e.target.value })}
                placeholder="הערות נוספות על הליד..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLeadDialogOpen(false)}>
              ביטול
            </Button>
            <Button onClick={handleSubmit} disabled={leadMutation.isPending || !leadForm.name || !leadForm.email}>
              {leadMutation.isPending ? "שומר..." : editingLead ? "עדכן ליד" : "הוסף ליד"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}