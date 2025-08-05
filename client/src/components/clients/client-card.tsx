import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Eye, MoreHorizontal, User } from "lucide-react";
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
  onManageCredentials?: (client: Client) => void; // Added for managing credentials
}

export default function ClientCard({ client, onView, onEdit, onDelete, onManageCredentials }: ClientCardProps) {
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

  // Generate default credentials if not present
  const defaultEmail = client.email || `${client.name.toLowerCase().replace(/\s+/g, '')}@client.portal`;
  const defaultPassword = `${client.name.toLowerCase().replace(/\s+/g, '')}_${client.id.slice(0, 8)}`;
  const clientPortalUrl = `${window.location.origin}/client-portal?clientId=${client.id}`;


  return (
    <Card className="card-hover" data-testid={`client-card-${client.id}`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1" data-testid="client-name">
              {client.name}
            </h3>
            {client.industry && (
              <p className="text-sm text-gray-600" data-testid="client-industry">
                {client.industry}
              </p>
            )}
          </div>
          <div className="flex items-center space-x-reverse space-x-2">
            <Badge className={getStatusColor(client.status)} data-testid="client-status">
              {getStatusText(client.status)}
            </Badge>
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
                <DropdownMenuItem onClick={() => onEdit(client)} data-testid="client-edit">
                  <Edit className="ml-2 h-4 w-4" />
                  ערוך
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

        <div className="flex flex-col space-y-2">
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

          <div className="flex space-x-reverse space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                // עבור לדאשבורד של הלקוח
                window.location.href = clientPortalUrl;
              }}
              className="border-green-500 text-green-600 hover:bg-green-50 flex-1 text-xs"
            >
              <Eye className="h-3 w-3 ml-1" />
              צפה כלקוח
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                // שלח פרטי התחברות ללקוח
                alert(`פרטי התחברות ללקוח:\nאימייל: ${defaultEmail}\nסיסמה: ${defaultPassword}\nקישור: ${clientPortalUrl}`);
              }}
              className="border-purple-500 text-purple-600 hover:bg-purple-50 flex-1 text-xs"
            >
              <User className="h-3 w-3 ml-1" />
              שלח פרטים
            </Button>
          </div>

          {/* Client credentials display */}
          <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded border-t">
            <div className="font-medium mb-1">פרטי התחברות:</div>
            <div>משתמש: {defaultEmail}</div>
            <div>סיסמה: {defaultPassword}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}