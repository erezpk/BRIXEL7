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
  ChevronRight,
  ChevronLeft,
  Menu,
  Settings,
  Building2,
  Mail,
  CreditCard,
  Calendar,
  MessageCircle,
  User,
  DollarSign
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  isMobile: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
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
    name: "מכירות ופיננסים", 
    icon: BarChart3, 
    subItems: [
      { name: "דשבורד פיננסי", href: "/dashboard/finance", icon: DollarSign },
      { name: "מוצרים ושירותים", href: "/dashboard/products", icon: Package },
      { name: "הצעות מחיר", href: "/dashboard/quotes", icon: FileText },
      { name: "מסמכים", href: "/dashboard/documents", icon: FileText },
      { name: "תשלומים", href: "/dashboard/payments", icon: CreditCard },
    ]
  },
  { name: "יומן ופגישות", href: "/dashboard/calendar", icon: Calendar },
  { name: "תקשורת", href: "/dashboard/communications", icon: MessageCircle },
  { 
    name: "ניהול סוכנות", 
    icon: Building2, 
    subItems: [
      { name: "צוות", href: "/dashboard/team", icon: UserCheck },
      { name: "דוחות", href: "/dashboard/reports", icon: BarChart3 },
    ]
  },
  { 
    name: "הגדרות", 
    icon: Settings, 
    subItems: [
      { name: "פרופיל אישי", href: "/dashboard/profile", icon: User },
      { name: "הגדרות מערכת", href: "/dashboard/unified-settings", icon: Settings },
      { name: "הגדרות אימייל", href: "/dashboard/email-setup", icon: Mail },
    ]
  },
];

