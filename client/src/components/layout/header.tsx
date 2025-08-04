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
  Menu, 
  Search, 
  Bell, 
  Settings, 
  LogOut,
  User
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

interface HeaderProps {
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
}

export default function Header({ onToggleSidebar }: HeaderProps) {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");

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
            <Button
              variant="ghost"
              size="sm"
              className="relative p-2"
              data-testid="notifications-button"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -left-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                3
              </span>
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-reverse space-x-2 p-2" data-testid="user-menu-trigger">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.avatar} alt={user?.fullName} />
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
