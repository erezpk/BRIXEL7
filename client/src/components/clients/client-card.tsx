import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Eye, MoreHorizontal, User, ExternalLink, Send } from "lucide-react";
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

  return (
    <Card className="group bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md hover:border-blue-300 transition-all duration-200" data-testid={`client-card-${client.id}`}>
      {/* Header Section */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-semibold text-gray-900 truncate" data-testid="client-name">
                  {client.name}
                </h3>
                <Badge className={`${getStatusColor(client.status)} text-xs`} data-testid="client-status">
                  {getStatusText(client.status)}
                </Badge>
              </div>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" data-testid="client-menu">
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

      {/* Contact Details */}
      <CardContent className="p-4">
        <div className="space-y-3">
          {client.email && (
            <div className="flex items-center gap-2 text-sm">
              <span className="w-16 text-gray-500 text-xs">אימייל:</span>
              <span className="text-gray-800 truncate" data-testid="client-email">
                {client.email}
              </span>
            </div>
          )}
          {client.phone && (
            <div className="flex items-center gap-2 text-sm">
              <span className="w-16 text-gray-500 text-xs">טלפון:</span>
              <span className="text-gray-800" data-testid="client-phone">
                {client.phone}
              </span>
            </div>
          )}
          {client.industry && (
            <div className="flex items-center gap-2 text-sm">
              <span className="w-16 text-gray-500 text-xs">תחום:</span>
              <span className="text-gray-800" data-testid="client-industry">
                {client.industry}
              </span>
            </div>
          )}
          {client.contactName && (
            <div className="flex items-center gap-2 text-sm">
              <span className="w-16 text-gray-500 text-xs">איש קשר:</span>
              <span className="text-gray-800" data-testid="client-contact">
                {client.contactName}
              </span>
            </div>
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-gray-100">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onView(client)}
            className="w-full h-8 text-xs"
            data-testid="client-view-details"
          >
            צפה בפרטים
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}