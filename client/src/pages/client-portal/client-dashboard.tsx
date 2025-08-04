import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ClientStats from "@/components/client-portal/client-stats";
import ClientProjects from "@/components/client-portal/client-projects";
import ClientActivity from "@/components/client-portal/client-activity";
import ClientFiles from "@/components/client-portal/client-files";
import { useToast } from "@/hooks/use-toast";

export default function ClientDashboard() {
  const { user, logout } = useAuth();
  const { toast } = useToast();

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

  if (user?.role !== 'client') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50" dir="rtl">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">גישה מוגבלת</h1>
          <p className="text-gray-600">אין לך הרשאה לגשת לפורטל הלקוחות</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl" data-testid="client-dashboard">
      {/* Client Portal Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-100">
        <div className="px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-reverse space-x-4">
              <h1 className="text-xl font-bold text-gray-900 font-rubik" data-testid="client-portal-title">
                פורטל לקוחות - {user?.fullName}
              </h1>
            </div>
            <div className="flex items-center space-x-reverse space-x-4">
              {/* Notifications */}
              <Button
                variant="ghost"
                size="sm"
                className="relative p-2"
                data-testid="client-notifications"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -left-1 w-5 h-5 bg-primary text-white text-xs rounded-full flex items-center justify-center">
                  2
                </span>
              </Button>
              
              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-reverse space-x-2 p-2" data-testid="client-user-menu">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.avatar} alt={user?.fullName} />
                      <AvatarFallback className="font-medium">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium text-gray-700">
                      {user?.fullName}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem>
                    פרופיל
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    הגדרות
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600" data-testid="client-logout">
                    <LogOut className="ml-2 h-4 w-4" />
                    <span>יציאה</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Client Dashboard Overview */}
        <ClientStats />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          {/* Current Projects */}
          <ClientProjects />

          {/* Recent Updates */}
          <ClientActivity />
        </div>

        {/* Files & Documents */}
        <div className="mt-8">
          <ClientFiles />
        </div>
      </div>
    </div>
  );
}