export default function Sidebar({ isOpen, onToggle, isMobile, isCollapsed = false, onToggleCollapse }: SidebarProps) {
  const [location] = useLocation();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (groupName: string) => {
    setOpenGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };

  // במובייל - הצגה כמו מודל מלא מסך
  if (isMobile) {
    if (!isOpen) return null;

    return (
      <>
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={onToggle}
        />
        <div className="fixed inset-0 bg-white z-50 flex flex-col" dir="rtl">
          {/* כותרת */}
          <div className="flex items-center justify-between p-4 border-b">
            <Button variant="ghost" size="sm" onClick={onToggle}>
              <X className="h-5 w-5" />
            </Button>
            <h2 className="text-lg font-bold">תפריט ניווט</h2>
          </div>

          {/* תוכן התפריט */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;

                if ('subItems' in item && item.subItems) {
                  const isGroupOpen = openGroups[item.name];
                  const hasActiveChild = item.subItems.some(subItem => location === subItem.href);

                  return (
                    <div key={item.name} className="space-y-1">
                      <Button
                        variant={hasActiveChild ? "secondary" : "ghost"}
                        className="w-full justify-between h-12 text-base"
                        onClick={() => toggleGroup(item.name)}
                        dir="rtl"
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="h-5 w-5" />
                          <span>{item.name}</span>
                        </div>
                        {isGroupOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                      </Button>

                      {isGroupOpen && (
                        <div className="mr-8 space-y-1">
                          {item.subItems.map((subItem) => {
                            const SubIcon = subItem.icon;
                            const isActive = location === subItem.href;

                            return (
                              <Link key={subItem.name} href={subItem.href}>
                                <Button
                                  variant={isActive ? "secondary" : "ghost"}
                                  className="w-full justify-start h-10"
                                  onClick={onToggle}
                                  dir="rtl"
                                >
                                  <SubIcon className="h-4 w-4 ml-2" />
                                  {subItem.name}
                                </Button>
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                } else {
                  const isActive = location === item.href;

                  return (
                    <Link key={item.name} href={item.href}>
                      <Button
                        variant={isActive ? "secondary" : "ghost"}
                        className="w-full justify-start h-12 text-base"
                        onClick={onToggle}
                        dir="rtl"
                      >
                        <Icon className="h-5 w-5 ml-3" />
                        {item.name}
                      </Button>
                    </Link>
                  );
                }
              })}
            </div>
          </ScrollArea>
        </div>
      </>
    );
  }

  // תפריט לדסקטופ
  return (
    <div className={cn(
      "fixed right-0 top-0 h-full bg-white shadow-sm border-l border-gray-100 z-50 transition-all duration-300",
      isCollapsed ? "w-16" : "w-64"
    )}>
      {/* כותרת עם כפתור צמצום */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        {!isCollapsed && (
          <div className="text-lg font-bold text-primary font-rubik">BRIXEL7</div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleCollapse}
          className="h-8 w-8 p-0"
        >
          {isCollapsed ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>
      </div>

      {/* תפריט ניווט */}
      <ScrollArea className="flex-1 h-[calc(100vh-80px)]">
        <nav className={cn("p-2 space-y-1", isCollapsed && "p-1")}>
          {navigation.map((item) => {
            const Icon = item.icon;

            if ('subItems' in item && item.subItems) {
              if (isCollapsed) {
                // במצב מצומצם - הצגה כטולטיפ פשוט
                const hasActiveChild = item.subItems.some(subItem => location === subItem.href);
                return (
                  <div key={item.name} className="relative group">
                    <Button
                      variant={hasActiveChild ? "secondary" : "ghost"}
                      className="w-full h-10 p-0 justify-center"
                      title={item.name}
                    >
                      <Icon className="h-5 w-5" />
                    </Button>
                    {/* תפריט מרחף */}
                    <div className="absolute left-full top-0 ml-2 bg-white border shadow-lg rounded-md p-2 space-y-1 opacity-0 group-hover:opacity-100 transition-opacity z-50 min-w-48">
                      <div className="font-medium text-sm text-gray-900 pb-1 border-b">{item.name}</div>
                      {item.subItems.map((subItem) => {
                        const SubIcon = subItem.icon;
                        const isActive = location === subItem.href;
                        return (
                          <Link key={subItem.name} href={subItem.href}>
                            <Button
                              variant={isActive ? "secondary" : "ghost"}
                              size="sm"
                              className="w-full justify-start text-sm h-8"
                              dir="rtl"
                            >
                              <SubIcon className="h-3 w-3 ml-2" />
                              {subItem.name}
                            </Button>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              } else {
                // במצב מורחב - תפריט רגיל
                const isGroupOpen = openGroups[item.name];
                const hasActiveChild = item.subItems.some(subItem => location === subItem.href);

                return (
                  <Collapsible key={item.name} open={isGroupOpen} onOpenChange={() => toggleGroup(item.name)}>
                    <CollapsibleTrigger asChild>
                      <Button
                        variant={hasActiveChild ? "secondary" : "ghost"}
                        className="w-full justify-between h-10"
                        dir="rtl"
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="h-4 w-4" />
                          <span className="ml-3">{item.name}</span>
                        </div>
                        {isGroupOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-1 mt-1 mr-6">
                      {item.subItems.map((subItem) => {
                        const SubIcon = subItem.icon;
                        const isActive = location === subItem.href;

                        return (
                          <Link key={subItem.name} href={subItem.href}>
                            <Button
                              variant={isActive ? "secondary" : "ghost"}
                              size="sm"
                              className="w-full justify-start text-sm h-8"
                              dir="rtl"
                            >
                              <SubIcon className="h-3 w-3 ml-2" />
                              {subItem.name}
                            </Button>
                          </Link>
                        );
                      })}
                    </CollapsibleContent>
                  </Collapsible>
                );
              }
            } else {
              const isActive = location === item.href;

              return (
                <Link key={item.name} href={item.href}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className={cn(
                      "w-full h-10",
                      isCollapsed ? "justify-center p-0" : "justify-start"
                    )}
                    title={isCollapsed ? item.name : undefined}
                    dir="rtl"
                  >
                    <Icon className="h-4 w-4" />
                    {!isCollapsed && <span className="ml-3">{item.name}</span>}
                  </Button>
                </Link>
              );
            }
          })}
        </nav>
      </ScrollArea>
    </div>
  );
}