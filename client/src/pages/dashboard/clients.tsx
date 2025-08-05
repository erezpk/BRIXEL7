import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import ClientCard from "@/components/clients/client-card";
import NewClientModal from "@/components/modals/new-client-modal";
import { Plus, Search, Users } from "lucide-react";
import { type Client } from "@shared/schema";

export default function Clients() {
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [, navigate] = useLocation();

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
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map((client) => (
            <ClientCard
              key={client.id}
              client={client}
              onView={handleViewClient}
              onEdit={handleEditClient}
              onDelete={handleDeleteClient}
            />
          ))}
        </div>
      )}

      {/* New Client Modal */}
      <NewClientModal
        isOpen={showNewClientModal}
        onClose={() => setShowNewClientModal(false)}
      />
    </div>
  );
}
