import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Home, 
  Users, 
  Projector, 
  CheckSquare, 
  UserCheck, 
  UserPlus,
  Globe, 
  BarChart3, 
  Layers,
  Layout,
  FileText,
  Package,
  Plus,
  X,
  ChevronDown,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  isMobile: boolean;
}

const navigation = [
  { name: "דשבורד", href: "/dashboard", icon: Home },
  { 
    name: "ניהול לקוחות", 
    icon: Users, 
    subItems: [
      { name: "לידים", href: "/dashboard/leads", icon: UserPlus },
      { name: "לקוחות", href: "/dashboard/clients", icon: Users },
    ]
  },
  { 
    name: "ניהול פרויקטים", 
    icon: Projector, 
    subItems: [
      { name: "פרויקטים", href: "/dashboard/projects", icon: Projector },
      { name: "משימות", href: "/dashboard/tasks", icon: CheckSquare },
    ]
  },
  { 
    name: "ניהול פיננסי", 
    icon: FileText, 
    subItems: [
      { name: "ניהול פיננסי", href: "/dashboard/financial", icon: FileText },
      { name: "הצעות מחיר", href: "/dashboard/financial/quotes", icon: FileText },
      { name: "הצעת מחיר חדשה", href: "/dashboard/financial/quotes/new", icon: Plus },
    ]
  },
  { name: "מוצרים ושירותים", href: "/dashboard/products", icon: Package },
  { name: "תבניות לקוח", href: "/dashboard/client-templates", icon: Layout },
  { name: "צוות", href: "/dashboard/team", icon: UserCheck },
  { name: "דוחות", href: "/dashboard/reports", icon: BarChart3 },
];

export default function Sidebar({ isOpen, onToggle, isMobile }: SidebarProps) {
  const [location] = useLocation();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (groupName: string) => {
    setOpenGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };

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
        <ScrollArea className="flex-1 h-[calc(100vh-80px)]">
          <nav className="p-4 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              
              // If item has subItems, render as collapsible group
              if ('subItems' in item && item.subItems) {
                const isGroupOpen = openGroups[item.name];
                const hasActiveChild = item.subItems.some(subItem => location === subItem.href);
                
                return (
                  <Collapsible key={item.name} open={isGroupOpen} onOpenChange={() => toggleGroup(item.name)}>
                    <CollapsibleTrigger asChild>
                      <Button
                        variant={hasActiveChild ? "secondary" : "ghost"}
                        className={cn(
                          "w-full justify-start",
                          hasActiveChild && "bg-primary/10 text-primary"
                        )}
                        data-testid={`nav-group-${item.name}`}
                      >
                        <Icon className="ml-2 h-4 w-4" />
                        <span className="flex-1 text-right">{item.name}</span>
                        {isGroupOpen ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-1 mt-1 mr-4">
                      {item.subItems.map((subItem) => {
                        const SubIcon = subItem.icon;
                        const isActive = location === subItem.href;
                        
                        return (
                          <Link key={subItem.name} href={subItem.href}>
                            <Button
                              variant={isActive ? "secondary" : "ghost"}
                              size="sm"
                              className={cn(
                                "w-full justify-start text-sm",
                                isActive && "bg-primary/10 text-primary"
                              )}
                              data-testid={`nav-${subItem.name}`}
                              onClick={isMobile ? onToggle : undefined}
                            >
                              <SubIcon className="ml-2 h-3 w-3" />
                              {subItem.name}
                            </Button>
                          </Link>
                        );
                      })}
                    </CollapsibleContent>
                  </Collapsible>
                );
              } else {
                // Regular navigation item
                const isActive = location === item.href;
                
                return (
                  <Link key={item.name} href={item.href}>
                    <Button
                      variant={isActive ? "secondary" : "ghost"}
                      className={cn(
                        "w-full justify-start",
                        isActive && "bg-primary/10 text-primary"
                      )}
                      data-testid={`nav-${item.name}`}
                      onClick={isMobile ? onToggle : undefined}
                    >
                      <Icon className="ml-2 h-4 w-4" />
                      {item.name}
                    </Button>
                  </Link>
                );
              }
            })}
          </nav>
        </ScrollArea>

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
