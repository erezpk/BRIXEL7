import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Eye, MoreHorizontal, User, ExternalLink, Send, Building2, Phone, Mail, Calendar } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { type Client } from "@shared/schema";

interface ClientCardProps {
  client: Client;
  onView: (client: Client) => void;
  onEdit: (client: Client) => void;
  onDelete: (client: Client) => void;
  onManageCredentials?: (client: Client) => void;
  onSendCredentials?: (client: Client) => void;
  onViewDashboard?: (client: Client) => void;
}

export default function ClientCard({ 
  client, 
  onView, 
  onEdit, 
  onDelete, 
  onManageCredentials, 
  onSendCredentials, 
  onViewDashboard 
}: ClientCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
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

  return (
    <Card className="bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden" data-testid={`client-card-${client.id}`}>
      {/* Header Section */}
      <div className="bg-gradient-to-l from-blue-50 via-indigo-50 to-purple-50 px-6 py-5 border-b border-gray-100">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white rounded-xl shadow-sm flex items-center justify-center">
              <Building2 className="h-7 w-7 text-blue-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 font-rubik mb-1" data-testid="client-name">
                {client.name}
              </h3>
              {client.industry && (
                <p className="text-sm text-gray-600 font-medium" data-testid="client-industry">
                  {client.industry}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge 
              className={`${getStatusColor(client.status)} text-xs font-bold px-3 py-1 border`} 
              data-testid="client-status"
            >
              {getStatusText(client.status)}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="hover:bg-white/50" data-testid="client-menu">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onView(client)} data-testid="client-view">
                  <Eye className="ml-2 h-4 w-4" />
                  צפה בפרטים
                </DropdownMenuItem>
                {onViewDashboard && (
                  <DropdownMenuItem onClick={() => onViewDashboard(client)} data-testid="client-view-dashboard">
                    <ExternalLink className="ml-2 h-4 w-4" />
                    צפה בדאשבורד לקוח
                  </DropdownMenuItem>
                )}
                {onSendCredentials && (
                  <DropdownMenuItem onClick={() => onSendCredentials(client)} data-testid="client-send-credentials">
                    <Send className="ml-2 h-4 w-4" />
                    שלח פרטי התחברות
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => onEdit(client)} data-testid="client-edit">
                  <Edit className="ml-2 h-4 w-4" />
                  ערוך לקוח
                </DropdownMenuItem>
                {onManageCredentials && (
                  <DropdownMenuItem onClick={() => onManageCredentials(client)} data-testid="client-credentials">
                    ניהול פרטי התחברות
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem 
                  onClick={() => onDelete(client)} 
                  className="text-red-600"
                  data-testid="client-delete"
                >
                  מחק
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <CardContent className="p-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border border-green-100">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-700 font-rubik mb-1">₪0.00</div>
              <div className="text-sm text-green-600 font-medium">הכנסות חודש זה</div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-4 rounded-xl border border-blue-100">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-700 font-rubik mb-1">₪0.00</div>
              <div className="text-sm text-blue-600 font-medium">סה״כ הכנסות</div>
            </div>
          </div>
        </div>

        {/* Client Details Table */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <h4 className="text-sm font-semibold text-gray-700 mb-3 font-rubik">פרטי לקוח</h4>
          <div className="space-y-3">
            {client.contactName && (
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">איש קשר</span>
                </div>
                <span className="text-sm font-medium text-gray-900" data-testid="client-contact">
                  {client.contactName}
                </span>
              </div>
            )}
            {client.email && (
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">אימייל</span>
                </div>
                <span className="text-sm font-medium text-gray-900" data-testid="client-email">
                  {client.email}
                </span>
              </div>
            )}
            {client.phone && (
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">טלפון</span>
                </div>
                <span className="text-sm font-medium text-gray-900" data-testid="client-phone">
                  {client.phone}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">תאריך הצטרפות</span>
              </div>
              <span className="text-sm font-medium text-gray-900">
                {new Date(client.createdAt).toLocaleDateString('he-IL')}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onView(client)}
            className="flex-1 text-sm hover:bg-gray-50 border-gray-300"
            data-testid="client-view-details"
          >
            <Eye className="h-4 w-4 ml-1" />
            צפה בפרטים
          </Button>
          <Button 
            size="sm" 
            onClick={() => onEdit(client)}
            className="flex-1 text-sm bg-blue-600 hover:bg-blue-700 text-white font-medium"
            data-testid="client-edit-btn"
          >
            <Edit className="h-4 w-4 ml-1" />
            ערוך לקוח
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}