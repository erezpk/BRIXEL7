import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Phone, Mail, MessageCircle, Calendar, Clock, User, Filter, Search, FileText, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// Communication types
const communicationTypes = [
  { value: "phone_call", label: "שיחת טלפון", icon: Phone, color: "bg-blue-500" },
  { value: "email", label: "אימייל", icon: Mail, color: "bg-green-500" },
  { value: "whatsapp", label: "וואטסאפ", icon: MessageCircle, color: "bg-green-600" },
  { value: "sms", label: "הודעת SMS", icon: MessageCircle, color: "bg-orange-500" },
  { value: "meeting", label: "פגישה", icon: Calendar, color: "bg-purple-500" },
  { value: "summary", label: "סיכום", icon: FileText, color: "bg-gray-500" },
];

const communicationStatusOptions = [
  { value: "completed", label: "הושלמה", color: "text-green-600" },
  { value: "scheduled", label: "מתוכננת", color: "text-blue-600" },
  { value: "failed", label: "נכשלה", color: "text-red-600" },
  { value: "cancelled", label: "בוטלה", color: "text-gray-600" },
];

// Schema for new communication
const communicationSchema = z.object({
  type: z.string().min(1, "יש לבחור סוג תקשורת"),
  contactType: z.enum(["lead", "client"]),
  contactId: z.string().min(1, "יש לבחור ליד או לקוח"),
  subject: z.string().min(1, "נושא נדרש"),
  content: z.string().min(1, "תוכן נדרש"),
  status: z.string().default("completed"),
  scheduledDate: z.string().optional(),
  duration: z.number().optional(),
  outcome: z.string().optional(),
  followUpRequired: z.boolean().default(false),
  followUpDate: z.string().optional(),
  tags: z.array(z.string()).default([]),
});

interface Communication {
  id: string;
  type: string;
  contactType: 'lead' | 'client';
  contactId: string;
  contactName: string;
  subject: string;
  content: string;
  status: string;
  scheduledDate?: string;
  completedDate?: string;
  duration?: number;
  outcome?: string;
  followUpRequired: boolean;
  followUpDate?: string;
  tags: string[];
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}

