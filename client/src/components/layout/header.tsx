import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { 
  Menu, 
  Search, 
  Bell, 
  Settings, 
  LogOut,
  User,
  Check,
  Clock,
  AlertCircle
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

interface HeaderProps {
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
}

export default function Header({ onToggleSidebar }: HeaderProps) {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Fetch recent activity for notifications
  const { data: notifications } = useQuery({
    queryKey: ['/api/dashboard/activity'],
    staleTime: 60000, // 1 minute
  });

  const handleLogout = () => {
    logout(undefined, {
      onSuccess: () => {
        toast({
          title: "יציאה הצליחה",
          description: "להתראות!",
        });
        window.location.href = "/";
      },
    });
  };

  const getUserInitials = () => {
    if (!user?.fullName) return "U";
    return user.fullName
      .split(" ")
      .map(name => name.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-100" data-testid="header">
      <div className="px-6 py-4">
        <div className="flex justify-between items-center">
          {/* Left side - Mobile menu and title */}
          <div className="flex items-center space-x-reverse space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleSidebar}
              className="lg:hidden"
              data-testid="mobile-menu-toggle"
            >
              <Menu className="h-6 w-6" />
            </Button>
            <h1 className="text-xl font-bold text-gray-900 font-rubik" data-testid="page-title">
              דשבורד הסוכנות
            </h1>
          </div>

          {/* Right side - Search, notifications, user menu */}
          <div className="flex items-center space-x-reverse space-x-4">
            {/* Search */}
            <div className="relative hidden md:block">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="חיפוש..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10 w-64 text-right"
                data-testid="search-input"
              />
            </div>

            {/* Notifications */}
            <Popover open={notificationsOpen} onOpenChange={setNotificationsOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="relative p-2"
                  data-testid="notifications-button"
                >
                  <Bell className="h-5 w-5" />
                  {notifications && notifications.length > 0 && (
                    <span className="absolute -top-1 -left-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {notifications.length > 9 ? '9+' : notifications.length}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="end" data-testid="notifications-panel">
                <div className="p-4 border-b">
                  <h3 className="font-medium text-right">התראות</h3>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {!notifications || notifications.length === 0 ? (
                    <div className="p-6 text-center text-gray-500">
                      <Bell className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p>אין התראות חדשות</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {notifications.slice(0, 10).map((notification: any, index: number) => (
                        <div
                          key={notification.id || index}
                          className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                          data-testid={`notification-${index}`}
                        >
                          <div className="flex items-start space-x-reverse space-x-3">
                            <div className="flex-shrink-0 mt-1">
                              {notification.action === 'created' ? (
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              ) : notification.action === 'updated' ? (
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              ) : (
                                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                              )}
                            </div>
                            <div className="flex-1 text-right">
                              <p className="text-sm text-gray-900">
                                {notification.action === 'created' && 'נוצר '}
                                {notification.action === 'updated' && 'עודכן '}
                                {notification.action === 'deleted' && 'נמחק '}
                                {notification.entityType === 'client' && 'לקוח'}
                                {notification.entityType === 'project' && 'פרויקט'}
                                {notification.entityType === 'task' && 'משימה'}
                                {notification.details?.clientName && `: ${notification.details.clientName}`}
                                {notification.details?.projectName && `: ${notification.details.projectName}`}
                                {notification.details?.taskTitle && `: ${notification.details.taskTitle}`}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(notification.createdAt).toLocaleDateString('he-IL', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  day: 'numeric',
                                  month: 'short'
                                })}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {notifications && notifications.length > 10 && (
                  <div className="p-3 border-t text-center">
                    <Button variant="ghost" size="sm" className="text-xs">
                      הצג עוד התראות
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-reverse space-x-2 p-2" data-testid="user-menu-trigger">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.avatar || undefined} alt={user?.fullName} />
                    <AvatarFallback className="font-medium">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:block text-left">
                    <div className="text-sm font-medium text-gray-700">
                      {user?.fullName}
                    </div>
                    <div className="text-xs text-gray-500">
                      {user?.role === 'agency_admin' ? 'מנהל סוכנות' : 
                       user?.role === 'team_member' ? 'חבר צוות' :
                       user?.role === 'client' ? 'לקוח' : 'משתמש'}
                    </div>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              
              <DropdownMenuContent align="end" className="w-56" data-testid="user-menu">
                <DropdownMenuLabel>החשבון שלי</DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                <DropdownMenuItem data-testid="menu-profile">
                  <User className="ml-2 h-4 w-4" />
                  <span>פרופיל</span>
                </DropdownMenuItem>
                
                <DropdownMenuItem data-testid="menu-settings">
                  <Settings className="ml-2 h-4 w-4" />
                  <span>הגדרות</span>
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem onClick={handleLogout} className="text-red-600" data-testid="menu-logout">
                  <LogOut className="ml-2 h-4 w-4" />
                  <span>יציאה</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
