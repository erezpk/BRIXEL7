import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: LucideIcon;
  iconColor?: string;
}

export default function StatsCard({ 
  title, 
  value, 
  change, 
  changeType = 'neutral', 
  icon: Icon, 
  iconColor = 'text-primary' 
}: StatsCardProps) {
  const changeColorClass = {
    positive: 'text-green-600',
    negative: 'text-red-600',
    neutral: 'text-gray-600'
  }[changeType];

  return (
    <Card className="card-hover" data-testid={`stats-card-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600" data-testid="stats-title">
              {title}
            </p>
            <p className="text-3xl font-bold text-gray-900" data-testid="stats-value">
              {value}
            </p>
            {change && (
              <p className={`text-sm ${changeColorClass}`} data-testid="stats-change">
                {change}
              </p>
            )}
          </div>
          <div className={`w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center`}>
            <Icon className={`${iconColor} text-xl`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
