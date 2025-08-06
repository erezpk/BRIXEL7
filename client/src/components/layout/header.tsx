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
  const [clickedNotifications, setClickedNotifications] = useState<Set<string>>(new Set());

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

  const handleNotificationClick = (notificationId: string) => {
    setClickedNotifications(prev => new Set(Array.from(prev).concat(notificationId)));
  };

  const isNotificationNew = (notification: any) => {
    const createdAt = new Date(notification.createdAt);
    const now = new Date();
    const hoursDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
    return hoursDiff < 24; // Consider notifications new if less than 24 hours old
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
                  {notifications && Array.isArray(notifications) && notifications.length > 0 ? (
                    <span className="absolute -top-1 -left-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {notifications.length > 9 ? '9+' : notifications.length.toString()}
                    </span>
                  ) : null}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="end" data-testid="notifications-panel">
                <div className="p-4 border-b">
                  <h3 className="font-medium text-right">התראות</h3>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {!notifications || !Array.isArray(notifications) || notifications.length === 0 ? (
                    <div className="p-6 text-center text-gray-500">
                      <Bell className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p>אין התראות חדשות</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {Array.isArray(notifications) && notifications.slice(0, 10).map((notification: any, index: number) => {
                        const isNew = isNotificationNew(notification);
                        const isClicked = clickedNotifications.has(notification.id || index.toString());

                        return (
                        <div
                          key={notification.id || index}
                          className={`p-3 cursor-pointer border-b last:border-b-0 transition-all duration-200 ${
                            isClicked 
                              ? 'bg-blue-50 hover:bg-blue-100' 
                              : isNew 
                                ? 'bg-gradient-to-r from-green-50 to-blue-50 hover:bg-gradient-to-r hover:from-green-100 hover:to-blue-100 border-l-4 border-green-500' 
                                : 'hover:bg-gray-50'
                          }`}
                          onClick={() => handleNotificationClick(notification.id || index.toString())}
                          data-testid={`notification-${index}`}
                        >
                          <div className="flex items-start space-x-reverse space-x-3">
                            <div className="flex-shrink-0 mt-1">
                              {isNew && !isClicked && (
                                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-lg"></div>
                              )}
                              {notification.action === 'created' ? (
                                <div className={`w-2 h-2 bg-green-500 rounded-full ${isNew && !isClicked ? 'ml-1' : ''}`}></div>
                              ) : notification.action === 'updated' ? (
                                <div className={`w-2 h-2 bg-blue-500 rounded-full ${isNew && !isClicked ? 'ml-1' : ''}`}></div>
                              ) : (
                                <div className={`w-2 h-2 bg-gray-400 rounded-full ${isNew && !isClicked ? 'ml-1' : ''}`}></div>
                              )}
                            </div>
                            <div className="flex-1 text-right">
                              <p className={`text-sm ${isNew && !isClicked ? 'text-gray-900 font-semibold' : 'text-gray-800'}`}>
                                {isNew && !isClicked && (
                                  <span className="inline-block w-2 h-2 bg-green-500 rounded-full ml-2 animate-pulse"></span>
                                )}
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
                              <p className={`text-xs mt-1 ${isNew && !isClicked ? 'text-gray-600 font-medium' : 'text-gray-500'}`}>
                                {new Date(notification.createdAt).toLocaleDateString('he-IL', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  day: 'numeric',
                                  month: 'short'
                                })}
                                {isNew && !isClicked && (
                                  <span className="text-green-600 font-semibold mr-2">חדש!</span>
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                      })}
                    </div>
                  )}
                </div>
                {notifications && Array.isArray(notifications) && notifications.length > 10 ? (
                  <div className="p-3 border-t text-center">
                    <Button variant="ghost" size="sm" className="text-xs">
                      הצג עוד התראות
                    </Button>
                  </div>
                ) : null}
              </PopoverContent>
            </Popover>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-reverse space-x-2 p-2" data-testid="user-menu-trigger">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.avatar || localStorage.getItem('userAvatar') || undefined} />
                    <AvatarFallback className="text-sm">
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

                <DropdownMenuItem 
                  onClick={() => window.location.href = '/dashboard/profile'}
                  data-testid="menu-profile"
                >
                  <User className="ml-2 h-4 w-4" />
                  <span>פרופיל</span>
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