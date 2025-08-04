import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import Homepage from "@/pages/homepage";
import Login from "@/pages/auth/login";
import Signup from "@/pages/auth/signup";
import DashboardLayout from "@/components/layout/dashboard-layout";
import Dashboard from "@/pages/dashboard/dashboard";
import Clients from "@/pages/dashboard/clients";
import Projects from "@/pages/dashboard/projects";
import ProjectDetails from "@/pages/dashboard/projects/ProjectDetails";
import Tasks from "@/pages/dashboard/tasks";
import Assets from "@/pages/dashboard/assets";
import Team from "@/pages/dashboard/team";
import ClientDashboard from "@/pages/client-portal/client-dashboard";
import NotFound from "@/pages/not-found";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    window.location.href = "/login";
    return null;
  }

  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Homepage} />
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />

      {/* Dashboard */}
      <Route path="/dashboard">
        <ProtectedRoute>
          <DashboardLayout>
            <Dashboard />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/dashboard/clients">
        <ProtectedRoute>
          <DashboardLayout>
            <Clients />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>

      {/* Dynamic project details route must come before the static list */}
      <Route path="/dashboard/projects/:projectId">
        {(params) => (
          <ProtectedRoute>
            <DashboardLayout>
              <ProjectDetails projectId={params.projectId!} />
            </DashboardLayout>
          </ProtectedRoute>
        )}
      </Route>

      <Route path="/dashboard/projects">
        <ProtectedRoute>
          <DashboardLayout>
            <Projects />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/dashboard/tasks">
        <ProtectedRoute>
          <DashboardLayout>
            <Tasks />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/dashboard/assets">
        <ProtectedRoute>
          <DashboardLayout>
            <Assets />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/dashboard/team">
        <ProtectedRoute>
          <DashboardLayout>
            <Team />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/client-portal">
        <ProtectedRoute>
          <ClientDashboard />
        </ProtectedRoute>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
