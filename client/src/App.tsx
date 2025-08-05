import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";

import Homepage from "@/pages/homepage";
import Login from "@/pages/auth/login";
import Signup from "@/pages/auth/signup";
import ForgotPassword from "@/pages/auth/forgot-password";
import ResetPassword from "@/pages/auth/reset-password";

import DashboardLayout from "@/components/layout/dashboard-layout";
import Dashboard from "@/pages/dashboard/dashboard";
import Clients from "@/pages/dashboard/clients";
import ClientDetails from "@/pages/dashboard/client-details";

import Projects from "@/pages/dashboard/projects"; // index.tsx
import NewProject from "@/pages/dashboard/projects/NewProject";
import ProjectDetails from "@/pages/dashboard/ProjectDetails";
import Tasks from "@/pages/dashboard/tasks";
import Assets from "@/pages/dashboard/assets";
import Team from "@/pages/dashboard/team";
import ClientDashboard from "@/pages/client-portal/client-dashboard";
import ClientDashboardNew from "@/pages/client-portal/client-dashboard-new";
import ClientProjectDetails from "@/pages/client-portal/project-details";
import Profile from "@/pages/dashboard/profile";
import Settings from "@/pages/dashboard/settings";
import TeamDashboardPage from "@/pages/team-dashboard";
import LeadsManagementPage from "@/pages/leads-management";
import NotFound from "@/pages/not-found";
import HelpCenter from "@/pages/help-center";
import TeamMemberDashboard from "./pages/dashboard/team-member-dashboard";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/login");
    }
  }, [user, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) {
    return null; // הייעוד יקרה דרך useEffect
  }

  return <>{children}</>;
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <>
          <Route path="/" component={Homepage} />
          <Route path="/login" component={Login} />
          <Route path="/signup" component={Signup} />
          <Route path="/forgot-password" component={ForgotPassword} />
          <Route path="/reset-password" component={ResetPassword} />
        </>
      ) : (
        <>
          <Route path="/" component={Homepage} />
          <Route path="/dashboard" nest>
            <DashboardLayout>
              <Route path="/" component={Dashboard} />
              <Route path="/clients" component={Clients} />
              <Route path="/clients/:id" component={ClientDetails} />
              <Route path="/projects" component={Projects} />
              <Route path="/projects/new" component={NewProject} />
              <Route path="/projects/:id" component={ProjectDetails} />
              <Route path="/tasks" component={Tasks} />
              <Route path="/assets" component={Assets} />
              <Route path="/team" component={Team} />
              <Route path="/profile" component={Profile} />
              <Route path="/settings" component={Settings} />
              <Route path="/team-member" component={TeamMemberDashboard} />
            </DashboardLayout>
          </Route>
          <Route path="/client-portal" component={ClientDashboard} />
          <Route path="/client-portal-new" component={ClientDashboardNew} />
          <Route path="/client-projects/:id" component={ClientProjectDetails} />
          <Route path="/team-dashboard" component={TeamDashboardPage} />
          <Route path="/leads" component={LeadsManagementPage} />
          <Route path="/help" component={HelpCenter} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}