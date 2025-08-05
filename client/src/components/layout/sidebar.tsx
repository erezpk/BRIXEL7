import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  Home, 
  Users, 
  Projector, 
  CheckSquare, 
  UserCheck, 
  Globe, 
  BarChart3, 
  Layers,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  isMobile: boolean;
}

const navigation = [
  { name: "דשבורד", href: "/dashboard", icon: Home },
  { name: "לקוחות", href: "/dashboard/clients", icon: Users },
  { name: "פרויקטים", href: "/dashboard/projects", icon: Projector },
  { name: "משימות", href: "/dashboard/tasks", icon: CheckSquare },
  { name: "צוות", href: "/dashboard/team", icon: UserCheck },
  { name: "דוחות", href: "/dashboard/reports", icon: BarChart3 },
];

export default function Sidebar({ isOpen, onToggle, isMobile }: SidebarProps) {
  const [location] = useLocation();

  if (isMobile && !isOpen) {
    return null;
  }

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={onToggle}
          data-testid="sidebar-overlay"
        />
      )}
      <div className={cn(
        "fixed right-0 top-0 h-full w-64 bg-white shadow-sm border-l border-gray-100 z-50 transform transition-transform duration-300",
        isOpen ? "translate-x-0" : "translate-x-full",
        !isMobile && "translate-x-0"
      )} data-testid="sidebar">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="text-lg font-bold text-primary font-rubik" data-testid="sidebar-logo">BRIXEL7</div>
          {isMobile && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              data-testid="sidebar-close"
            >
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>

        {/* Navigation */}
        <nav className="p-6" data-testid="sidebar-navigation">
          <div className="space-y-2">
            {navigation.map((item) => {
              const isActive = location === item.href;
              const Icon = item.icon;
              
              return (
                <Link key={item.name} href={item.href}>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start space-x-reverse space-x-3 sidebar-item",
                      isActive && "bg-primary/10 text-primary hover:bg-primary/10"
                    )}
                    onClick={isMobile ? onToggle : undefined}
                    data-testid={`nav-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{item.name}</span>
                  </Button>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-100">
          <div className="text-xs text-gray-500 text-center">
            גרסה 1.0.0
          </div>
        </div>
      </div>
    </>
  );
}
