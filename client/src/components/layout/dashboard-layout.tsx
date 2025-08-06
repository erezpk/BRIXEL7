import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import Sidebar from "./sidebar";
import Header from "./header";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const isMobile = useIsMobile();

  // במובייל - התפריט הצדדי סגור כברירת מחדל
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getSidebarWidth = () => {
    if (isMobile) return 0;
    if (sidebarCollapsed) return 16; // w-16 = 64px
    return 64; // w-64 = 256px
  };

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <Sidebar 
        isOpen={isMobile ? mobileMenuOpen : true}
        onToggle={() => setMobileMenuOpen(!mobileMenuOpen)} 
        isMobile={isMobile}
        isCollapsed={!isMobile && sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      
      <div 
        className="flex flex-col transition-all duration-300"
        style={{ marginRight: `${getSidebarWidth() * 4}px` }}
      >
        <Header 
          onToggleSidebar={() => isMobile ? setMobileMenuOpen(!mobileMenuOpen) : setSidebarCollapsed(!sidebarCollapsed)} 
          sidebarOpen={isMobile ? mobileMenuOpen : !sidebarCollapsed}
        />
        
        <main className="flex-1 p-6" data-testid="dashboard-content">
          {children}
        </main>
      </div>
    </div>
  );
}
