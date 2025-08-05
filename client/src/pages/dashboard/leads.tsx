import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, Facebook, Chrome, UserPlus, TrendingUp, Filter, RefreshCw, MessageSquare, Phone, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { rtlClass } from "@/lib/rtl";
import type { Lead } from "@shared/schema";

interface LeadFormData {
  name: string;
  email: string;
  phone: string;
  source: string;
  status: string;
  priority: string;
  budget: string;
  notes: string;
}

interface ConvertFormData {
  name: string;
  email: string;
  phone: string;
  company: string;
  industry: string;
}

export default function LeadsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [isNewLeadOpen, setIsNewLeadOpen] = useState(false);
  const [isConvertOpen, setIsConvertOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [leadForm, setLeadForm] = useState<LeadFormData>({
    name: "",
    email: "",
    phone: "",
    source: "manual",
    status: "new",
    priority: "medium",
    budget: "",
    notes: ""
  });
  const [convertForm, setConvertForm] = useState<ConvertFormData>({
    name: "",
    email: "",
    phone: "",
    company: "",
    industry: ""
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: leads, isLoading } = useQuery({
    queryKey: ['/api/leads', statusFilter, sourceFilter],
    enabled: true
  });

  const createLeadMutation = useMutation({
    mutationFn: async (data: LeadFormData) => {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          budget: data.budget ? parseInt(data.budget) * 100 : null // Convert to agorot
        })
      });
      if (!response.ok) throw new Error('Failed to create lead');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
      setIsNewLeadOpen(false);
      setLeadForm({
        name: "",
        email: "",
        phone: "",
        source: "manual",
        status: "new",
        priority: "medium",
        budget: "",
        notes: ""
      });
      toast({
        title: "ליד נוצר בהצלחה",
        description: "הליד החדש נוסף למערכת"
      });
    },
    onError: () => {
      toast({
        title: "שגיאה ביצירת ליד",
        description: "אנא נסה שוב",
        variant: "destructive"
      });
    }
  });

  const convertLeadMutation = useMutation({
    mutationFn: async ({ leadId, data }: { leadId: string; data: ConvertFormData }) => {
      const response = await fetch(`/api/leads/${leadId}/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to convert lead');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      setIsConvertOpen(false);
      setSelectedLead(null);
      setConvertForm({
        name: "",
        email: "",
        phone: "",
        company: "",
        industry: ""
      });
      toast({
        title: "ליד הומר ללקוח בהצלחה",
        description: "הליד הומר ללקוח חדש במערכת"
      });
    },
    onError: () => {
      toast({
        title: "שגיאה בהמרת ליד",
        description: "אנא נסה שוב",
        variant: "destructive"
      });
    }
  });

  const syncFacebookMutation = useMutation({
    mutationFn: async (accessToken: string) => {
      const response = await fetch('/api/ads/facebook/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken })
      });
      if (!response.ok) throw new Error('Failed to sync Facebook leads');
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
      toast({
        title: "סנכרון פייסבוק הושלם",
        description: data.message
      });
    },
    onError: () => {
      toast({
        title: "שגיאה בסנכרון פייסבוק",
        description: "אנא בדוק את הגדרות החיבור",
        variant: "destructive"
      });
    }
  });

  const syncGoogleMutation = useMutation({
    mutationFn: async (accessToken: string) => {
      const response = await fetch('/api/ads/google/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken })
      });
      if (!response.ok) throw new Error('Failed to sync Google leads');
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
      toast({
        title: "סנכרון גוגל הושלם",
        description: data.message
      });
    },
    onError: () => {
      toast({
        title: "שגיאה בסנכרון גוגל",
        description: "אנא בדוק את הגדרות החיבור",
        variant: "destructive"
      });
    }
  });

  const filteredLeads = (leads || [])?.filter((lead: Lead) => {
    const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
    const matchesSource = sourceFilter === "all" || lead.source === sourceFilter;
    return matchesSearch && matchesStatus && matchesSource;
  }) || [];

  const getStatusBadge = (status: string) => {
    const variants = {
      new: "default",
      contacted: "secondary",
      qualified: "outline",
      converted: "default",
      lost: "destructive"
    } as const;
    
    const labels = {
      new: "חדש",
      contacted: "נוצר קשר",
      qualified: "מוכשר",
      converted: "הומר",
      lost: "אבד"
    };
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || "default"}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'facebook_ads':
        return <Facebook className="h-4 w-4" />;
      case 'google_ads':
        return <Chrome className="h-4 w-4" />;
      default:
        return <UserPlus className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-500';
      case 'medium':
        return 'text-yellow-500';
      case 'low':
        return 'text-green-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className={cn("space-y-8", rtlClass())}>
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">לידים</h1>
          <p className="text-muted-foreground">
            ניהול לידים וסנכרון מפייסבוק ואדס וגוגל אדס
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => syncFacebookMutation.mutate('mock-token')}
            disabled={syncFacebookMutation.isPending}
          >
            {syncFacebookMutation.isPending ? <RefreshCw className="h-4 w-4 animate-spin me-2" /> : <Facebook className="h-4 w-4 me-2" />}
            סנכרן פייסבוק
          </Button>
          <Button 
            variant="outline"
            onClick={() => syncGoogleMutation.mutate('mock-token')}
            disabled={syncGoogleMutation.isPending}
          >
            {syncGoogleMutation.isPending ? <RefreshCw className="h-4 w-4 animate-spin me-2" /> : <Chrome className="h-4 w-4 me-2" />}
            סנכרן גוגל
          </Button>
          <Dialog open={isNewLeadOpen} onOpenChange={setIsNewLeadOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 me-2" />
                ליד חדש
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>הוספת ליד חדש</DialogTitle>
                <DialogDescription>
                  הזן את פרטי הליד החדש
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">שם מלא *</Label>
                  <Input
                    id="name"
                    value={leadForm.name}
                    onChange={(e) => setLeadForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="הזן שם מלא"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">אימייל</Label>
                  <Input
                    id="email"
                    type="email"
                    value={leadForm.email}
                    onChange={(e) => setLeadForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="הזן כתובת אימייל"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">טלפון</Label>
                  <Input
                    id="phone"
                    value={leadForm.phone}
                    onChange={(e) => setLeadForm(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="הזן מספר טלפון"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="source">מקור</Label>
                    <Select value={leadForm.source} onValueChange={(value) => setLeadForm(prev => ({ ...prev, source: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual">ידני</SelectItem>
                        <SelectItem value="website">אתר</SelectItem>
                        <SelectItem value="facebook_ads">פייסבוק אדס</SelectItem>
                        <SelectItem value="google_ads">גוגל אדס</SelectItem>
                        <SelectItem value="referral">הפניה</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="priority">עדיפות</Label>
                    <Select value={leadForm.priority} onValueChange={(value) => setLeadForm(prev => ({ ...prev, priority: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">נמוכה</SelectItem>
                        <SelectItem value="medium">בינונית</SelectItem>
                        <SelectItem value="high">גבוהה</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="budget">תקציב (₪)</Label>
                  <Input
                    id="budget"
                    type="number"
                    value={leadForm.budget}
                    onChange={(e) => setLeadForm(prev => ({ ...prev, budget: e.target.value }))}
                    placeholder="הזן תקציב משוער"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="notes">הערות</Label>
                  <Textarea
                    id="notes"
                    value={leadForm.notes}
                    onChange={(e) => setLeadForm(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="הערות נוספות על הליד"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" onClick={() => createLeadMutation.mutate(leadForm)} disabled={createLeadMutation.isPending || !leadForm.name.trim()}>
                  {createLeadMutation.isPending ? "יוצר..." : "צור ליד"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 items-center flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute start-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="חיפוש לידים..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="ps-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="סטטוס" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל הסטטוסים</SelectItem>
                <SelectItem value="new">חדש</SelectItem>
                <SelectItem value="contacted">נוצר קשר</SelectItem>
                <SelectItem value="qualified">מוכשר</SelectItem>
                <SelectItem value="converted">הומר</SelectItem>
                <SelectItem value="lost">אבד</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="מקור" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל המקורות</SelectItem>
                <SelectItem value="manual">ידני</SelectItem>
                <SelectItem value="website">אתר</SelectItem>
                <SelectItem value="facebook_ads">פייסבוק אדס</SelectItem>
                <SelectItem value="google_ads">גוגל אדס</SelectItem>
                <SelectItem value="referral">הפניה</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Leads Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLeads.map((lead: Lead) => (
            <Card key={lead.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{lead.name}</CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      {getSourceIcon(lead.source)}
                      <span className="capitalize">
                        {lead.source === 'facebook_ads' ? 'פייסבוק אדס' :
                         lead.source === 'google_ads' ? 'גוגל אדס' :
                         lead.source === 'website' ? 'אתר' :
                         lead.source === 'referral' ? 'הפניה' : 'ידני'}
                      </span>
                    </CardDescription>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {getStatusBadge(lead.status)}
                    <div className={cn("text-sm font-medium", getPriorityColor(lead.priority))}>
                      {lead.priority === 'high' ? 'גבוהה' :
                       lead.priority === 'medium' ? 'בינונית' : 'נמוכה'}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {lead.email && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      {lead.email}
                    </div>
                  )}
                  {lead.phone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      {lead.phone}
                    </div>
                  )}
                  {lead.budget && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <TrendingUp className="h-4 w-4" />
                      ₪{(lead.budget / 100).toLocaleString()}
                    </div>
                  )}
                  {lead.notes && (
                    <div className="flex items-start gap-2 text-sm text-muted-foreground">
                      <MessageSquare className="h-4 w-4 mt-0.5" />
                      <span className="line-clamp-2">{lead.notes}</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 mt-4">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => {
                      setSelectedLead(lead);
                      setConvertForm({
                        name: lead.name,
                        email: lead.email || "",
                        phone: lead.phone || "",
                        company: "",
                        industry: ""
                      });
                      setIsConvertOpen(true);
                    }}
                    disabled={lead.status === 'converted'}
                  >
                    המר ללקוח
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {filteredLeads.length === 0 && !isLoading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <UserPlus className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">אין לידים</h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchTerm || statusFilter !== "all" || sourceFilter !== "all"
                ? "לא נמצאו לידים המתאימים לחיפוש"
                : "עדיין לא נוספו לידים למערכת"}
            </p>
            <Button onClick={() => setIsNewLeadOpen(true)}>
              <Plus className="h-4 w-4 me-2" />
              הוסף ליד ראשון
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Convert Lead Dialog */}
      <Dialog open={isConvertOpen} onOpenChange={setIsConvertOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>המרת ליד ללקוח</DialogTitle>
            <DialogDescription>
              המר את הליד "{selectedLead?.name}" ללקוח במערכת
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="convert-name">שם הלקוח *</Label>
              <Input
                id="convert-name"
                value={convertForm.name}
                onChange={(e) => setConvertForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="הזן שם הלקוח"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="convert-email">אימייל</Label>
              <Input
                id="convert-email"
                type="email"
                value={convertForm.email}
                onChange={(e) => setConvertForm(prev => ({ ...prev, email: e.target.value }))}
                placeholder="הזן כתובת אימייל"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="convert-phone">טלפון</Label>
              <Input
                id="convert-phone"
                value={convertForm.phone}
                onChange={(e) => setConvertForm(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="הזן מספר טלפון"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="convert-company">חברה</Label>
              <Input
                id="convert-company"
                value={convertForm.company}
                onChange={(e) => setConvertForm(prev => ({ ...prev, company: e.target.value }))}
                placeholder="הזן שם החברה"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="convert-industry">תחום</Label>
              <Select value={convertForm.industry} onValueChange={(value) => setConvertForm(prev => ({ ...prev, industry: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="בחר תחום" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="technology">טכנולוגיה</SelectItem>
                  <SelectItem value="retail">קמעונאות</SelectItem>
                  <SelectItem value="healthcare">בריאות</SelectItem>
                  <SelectItem value="finance">פיננסים</SelectItem>
                  <SelectItem value="education">חינוך</SelectItem>
                  <SelectItem value="real-estate">נדל"ן</SelectItem>
                  <SelectItem value="food">מזון ומשקאות</SelectItem>
                  <SelectItem value="other">אחר</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="submit" 
              onClick={() => selectedLead && convertLeadMutation.mutate({ 
                leadId: selectedLead.id, 
                data: convertForm 
              })} 
              disabled={convertLeadMutation.isPending}
            >
              {convertLeadMutation.isPending ? "ממיר..." : "המר ללקוח"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}