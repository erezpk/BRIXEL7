import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Globe, Calendar, Edit, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { type DigitalAsset } from "@shared/schema";
import { format, differenceInDays } from "date-fns";
import { he } from "date-fns/locale";

interface DomainCardProps {
  asset: DigitalAsset & {
    client?: { name: string };
  };
  onEdit: (asset: DigitalAsset) => void;
  onDelete: (asset: DigitalAsset) => void;
}

export default function DomainCard({ asset, onEdit, onDelete }: DomainCardProps) {
  const getRenewalStatus = () => {
    if (!asset.renewalDate) return { status: 'unknown', text: 'לא ידוע', color: 'bg-gray-100 text-gray-800' };
    
    const daysUntilRenewal = differenceInDays(new Date(asset.renewalDate), new Date());
    
    if (daysUntilRenewal < 0) {
      return { status: 'expired', text: 'פג תוקף', color: 'bg-red-100 text-red-800' };
    } else if (daysUntilRenewal <= 30) {
      return { status: 'urgent', text: `פג עוד ${daysUntilRenewal} ימים`, color: 'bg-red-100 text-red-800' };
    } else if (daysUntilRenewal <= 90) {
      return { status: 'warning', text: `פג עוד ${Math.ceil(daysUntilRenewal / 30)} חודשים`, color: 'bg-yellow-100 text-yellow-800' };
    } else {
      return { status: 'good', text: `פג עוד ${Math.ceil(daysUntilRenewal / 365)} שנה`, color: 'bg-green-100 text-green-800' };
    }
  };

  const renewalStatus = getRenewalStatus();

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'domain':
        return <Globe className="h-4 w-4" />;
      default:
        return <Globe className="h-4 w-4" />;
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'domain':
        return 'דומיין';
      case 'hosting':
        return 'אחסון';
      case 'ssl':
        return 'תעודת SSL';
      case 'email':
        return 'אימייל';
      default:
        return type;
    }
  };

  return (
    <Card className={`card-hover border-r-4 ${
      renewalStatus.status === 'urgent' || renewalStatus.status === 'expired' ? 'border-r-red-500' :
      renewalStatus.status === 'warning' ? 'border-r-yellow-500' :
      'border-r-green-500'
    }`} data-testid={`asset-card-${asset.id}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center space-x-reverse space-x-2 mb-1">
              {getTypeIcon(asset.type)}
              <h4 className="font-medium text-gray-900" data-testid="asset-name">
                {asset.name}
              </h4>
            </div>
            {asset.client && (
              <p className="text-sm text-gray-600" data-testid="asset-client">
                לקוח: {asset.client.name}
              </p>
            )}
            {asset.provider && (
              <p className="text-sm text-gray-600" data-testid="asset-provider">
                ספק: {asset.provider}
              </p>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" data-testid="asset-menu">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(asset)} data-testid="asset-edit">
                <Edit className="ml-2 h-4 w-4" />
                ערוך
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDelete(asset)} 
                className="text-red-600"
                data-testid="asset-delete"
              >
                מחק
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Badge variant="outline" data-testid="asset-type">
              {getTypeText(asset.type)}
            </Badge>
            <Badge className={renewalStatus.color} data-testid="asset-renewal-status">
              {renewalStatus.text}
            </Badge>
          </div>
          
          {asset.renewalDate && (
            <div className="flex items-center space-x-reverse space-x-1 text-sm text-gray-600">
              <Calendar className="h-4 w-4" />
              <span data-testid="asset-renewal-date">
                {format(new Date(asset.renewalDate), 'dd/MM/yyyy', { locale: he })}
              </span>
            </div>
          )}
          
          {asset.cost && (
            <div className="text-sm text-gray-600" data-testid="asset-cost">
              עלות: ₪{(asset.cost / 100).toFixed(2)}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
