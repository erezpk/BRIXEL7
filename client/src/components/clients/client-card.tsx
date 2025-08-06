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
    <Card className="card-hover bg-white border-0 shadow-lg rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300" data-testid={`client-card-${client.id}`}>
      {/* Header Section with gradient background */}
      <div className="bg-gradient-to-l from-blue-50 to-indigo-50 p-6 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 font-rubik" data-testid="client-name">
                  {client.name}
                </h3>
                <div className="flex items-center gap-2">
                  {client.email && (
                    <span className="text-sm text-gray-600">{client.email}</span>
                  )}
                  <Badge className={`${getStatusColor(client.status)} text-xs font-medium`} data-testid="client-status">
                    {getStatusText(client.status)}
                  </Badge>
                </div>
              </div>
            </div>
            {client.industry && (
              <p className="text-sm text-gray-600" data-testid="client-industry">
                תחום: {client.industry}
              </p>
            )}
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
      <CardContent className="p-6">
        <div className="space-y-2 mb-4">
          {client.contactName && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">איש קשר:</span>
              <span className="text-gray-900" data-testid="client-contact">
                {client.contactName}
              </span>
            </div>
          )}
          {client.email && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">אימייל:</span>
              <span className="text-gray-900" data-testid="client-email">
                {client.email}
              </span>
            </div>
          )}
          {client.phone && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">טלפון:</span>
              <span className="text-gray-900" data-testid="client-phone">
                {client.phone}
              </span>
            </div>
          )}
        </div>

        <div className="flex space-x-reverse space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onView(client)}
            className="flex-1"
            data-testid="client-view-details"
          >
            צפה בפרטים
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}