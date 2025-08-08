import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Plus, Eye, EyeOff, Filter, LayoutGrid, List, UserPlus, Phone, Mail, Calendar, DollarSign, Star, MoreHorizontal, Trash2, Edit, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";

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

export default function Leads() {
  const [isLeadDialogOpen, setIsLeadDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [filters, setFilters] = useState({
    status: "all",
    source: "all",
    priority: "all",
    assignedTo: "all",
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

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: leads = [], isLoading, error } = useQuery<Lead[]>({
    queryKey: ['/api/leads'],
    retry: 3,
    retryDelay: 1000,
  });

  const { data: users = [] } = useQuery<any[]>({
    queryKey: ['/api/users'],
  });

  const leadMutation = useMutation({
    mutationFn: async (leadData: any) => {
      if (editingLead) {
        return apiRequest(`/api/leads/${editingLead.id}`, 'PUT', leadData);
      } else {
        return apiRequest('/api/leads', 'POST', leadData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
      setIsLeadDialogOpen(false);
      setEditingLead(null);
      resetForm();
      toast({
        title: "הצלחה",
        description: editingLead ? "הליד עודכן בהצלחה" : "הליד נוצר בהצלחה",
      });
    },
    onError: (error) => {
      toast({
        title: "שגיאה",
        description: `שגיאה ב${editingLead ? 'עדכון' : 'יצירת'} הליד`,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (leadId: string) => {
      return apiRequest(`/api/leads/${leadId}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
      toast({
        title: "הצלחה",
        description: "הליד נמחק בהצלחה",
      });
    },
    onError: () => {
      toast({
        title: "שגיאה",
        description: "שגיאה במחיקת הליד",
        variant: "destructive",
      });
    },
  });

  const convertMutation = useMutation({
    mutationFn: async (leadId: string) => {
      return apiRequest(`/api/leads/${leadId}/convert`, 'POST');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      toast({
        title: "הצלחה",
        description: "הליד הומר ללקוח בהצלחה",
      });
    },
    onError: () => {
      toast({
        title: "שגיאה",
        description: "שגיאה בהמרת הליד",
        variant: "destructive",
      });
    },
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
      assignedTo: "unassigned",
    });
  };

  const handleSubmit = () => {
    if (!leadForm.name || !leadForm.email) {
      toast({
        title: "שגיאה",
        description: "שם ואימייל הם שדות חובה",
        variant: "destructive",
      });
      return;
    }

    const leadData = {
      ...leadForm,
      assignedTo: leadForm.assignedTo && leadForm.assignedTo !== 'unassigned' ? leadForm.assignedTo : null
    };

    leadMutation.mutate(leadData);
  };

  const handleEdit = (lead: Lead) => {
    setEditingLead(lead);
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
    setIsLeadDialogOpen(true);
  };

  const handleDelete = (leadId: string) => {
    if (confirm("האם אתה בטוח שברצונך למחוק את הליד?")) {
      deleteMutation.mutate(leadId);
    }
  };

  const handleConvert = (leadId: string) => {
    if (confirm("האם ברצונך להמיר את הליד ללקוח?")) {
      convertMutation.mutate(leadId);
    }
  };

  // Drag and Drop handler
  const handleDragEnd = (result: any) => {
    const { destination, source, draggableId } = result;

    // If dropped outside a valid area
    if (!destination) {
      return;
    }

    // If dropped in the same place
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    // Update lead status
    const newStatus = destination.droppableId;
    const leadToUpdate = leads.find((lead: Lead) => lead.id === draggableId);
    
    if (leadToUpdate && leadToUpdate.status !== newStatus) {
      updateLeadMutation.mutate({
        id: leadToUpdate.id,
        status: newStatus
      });
    }
  };

  // Update lead mutation for drag and drop
  const updateLeadMutation = useMutation({
    mutationFn: async (updatedLead: { id: string; status: string }) => {
      return apiRequest(`/api/leads/${updatedLead.id}`, 'PUT', { status: updatedLead.status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
      toast({
        title: "הצלחה",
        description: "סטטוס הליד עודכן בהצלחה",
      });
    },
    onError: () => {
      toast({
        title: "שגיאה",
        description: "שגיאה בעדכון סטטוס הליד",
        variant: "destructive",
      });
    },
  });

  const filteredLeads = leads.filter((lead: Lead) => {
    return (
      (!filters.status || filters.status === "all" || lead.status === filters.status) &&
      (!filters.source || filters.source === "all" || lead.source === filters.source) &&
      (!filters.priority || filters.priority === "all" || lead.priority === filters.priority) &&
      (!filters.assignedTo || filters.assignedTo === "all" || (filters.assignedTo === "unassigned" ? !lead.assignedTo : lead.assignedTo === filters.assignedTo))
    );
  });

  const groupedByStatus = statusOptions.reduce((acc, status) => {
    acc[status.value] = filteredLeads.filter((lead: Lead) => lead.status === status.value);
    return acc;
  }, {} as Record<string, Lead[]>);

  const getStatusLabel = (status: string) => {
    return statusOptions.find(s => s.value === status)?.label || status;
  };

  const getStatusColor = (status: string) => {
    return statusOptions.find(s => s.value === status)?.color || "bg-gray-500";
  };

  const getPriorityColor = (priority: string) => {
    return priorityOptions.find(p => p.value === priority)?.color || "text-gray-600";
  };

  const getSourceLabel = (source: string) => {
    return sourceOptions.find(s => s.value === source)?.label || source;
  };

  const getUserName = (userId: string) => {
    const user = users.find((u: any) => u.id === userId);
    return user ? `${user.firstName} ${user.lastName}` : 'לא משויך';
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">טוען...</div>;
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-4">שגיאה בטעינת לידים</p>
          <Button onClick={() => window.location.reload()}>נסה שוב</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">ניהול לידים</h1>
          <p className="text-muted-foreground">נהל והמר לידים ללקוחות</p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'kanban' | 'table')}>
            <TabsList>
              <TabsTrigger value="kanban" className="flex items-center gap-2">
                <LayoutGrid className="h-4 w-4" />
                קאנבן
              </TabsTrigger>
              <TabsTrigger value="table" className="flex items-center gap-2">
                <List className="h-4 w-4" />
                טבלה
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <Dialog open={isLeadDialogOpen} onOpenChange={setIsLeadDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetForm(); setEditingLead(null); }}>
                <Plus className="h-4 w-4 ml-2" />
                ליד חדש
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingLead ? "ערוך ליד" : "ליד חדש"}</DialogTitle>
              </DialogHeader>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">שם *</Label>
                  <Input
                    id="name"
                    value={leadForm.name}
                    onChange={(e) => setLeadForm({...leadForm, name: e.target.value})}
                    placeholder="שם הליד"
                  />
                </div>

                <div>
                  <Label htmlFor="email">אימייל *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={leadForm.email}
                    onChange={(e) => setLeadForm({...leadForm, email: e.target.value})}
                    placeholder="example@domain.com"
                  />
                </div>

                <div>
                  <Label htmlFor="phone">טלפון</Label>
                  <Input
                    id="phone"
                    value={leadForm.phone}
                    onChange={(e) => setLeadForm({...leadForm, phone: e.target.value})}
                    placeholder="050-123-4567"
                  />
                </div>

                <div>
                  <Label htmlFor="source">מקור</Label>
                  <Select value={leadForm.source} onValueChange={(value) => setLeadForm({...leadForm, source: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="select_source">בחר מקור</SelectItem>
                      {sourceOptions.map(source => (
                        <SelectItem key={source.value} value={source.value}>
                          {source.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="status">סטטוס</Label>
                  <Select value={leadForm.status} onValueChange={(value) => setLeadForm({...leadForm, status: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map(status => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="priority">עדיפות</Label>
                  <Select value={leadForm.priority} onValueChange={(value) => setLeadForm({...leadForm, priority: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {priorityOptions.map(priority => (
                        <SelectItem key={priority.value} value={priority.value}>
                          {priority.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="value">ערך פוטנציאלי (₪)</Label>
                  <Input
                    id="value"
                    type="number"
                    value={leadForm.value}
                    onChange={(e) => setLeadForm({...leadForm, value: Number(e.target.value)})}
                    placeholder="0"
                  />
                </div>

                <div>
                  <Label htmlFor="assignedTo">משויך ל</Label>
                  <Select value={leadForm.assignedTo} onValueChange={(value) => setLeadForm({...leadForm, assignedTo: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="בחר משתמש" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">לא משויך</SelectItem>
                      {users.map((user: any) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.firstName} {user.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="notes">הערות</Label>
                <Textarea
                  id="notes"
                  value={leadForm.notes}
                  onChange={(e) => setLeadForm({...leadForm, notes: e.target.value})}
                  placeholder="הערות נוספות..."
                  rows={3}
                />
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
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            פילטרים
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>סטטוס</Label>
              <Select value={filters.status} onValueChange={(value) => setFilters({...filters, status: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="כל הסטטוסים" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">כל הסטטוסים</SelectItem>
                  {statusOptions.map(status => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>מקור</Label>
              <Select value={filters.source} onValueChange={(value) => setFilters({...filters, source: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="כל המקורות" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">כל המקורות</SelectItem>
                  {sourceOptions.map(source => (
                    <SelectItem key={source.value} value={source.value}>
                      {source.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>עדיפות</Label>
              <Select value={filters.priority} onValueChange={(value) => setFilters({...filters, priority: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="כל העדיפויות" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">כל העדיפויות</SelectItem>
                  {priorityOptions.map(priority => (
                    <SelectItem key={priority.value} value={priority.value}>
                      {priority.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>משויך ל</Label>
              <Select value={filters.assignedTo} onValueChange={(value) => setFilters({...filters, assignedTo: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="כולם" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">כולם</SelectItem>
                  {users.map((user: any) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.firstName} {user.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      {viewMode === 'kanban' ? (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 min-h-[calc(100vh-350px)] overflow-hidden">
            {statusOptions.map(status => (
              <Card key={status.value} className="flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${status.color}`} />
                      <CardTitle className="text-sm">{status.label}</CardTitle>
                    </div>
                    <Badge variant="secondary">{groupedByStatus[status.value]?.length || 0}</Badge>
                  </div>
                </CardHeader>
                <Droppable droppableId={status.value}>
                  {(provided, snapshot) => (
                    <CardContent
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className={cn(
                        "flex-1 space-y-3 h-[500px] overflow-y-auto",
                        snapshot.isDraggingOver && "bg-blue-50 dark:bg-blue-900/20"
                      )}
                    >
                      {groupedByStatus[status.value]?.map((lead: Lead, index: number) => (
                        <Draggable key={lead.id} draggableId={lead.id} index={index}>
                          {(provided, snapshot) => (
                            <Card 
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={cn(
                                "p-4 hover:shadow-lg transition-all duration-200 cursor-pointer border-l-4 border-l-gray-200 hover:border-l-blue-500",
                                snapshot.isDragging && "rotate-2 shadow-xl"
                              )}
                              onClick={() => {
                                console.log('Navigating to lead:', lead.id);
                                window.location.href = `/dashboard/leads/${lead.id}`;
                              }}
                            >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <h4 className="font-medium text-sm">{lead.name}</h4>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-6 w-6 p-0"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => {
                              console.log('Navigating to lead via dropdown:', lead.id);
                              window.location.href = `/dashboard/leads/${lead.id}`;
                            }}>
                              <Eye className="h-4 w-4 ml-2" />
                              פרטי ליד
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(lead)}>
                              <Edit className="h-4 w-4 ml-2" />
                              ערוך
                            </DropdownMenuItem>
                            {lead.status !== 'won' && (
                              <DropdownMenuItem onClick={() => handleConvert(lead.id)}>
                                <UserPlus className="h-4 w-4 ml-2" />
                                המר ללקוח
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => handleDelete(lead.id)} className="text-red-600">
                              <Trash2 className="h-4 w-4 ml-2" />
                              מחק
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {lead.email && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          {lead.email}
                        </div>
                      )}

                      {lead.phone && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          {lead.phone}
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-xs">
                          {getSourceLabel(lead.source)}
                        </Badge>
                        <span className={`text-xs font-medium ${getPriorityColor(lead.priority)}`}>
                          {priorityOptions.find(p => p.value === lead.priority)?.label}
                        </span>
                      </div>

                      {lead.value && lead.value > 0 && (
                        <div className="flex items-center gap-1 text-xs text-green-600">
                          <DollarSign className="h-3 w-3" />
                          ₪{lead.value.toLocaleString()}
                        </div>
                      )}

                      {lead.assignedTo && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <User className="h-3 w-3" />
                          {getUserName(lead.assignedTo)}
                        </div>
                      )}
                              </div>
                            </Card>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </CardContent>
                  )}
                </Droppable>
              </Card>
            ))}
          </div>
        </DragDropContext>
      ) : (
        <Card className="mb-8">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>שם</TableHead>
                <TableHead>אימייל</TableHead>
                <TableHead>טלפון</TableHead>
                <TableHead>מקור</TableHead>
                <TableHead>סטטוס</TableHead>
                <TableHead>עדיפות</TableHead>
                <TableHead>ערך</TableHead>
                <TableHead>משויך ל</TableHead>
                <TableHead>תאריך יצירה</TableHead>
                <TableHead>פעולות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeads.map((lead: Lead) => (
                <TableRow key={lead.id}>
                  <TableCell className="font-medium">{lead.name}</TableCell>
                  <TableCell>{lead.email || '-'}</TableCell>
                  <TableCell>{lead.phone || '-'}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{getSourceLabel(lead.source)}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={`${getStatusColor(lead.status)} text-white`}>
                      {getStatusLabel(lead.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className={`font-medium ${getPriorityColor(lead.priority)}`}>
                      {priorityOptions.find(p => p.value === lead.priority)?.label}
                    </span>
                  </TableCell>
                  <TableCell>
                    {lead.value && lead.value > 0 ? `₪${lead.value.toLocaleString()}` : '-'}
                  </TableCell>
                  <TableCell>{lead.assignedTo ? getUserName(lead.assignedTo) : '-'}</TableCell>
                  <TableCell>{new Date(lead.createdAt).toLocaleDateString('he-IL')}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => {
                          console.log('Navigating to lead via table dropdown:', lead.id);
                          window.location.href = `/dashboard/leads/${lead.id}`;
                        }}>
                          <Eye className="h-4 w-4 ml-2" />
                          פרטי ליד
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(lead)}>
                          <Edit className="h-4 w-4 ml-2" />
                          ערוך
                        </DropdownMenuItem>
                        {lead.status !== 'won' && (
                          <DropdownMenuItem onClick={() => handleConvert(lead.id)}>
                            <UserPlus className="h-4 w-4 ml-2" />
                            המר ללקוח
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => handleDelete(lead.id)} className="text-red-600">
                          <Trash2 className="h-4 w-4 ml-2" />
                          מחק
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}


    </div>
  );
}