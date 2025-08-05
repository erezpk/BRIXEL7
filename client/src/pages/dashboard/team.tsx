import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, Users, Edit, MoreHorizontal, Mail, Phone, UserX, UserCheck } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { type User } from "@shared/schema";
import { getUserRole } from "@/lib/auth";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import InviteTeamMemberModal from "@/components/modals/invite-team-member-modal";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function Team() {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingMember, setEditingMember] = useState<User | null>(null);
  const [editFormData, setEditFormData] = useState({
    fullName: "",
    email: "",
    role: "" as "agency_admin" | "team_member" | "client",
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: teamMembers, isLoading } = useQuery<User[]>({
    queryKey: ['/api/team'],
    staleTime: 30000, // 30 seconds
  });

  const filteredMembers = teamMembers?.filter(member => {
    const matchesSearch = !searchQuery || 
      member.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === "all" || member.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const deactivateMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const response = await apiRequest({
        url: `/api/team/${memberId}/toggle-active`,
        method: 'PUT',
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/team'] });
      toast({
        title: "סטטוס חבר הצוות עודכן",
        description: "סטטוס הפעילות של חבר הצוות עודכן בהצלחה",
      });
    },
    onError: (error: any) => {
      toast({
        title: "שגיאה בעדכון סטטוס",
        description: error?.message || "אירעה שגיאה לא צפויה",
        variant: "destructive",
      });
    },
  });

  const updateMemberMutation = useMutation({
    mutationFn: async (data: { id: string; fullName: string; email: string; role: string }) => {
      const response = await apiRequest({
        url: `/api/team/${data.id}`,
        method: 'PUT',
        body: {
          fullName: data.fullName,
          email: data.email,
          role: data.role,
        },
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/team'] });
      toast({
        title: "פרטי חבר הצוות עודכנו בהצלחה",
      });
      setShowEditModal(false);
      setEditingMember(null);
    },
    onError: (error: any) => {
      toast({
        title: "שגיאה בעדכון פרטי חבר הצוות",
        description: error?.message || "אירעה שגיאה לא צפויה",
        variant: "destructive",
      });
    },
  });

  const resendInviteMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const response = await apiRequest({
        url: `/api/team/${memberId}/resend-invite`,
        method: 'POST',
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "הזמנה נשלחה מחדש בהצלחה",
        description: "אימייל ההזמנה נשלח שוב לחבר הצוות",
      });
    },
    onError: (error: any) => {
      toast({
        title: "שגיאה בשליחת הזמנה מחדש",
        description: error?.message || "אירעה שגיאה לא צפויה",
        variant: "destructive",
      });
    },
  });

  const handleEditMember = (member: User) => {
    setEditingMember(member);
    setEditFormData({
      fullName: member.fullName,
      email: member.email,
      role: member.role as "agency_admin" | "team_member" | "client",
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;

    if (!editFormData.fullName.trim() || !editFormData.email.trim()) {
      toast({
        title: "שגיאה",
        description: "יש למלא את כל השדות הנדרשים",
        variant: "destructive",
      });
      return;
    }

    if (!editFormData.email.includes('@')) {
      toast({
        title: "שגיאה",
        description: "כתובת אימייל לא תקינה",
        variant: "destructive",
      });
      return;
    }

    updateMemberMutation.mutate({
      id: editingMember.id!,
      ...editFormData,
    });
  };

  const handleToggleActive = (member: User) => {
    if (window.confirm(`האם אתה בטוח שברצונך ${member.isActive ? 'להשבית' : 'להפעיל'} את ${member.fullName}?`)) {
      deactivateMemberMutation.mutate(member.id!);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'agency_admin':
        return 'bg-purple-100 text-purple-800';
      case 'team_member':
        return 'bg-blue-100 text-blue-800';
      case 'client':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive 
      ? 'bg-green-100 text-green-800' 
      : 'bg-gray-100 text-gray-800';
  };

  const getUserInitials = (fullName: string) => {
    return fullName
      .split(" ")
      .map(name => name.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-6" data-testid="team-page">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 font-rubik" data-testid="team-title">
            ניהול צוות
          </h1>
          <p className="text-gray-600 mt-1">
            נהלו את חברי הצוות והרשאות במערכת
          </p>
        </div>
        <Button 
          className="flex items-center space-x-reverse space-x-2"
          onClick={() => setShowInviteModal(true)}
          data-testid="button-invite-member"
        >
          <Plus className="h-4 w-4" />
          <span>הזמן חבר צוות</span>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="חיפוש חברי צוות..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10 text-right"
            data-testid="search-team"
          />
        </div>

        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full sm:w-48" data-testid="filter-role">
            <SelectValue placeholder="סינון לפי תפקיד" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">כל התפקידים</SelectItem>
            <SelectItem value="agency_admin">מנהל סוכנות</SelectItem>
            <SelectItem value="team_member">חבר צוות</SelectItem>
            <SelectItem value="client">לקוח</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Team Members Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-start space-x-reverse space-x-4">
                  <Skeleton className="w-12 h-12 rounded-full" />
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-6 w-16 rounded-full" />
                    </div>
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-4 w-28" />
                  </div>
                </div>
                <div className="mt-4 flex justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-8 w-8" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !filteredMembers || filteredMembers.length === 0 ? (
        <div className="text-center py-12" data-testid="no-team-members">
          <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {searchQuery || roleFilter !== "all" ? "לא נמצאו חברי צוות" : "אין חברי צוות עדיין"}
          </h3>
          <p className="text-gray-600 mb-6">
            {searchQuery || roleFilter !== "all" 
              ? "נסה לשנות את החיפוש או הסינון"
              : "התחל על ידי הזמנת חבר הצוות הראשון שלך"
            }
          </p>
          {!searchQuery && roleFilter === "all" && (
            <Button 
              onClick={() => setShowInviteModal(true)}
              data-testid="button-invite-first-member"
            >
              <Plus className="h-4 w-4 ml-2" />
              הזמן חבר צוות ראשון
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMembers.map((member) => (
            <Card key={member.id} className="card-hover" data-testid={`team-member-card-${member.id}`}>
              <CardContent className="p-6">
                <div className="flex items-start space-x-reverse space-x-4 mb-4">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={member.avatar || undefined} alt={member.fullName} />
                    <AvatarFallback className="font-medium">
                      {getUserInitials(member.fullName)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 truncate" data-testid="member-name">
                        {member.fullName}
                      </h3>
                      <Badge className={getRoleColor(member.role)} data-testid="member-role">
                        {getUserRole(member.role)}
                      </Badge>
                    </div>

                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center space-x-reverse space-x-1">
                        <Mail className="h-3 w-3" />
                        <span className="truncate" data-testid="member-email">{member.email}</span>
                      </div>

                      <Badge className={getStatusColor(member.isActive)} data-testid="member-status">
                        {member.isActive ? 'פעיל' : 'לא פעיל'}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center text-sm text-gray-500">
                  <div data-testid="member-last-login">
                    {member.lastLogin 
                      ? `פעילות אחרונה: ${format(new Date(member.lastLogin), 'dd/MM/yyyy', { locale: he })}`
                      : 'מעולם לא התחבר'
                    }
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" data-testid={`member-menu-${member.id}`}>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem 
                        onClick={() => handleEditMember(member)}
                        data-testid={`edit-member-${member.id}`}
                      >
                        <Edit className="h-4 w-4 ml-2" />
                        ערוך פרטים
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => resendInviteMutation.mutate(member.id)}
                        disabled={resendInviteMutation.isPending}
                        data-testid={`resend-invite-${member.id}`}
                      >
                        <Mail className="h-4 w-4 ml-2" />
                        שלח הזמנה מחדש
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => handleToggleActive(member)}
                        className={member.isActive ? "text-red-600" : "text-green-600"}
                        data-testid={`toggle-member-${member.id}`}
                      >
                        {member.isActive ? (
                          <>
                            <UserX className="h-4 w-4 ml-2" />
                            השבת חבר צוות
                          </>
                        ) : (
                          <>
                            <UserCheck className="h-4 w-4 ml-2" />
                            הפעל חבר צוות
                          </>
                        )}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <InviteTeamMemberModal 
        open={showInviteModal}
        onOpenChange={setShowInviteModal}
      />

      {/* Edit Member Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="sm:max-w-md" data-testid="edit-member-modal">
          <DialogHeader>
            <DialogTitle className="text-right">עריכת פרטי חבר צוות</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveEdit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="editFullName" className="text-right flex items-center space-x-reverse space-x-2">
                <span>שם מלא</span>
              </Label>
              <Input
                id="editFullName"
                value={editFormData.fullName}
                onChange={(e) => setEditFormData(prev => ({ ...prev, fullName: e.target.value }))}
                placeholder="הכנס שם מלא"
                className="text-right"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="editEmail" className="text-right flex items-center space-x-reverse space-x-2">
                <span>אימייל</span>
              </Label>
              <Input
                id="editEmail"
                type="email"
                value={editFormData.email}
                onChange={(e) => setEditFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="הכנס כתובת אימייל"
                className="text-right"
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-right">תפקיד</Label>
              <Select value={editFormData.role} onValueChange={(value) => setEditFormData(prev => ({ ...prev, role: value as "agency_admin" | "team_member" | "client" }))}>
                <SelectTrigger>
                  <SelectValue placeholder="בחר תפקיד" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="team_member">חבר צוות</SelectItem>
                  <SelectItem value="agency_admin">מנהל סוכנות</SelectItem>
                  <SelectItem value="client">לקוח</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end space-x-reverse space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowEditModal(false)}
                data-testid="button-cancel-edit"
              >
                ביטול
              </Button>
              <Button
                type="submit"
                disabled={updateMemberMutation.isPending}
                data-testid="button-save-edit"
              >
                {updateMemberMutation.isPending ? "שומר..." : "שמור שינויים"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}