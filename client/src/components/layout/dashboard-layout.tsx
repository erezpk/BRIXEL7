import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import Sidebar from "./sidebar";
import Header from "./header";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <Sidebar 
        isOpen={sidebarOpen} 
        onToggle={() => setSidebarOpen(!sidebarOpen)} 
        isMobile={isMobile}
      />
      
      <div className={`flex flex-col ${!isMobile && sidebarOpen ? 'mr-64' : ''} transition-all duration-300`}>
        <Header 
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
          sidebarOpen={sidebarOpen}
        />
        
        <main className="flex-1 p-6" data-testid="dashboard-content">
          {children}
        </main>
      </div>
    </div>
  );
}
