import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import ClientCard from "@/components/clients/client-card";
import NewClientModal from "@/components/modals/new-client-modal";
import { Plus, Search, Users, Grid, List, Eye, Edit, MoreHorizontal, Trash2, Send } from "lucide-react";
import { type Client } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

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

export default function Clients() {
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Send login credentials to client
  const sendCredentialsMutation = useMutation({
    mutationFn: async (clientId: string) => {
      const client = clients?.find(c => c.id === clientId);
      const response = await fetch(`/api/clients/${clientId}/send-credentials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          username: client?.email,
          password: `${client?.name.toLowerCase().replace(/\s+/g, '')}_${clientId.slice(0, 8)}`
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'שגיאה בשליחת פרטי ההתחברות');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "פרטי ההתחברות נשלחו",
        description: "פרטי ההתחברות נשלחו בהצלחה ללקוח באימייל"
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

  const handleSendCredentials = (client: Client) => {
    if (!client.email) {
      toast({
        variant: "destructive",
        title: "שגיאה",
        description: "ללקוח אין כתובת אימייל"
      });
      return;
    }
    sendCredentialsMutation.mutate(client.id);
  };

  const handleViewClientDashboard = (clientId: string) => {
    const clientPortalUrl = `/client-portal?clientId=${clientId}`;
    window.open(clientPortalUrl, '_blank');
  };

  const [credentialsForm, setCredentialsForm] = useState({
    username: '',
    password: '',
    email: ''
  });

  const { data: clients, isLoading } = useQuery<Client[]>({
    queryKey: ['/api/clients'],
    staleTime: 30000, // 30 seconds
  });

  const filteredClients = clients?.filter(client => {
    const matchesSearch = !searchQuery || 
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.contactName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || client.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleViewClient = (client: Client) => {
    navigate(`/dashboard/clients/${client.id}`);
  };

  const handleEditClient = (client: Client) => {
    // TODO: Implement edit client modal
    console.log('Edit client:', client);
  };

  const handleDeleteClient = (client: Client) => {
    // TODO: Implement delete client confirmation
    console.log('Delete client:', client);
  };

  const toggleClientSelection = (clientId: string) => {
    setSelectedClients(prev => 
      prev.includes(clientId) 
        ? prev.filter(id => id !== clientId)
        : [...prev, clientId]
    );
  };

  const toggleAllClients = () => {
    if (selectedClients.length === filteredClients?.length) {
      setSelectedClients([]);
    } else {
      setSelectedClients(filteredClients?.map(client => client.id) || []);
    }
  };

  const handleBulkDelete = () => {
    // TODO: Implement bulk delete
    console.log('Bulk delete clients:', selectedClients);
    setSelectedClients([]);
  };

  const handleBulkSendCredentials = () => {
    // TODO: Implement bulk send credentials
    console.log('Bulk send credentials to clients:', selectedClients);
    setSelectedClients([]);
  };

  const handleManageCredentials = (client: Client) => {
    setSelectedClient(client);
    setCredentialsForm({
      username: client.email || `${client.name.toLowerCase().replace(/\s+/g, '')}@client.portal`,
      password: `${client.name.toLowerCase().replace(/\s+/g, '')}_${client.id.slice(0, 8)}`,
      email: client.email || ''
    });
    setShowCredentialsModal(true);
  };

  const handleSaveCredentials = () => {
    if (selectedClient) {
      // TODO: Implement API call to save credentials
      console.log('Saving credentials for:', selectedClient.name, credentialsForm);
      setShowCredentialsModal(false);
      setSelectedClient(null);
    }
  };

  return (
    <div className="space-y-6" data-testid="clients-page">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 font-rubik" data-testid="clients-title">
            ניהול לקוחות
          </h1>
          <p className="text-gray-600 mt-1">
            נהלו את כל הלקוחות שלכם במקום אחד
          </p>
        </div>
        <Button 
          onClick={() => setShowNewClientModal(true)}
          className="flex items-center space-x-reverse space-x-2"
          data-testid="button-new-client"
        >
          <Plus className="h-4 w-4" />
          <span>לקוח חדש</span>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="חיפוש לקוחות..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10 text-right"
            data-testid="search-clients"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48" data-testid="filter-status">
            <SelectValue placeholder="סינון לפי סטטוס" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">כל הסטטוסים</SelectItem>
            <SelectItem value="active">פעיל</SelectItem>
            <SelectItem value="pending">ממתין</SelectItem>
            <SelectItem value="inactive">לא פעיל</SelectItem>
          </SelectContent>
        </Select>

        {/* View Toggle */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          <Button
            variant={viewMode === "grid" ? "default" : "ghost"}
            size="sm"
            onClick={() => {
              setViewMode("grid");
              setSelectedClients([]);
            }}
            className="px-3"
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "table" ? "default" : "ghost"}
            size="sm"
            onClick={() => {
              setViewMode("table");
              setSelectedClients([]);
            }}
            className="px-3"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Clients Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <Skeleton className="h-6 w-32 mb-2" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
              <Skeleton className="h-8 w-full" />
            </div>
          ))}
        </div>
      ) : !filteredClients || filteredClients.length === 0 ? (
        <div className="text-center py-12" data-testid="no-clients">
          <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {searchQuery || statusFilter !== "all" ? "לא נמצאו לקוחות" : "אין לקוחות עדיין"}
          </h3>
          <p className="text-gray-600 mb-6">
            {searchQuery || statusFilter !== "all" 
              ? "נסה לשנות את החיפוש או הסינון"
              : "התחל על ידי הוספת הלקוח הראשון שלך"
            }
          </p>
          {!searchQuery && statusFilter === "all" && (
            <Button onClick={() => setShowNewClientModal(true)} data-testid="button-add-first-client">
              <Plus className="h-4 w-4 ml-2" />
              הוסף לקוח ראשון
            </Button>
          )}
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map((client) => (
            <ClientCard
              key={client.id}
              client={client}
              onEdit={() => handleEditClient(client)}
              onView={() => handleViewClient(client)}
              onDelete={() => handleDeleteClient(client)}
              onSendCredentials={() => handleSendCredentials(client)}
              onViewDashboard={() => handleViewClientDashboard(client.id)}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Bulk Actions Bar */}
          {selectedClients.length > 0 && (
            <div className="bg-blue-50 border-b border-blue-200 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-blue-900">
                    נבחרו {selectedClients.length} לקוחות
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedClients([])}
                    className="text-blue-700 border-blue-300"
                  >
                    בטל בחירה
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBulkSendCredentials}
                    className="flex items-center gap-2"
                  >
                    <Send className="h-4 w-4" />
                    שלח פרטי התחברות
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBulkDelete}
                    className="flex items-center gap-2 text-red-600 border-red-300 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    מחק לקוחות
                  </Button>
                </div>
              </div>
            </div>
          )}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedClients.length === filteredClients?.length && filteredClients.length > 0}
                    onCheckedChange={toggleAllClients}
                    aria-label="בחר את כל הלקוחות"
                  />
                </TableHead>
                <TableHead className="text-right">שם הלקוח</TableHead>
                <TableHead className="text-right">איש קשר</TableHead>
                <TableHead className="text-right">אימייל</TableHead>
                <TableHead className="text-right">טלפון</TableHead>
                <TableHead className="text-right">תחום</TableHead>
                <TableHead className="text-right">סטטוס</TableHead>
                <TableHead className="text-right">תאריך הצטרפות</TableHead>
                <TableHead className="text-right">פעולות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.map((client) => (
                <TableRow 
                  key={client.id} 
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={(e) => {
                    // Don't navigate if clicking on checkbox or action buttons
                    if (e.target instanceof HTMLElement && 
                        (e.target.closest('[role="checkbox"]') || 
                         e.target.closest('button') ||
                         e.target.closest('[role="button"]'))) {
                      return;
                    }
                    handleViewClient(client);
                  }}
                >
                  <TableCell>
                    <Checkbox
                      checked={selectedClients.includes(client.id)}
                      onCheckedChange={() => toggleClientSelection(client.id)}
                      aria-label={`בחר את ${client.name}`}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </TableCell>
                  <TableCell className="font-medium text-right">{client.name}</TableCell>
                  <TableCell className="text-right">{client.contactName || '-'}</TableCell>
                  <TableCell className="text-right">{client.email || '-'}</TableCell>
                  <TableCell className="text-right">{client.phone || '-'}</TableCell>
                  <TableCell className="text-right">{client.industry || '-'}</TableCell>
                  <TableCell className="text-right">
                    <Badge className={getStatusColor(client.status)}>
                      {getStatusText(client.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {new Date(client.createdAt).toLocaleDateString('he-IL')}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => e.stopPropagation()}
                          data-testid={`client-actions-${client.id}`}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewClient(client)}>
                          <Eye className="ml-2 h-4 w-4" />
                          צפה בפרטים
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditClient(client)}>
                          <Edit className="ml-2 h-4 w-4" />
                          ערוך לקוח
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleSendCredentials(client)}>
                          <Send className="ml-2 h-4 w-4" />
                          שלח פרטי התחברות
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteClient(client)}
                          className="text-red-600"
                        >
                          <Trash2 className="ml-2 h-4 w-4" />
                          מחק לקוח
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* New Client Modal */}
      <NewClientModal
        isOpen={showNewClientModal}
        onClose={() => setShowNewClientModal(false)}
      />

      {/* Credentials Management Modal */}
      {showCredentialsModal && selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">ניהול פרטי התחברות - {selectedClient.name}</h2>
              <Button variant="ghost" onClick={() => setShowCredentialsModal(false)}>X</Button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">שם משתמש/אימייל</label>
                <Input
                  type="text"
                  value={credentialsForm.username}
                  onChange={(e) => setCredentialsForm({...credentialsForm, username: e.target.value})}
                  className="w-full text-right"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">סיסמה</label>
                <Input
                  type="text"
                  value={credentialsForm.password}
                  onChange={(e) => setCredentialsForm({...credentialsForm, password: e.target.value})}
                  className="w-full text-right"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">אימייל ליצירת קשר</label>
                <Input
                  type="email"
                  value={credentialsForm.email}
                  onChange={(e) => setCredentialsForm({...credentialsForm, email: e.target.value})}
                  className="w-full text-right"
                />
              </div>

              <div className="bg-gray-50 p-3 rounded">
                <h4 className="font-medium mb-2">קישור לדאשבורד הלקוח:</h4>
                <code className="text-sm bg-white p-2 rounded block text-left">
                  {window.location.origin}/client-portal?clientId={selectedClient.id}
                </code>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={() => setShowCredentialsModal(false)}
              >
                ביטול
              </Button>
              <Button 
                onClick={handleSaveCredentials}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                שמור שינויים
              </Button>
              <Button 
                onClick={async () => {
                  try {
                    const response = await fetch(`/api/clients/${selectedClient.id}/send-credentials`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        username: credentialsForm.username,
                        password: credentialsForm.password
                      })
                    });

                    const result = await response.json();

                    if (response.ok) {
                      alert(`✅ ${result.message}\nנשלח ל: ${result.details.sentTo}`);
                      setShowCredentialsModal(false);
                    } else {
                      alert(`❌ שגיאה: ${result.message}`);
                    }
                  } catch (error) {
                    alert('❌ שגיאה בשליחת האימייל. אנא נסה שוב.');
                  }
                }}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                שלח ללקוח
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}