export default function CommunicationsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Queries
  const { data: communications = [], isLoading } = useQuery({
    queryKey: ["/api/communications"],
  });

  const { data: leads } = useQuery({
    queryKey: ["/api/leads"],
  });

  const { data: clients } = useQuery({
    queryKey: ["/api/clients"],
  });

  const { data: users } = useQuery({
    queryKey: ["/api/users"],
  });

  // Form
  const form = useForm({
    resolver: zodResolver(communicationSchema),
    defaultValues: {
      type: "",
      contactType: "lead" as const,
      contactId: "",
      subject: "",
      content: "",
      status: "completed",
      scheduledDate: "",
      duration: undefined,
      outcome: "",
      followUpRequired: false,
      followUpDate: "",
      tags: [],
    },
  });

  // Mutations
  const createCommunicationMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/communications", data);
    },
    onSuccess: () => {
      toast({ title: "רשומת תקשורת נוספה בהצלחה" });
      queryClient.invalidateQueries({ queryKey: ["/api/communications"] });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "שגיאה",
        description: error.message || "שגיאה בהוספת רשומת התקשורת",
        variant: "destructive",
      });
    },
  });

  // Filter communications
  const filteredCommunications = communications.filter((comm: Communication) => {
    const matchesSearch = searchTerm === "" || 
      comm.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comm.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comm.content.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === "all" || comm.type === filterType;
    const matchesStatus = filterStatus === "all" || comm.status === filterStatus;
    const matchesTab = activeTab === "all" || comm.contactType === activeTab;

    return matchesSearch && matchesType && matchesStatus && matchesTab;
  });

  const getTypeIcon = (type: string) => {
    const typeConfig = communicationTypes.find(t => t.value === type);
    return typeConfig ? typeConfig.icon : MessageCircle;
  };

  const getTypeColor = (type: string) => {
    const typeConfig = communicationTypes.find(t => t.value === type);
    return typeConfig ? typeConfig.color : "bg-gray-500";
  };

  const getStatusColor = (status: string) => {
    const statusConfig = communicationStatusOptions.find(s => s.value === status);
    return statusConfig ? statusConfig.color : "text-gray-600";
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('he-IL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const onSubmit = (data: any) => {
    createCommunicationMutation.mutate(data);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">תקשורת עם לקוחות ולידים</h1>
          <p className="text-muted-foreground">מעקב אחר כל התקשורת, פגישות וסיכומים</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 ml-2" />
              תקשורת חדשה
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>הוספת רשומת תקשורת</DialogTitle>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>סוג תקשורת</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="בחר סוג תקשורת" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {communicationTypes.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                <div className="flex items-center gap-2">
                                  <type.icon className="h-4 w-4" />
                                  {type.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="contactType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>סוג איש קשר</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="בחר סוג איש קשר" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="lead">ליד</SelectItem>
                            <SelectItem value="client">לקוח</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="contactId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {form.watch("contactType") === "lead" ? "ליד" : "לקוח"}
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={`בחר ${form.watch("contactType") === "lead" ? "ליד" : "לקוח"}`} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(form.watch("contactType") === "lead" ? leads : clients)?.map((contact: any) => (
                            <SelectItem key={contact.id} value={contact.id}>
                              {contact.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>נושא</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="נושא התקשורת" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>תוכן ופרטים</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="פרט על התקשורת, תוכן השיחה, סיכומים וכו'"
                          rows={4}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>סטטוס</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="בחר סטטוס" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {communicationStatusOptions.map((status) => (
                              <SelectItem key={status.value} value={status.value}>
                                {status.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>משך (דקות)</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="number"
                            placeholder="משך השיחה בדקות"
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {form.watch("status") === "scheduled" && (
                  <FormField
                    control={form.control}
                    name="scheduledDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>תאריך ושעה מתוכננים</FormLabel>
                        <FormControl>
                          <Input {...field} type="datetime-local" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="outcome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>תוצאה ומסקנות</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="מה היו התוצאות? מה הוחלט? צעדים הבאים?"
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    ביטול
                  </Button>
                  <Button type="submit" disabled={createCommunicationMutation.isPending}>
                    {createCommunicationMutation.isPending ? "שומר..." : "שמור"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="חיפוש לפי נושא, איש קשר או תוכן..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="סוג תקשורת" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל הסוגים</SelectItem>
                {communicationTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="סטטוס" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל הסטטוסים</SelectItem>
                {communicationStatusOptions.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">הכל</TabsTrigger>
          <TabsTrigger value="lead">לידים</TabsTrigger>
          <TabsTrigger value="client">לקוחות</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8">טוען...</div>
          ) : filteredCommunications.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">אין רשומות תקשורת</h3>
                <p className="text-muted-foreground mb-4">
                  התחל לתעד את התקשורת שלך עם לקוחות ולידים
                </p>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="h-4 w-4 ml-2" />
                  הוסף רשומת תקשורת
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredCommunications.map((comm: Communication) => {
                const TypeIcon = getTypeIcon(comm.type);
                return (
                  <Card key={comm.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <div className={`p-2 rounded-lg ${getTypeColor(comm.type)} text-white`}>
                          <TypeIcon className="h-5 w-5" />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="font-semibold text-lg">{comm.subject}</h4>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <User className="h-3 w-3" />
                                <span>{comm.contactName}</span>
                                <Badge variant="outline" className="text-xs">
                                  {comm.contactType === 'lead' ? 'ליד' : 'לקוח'}
                                </Badge>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className={getStatusColor(comm.status)}>
                                {communicationStatusOptions.find(s => s.value === comm.status)?.label}
                              </Badge>
                              {comm.followUpRequired && (
                                <Badge variant="outline" className="text-orange-600">
                                  דרוש מעקב
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          <p className="text-gray-700 mb-3">{comm.content}</p>
                          
                          {comm.outcome && (
                            <div className="p-3 bg-muted rounded-lg mb-3">
                              <h5 className="font-medium text-sm mb-1">תוצאה ומסקנות:</h5>
                              <p className="text-sm">{comm.outcome}</p>
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {comm.duration ? `${comm.duration} דקות` : formatDateTime(comm.createdAt)}
                              </div>
                              <span>על ידי: {comm.createdByName}</span>
                            </div>
                            
                            {comm.scheduledDate && (
                              <div className="flex items-center gap-1 text-blue-600">
                                <Calendar className="h-3 w-3" />
                                {formatDateTime(comm.scheduledDate)}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}