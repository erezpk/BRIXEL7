import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Filter, Plus, Facebook, Chrome, MessageCircle, Phone, Mail } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface Lead {
  id: string;
  clientId: string;
  platform: 'facebook' | 'google';
  externalId: string;
  leadData: {
    name?: string;
    email?: string;
    phone?: string;
    [key: string]: any;
  };
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'rejected';
  notes?: string;
  assignedTo?: string;
  value?: number;
  source?: string;
  campaign?: string;
  adSet?: string;
  formName?: string;
  createdAt: string;
}

interface LeadsListProps {
  clientId?: string;
  showClientColumn?: boolean;
}

export default function LeadsList({ clientId, showClientColumn = false }: LeadsListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [platformFilter, setPlatformFilter] = useState<string>("all");

  const { data: leads = [], isLoading } = useQuery<Lead[]>({
    queryKey: clientId ? ['/api/leads/client', clientId] : ['/api/leads']
  });

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = !searchTerm || 
      lead.leadData.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.leadData.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.leadData.phone?.includes(searchTerm);
    
    const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
    const matchesPlatform = platformFilter === "all" || lead.platform === platformFilter;
    
    return matchesSearch && matchesStatus && matchesPlatform;
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      new: { label: 'חדש', variant: 'default' as const },
      contacted: { label: 'נוצר קשר', variant: 'secondary' as const },
      qualified: { label: 'מוכשר', variant: 'default' as const },
      converted: { label: 'הומר', variant: 'default' as const },
      rejected: { label: 'נדחה', variant: 'destructive' as const }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.new;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'facebook':
        return <Facebook className="w-4 h-4 text-blue-600" />;
      case 'google':
        return <Chrome className="w-4 h-4 text-green-600" />;
      default:
        return null;
    }
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('he-IL', { 
      style: 'currency', 
      currency: 'ILS' 
    }).format(amount);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">טוען לידים...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            לידים
            <Badge variant="secondary">{filteredLeads.length}</Badge>
          </CardTitle>
          <Button size="sm">
            <Plus className="w-4 h-4 ml-2" />
            ליד חדש
          </Button>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="חיפוש לפי שם, אימייל או טלפון..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
            />
          </div>
          
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="סטטוס" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל הסטטוסים</SelectItem>
                <SelectItem value="new">חדש</SelectItem>
                <SelectItem value="contacted">נוצר קשר</SelectItem>
                <SelectItem value="qualified">מוכשר</SelectItem>
                <SelectItem value="converted">הומר</SelectItem>
                <SelectItem value="rejected">נדחה</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={platformFilter} onValueChange={setPlatformFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="פלטפורמה" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">הכל</SelectItem>
                <SelectItem value="facebook">Facebook</SelectItem>
                <SelectItem value="google">Google</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {filteredLeads.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-500">אין לידים להצגה</div>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ליד</TableHead>
                <TableHead>פלטפורמה</TableHead>
                <TableHead>סטטוס</TableHead>
                <TableHead>ערך</TableHead>
                <TableHead>מקור</TableHead>
                <TableHead>תאריך</TableHead>
                <TableHead>פעולות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeads.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback>
                          {lead.leadData.name?.charAt(0) || 'L'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">
                          {lead.leadData.name || 'ללא שם'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {lead.leadData.email || lead.leadData.phone || 'ללא פרטי קשר'}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getPlatformIcon(lead.platform)}
                      <span className="capitalize">{lead.platform}</span>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    {getStatusBadge(lead.status)}
                  </TableCell>
                  
                  <TableCell>
                    {formatCurrency(lead.value)}
                  </TableCell>
                  
                  <TableCell>
                    <div className="text-sm">
                      {lead.campaign && (
                        <div className="font-medium">{lead.campaign}</div>
                      )}
                      {lead.adSet && (
                        <div className="text-gray-500">{lead.adSet}</div>
                      )}
                      {lead.formName && (
                        <div className="text-gray-500">{lead.formName}</div>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="text-sm">
                      {new Date(lead.createdAt).toLocaleDateString('he-IL')}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {lead.leadData.phone && (
                        <Button variant="ghost" size="sm">
                          <Phone className="w-4 h-4" />
                        </Button>
                      )}
                      {lead.leadData.email && (
                        <Button variant="ghost" size="sm">
                          <Mail className="w-4 h-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="sm">
                        <MessageCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}