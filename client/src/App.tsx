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
import Team from "@/pages/dashboard/team";
import Reports from "@/pages/dashboard/reports";
import ClientDashboard from "@/pages/client-portal/client-dashboard";
import Profile from "@/pages/dashboard/profile";
import Settings from "@/pages/dashboard/settings";
import Assets from "@/pages/dashboard/assets";
import NotFound from "@/pages/not-found";
import HelpCenter from "@/pages/help-center";

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

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Switch>
          <Route path="/" component={Homepage} />
          <Route path="/login" component={Login} />
          <Route path="/signup" component={Signup} />
          <Route path="/forgot-password" component={ForgotPassword} />
          <Route path="/reset-password" component={ResetPassword} />

          {/* DASHBOARD */}
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
          <Route path="/dashboard/clients/:id">
            <ProtectedRoute>
              <DashboardLayout>
                <ClientDetails />
              </DashboardLayout>
            </ProtectedRoute>
          </Route>

          {/* PROJECTS LIST */}
          <Route
            path="/dashboard/projects"
            component={() => (
              <ProtectedRoute>
                <DashboardLayout>
                  <Projects />
                </DashboardLayout>
              </ProtectedRoute>
            )}
          />

          {/* NEW PROJECT */}
          <Route
            path="/dashboard/projects/new"
            component={() => (
              <ProtectedRoute>
                <DashboardLayout>
                  <NewProject />
                </DashboardLayout>
              </ProtectedRoute>
            )}
          />

          {/* PROJECT DETAILS */}
          <Route
            path="/dashboard/project-details/:projectId"
            component={() => (
              <ProtectedRoute>
                <DashboardLayout>
                  <ProjectDetails />
                </DashboardLayout>
              </ProtectedRoute>
            )}
          />

          {/* LEGACY PROJECT DETAILS ROUTE */}
          <Route
            path="/dashboard/projects/:projectId"
            component={() => (
              <ProtectedRoute>
                <DashboardLayout>
                  <ProjectDetails />
                </DashboardLayout>
              </ProtectedRoute>
            )}
          />

          <Route path="/dashboard/tasks">
            <ProtectedRoute>
              <DashboardLayout>
                <Tasks />
              </DashboardLayout>
            </ProtectedRoute>
          </Route>
          
          <Route path="/dashboard/reports">
            <ProtectedRoute>
              <DashboardLayout>
                <Reports />
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

          {/* ADDED PROFILE AND SETTINGS ROUTES */}
          <Route path="/dashboard/profile">
            <ProtectedRoute>
              <DashboardLayout>
                <Profile />
              </DashboardLayout>
            </ProtectedRoute>
          </Route>
          <Route path="/dashboard/settings">
            <ProtectedRoute>
              <DashboardLayout>
                <Settings />
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

          {/* CLIENT PORTAL - Standalone authentication */}
          <Route path="/client-portal" component={ClientDashboard} />

          {/* ADDED HELP CENTER ROUTE */}
          <Route path="/help" component={HelpCenter} />

          <Route component={NotFound} />
        </Switch>
      </TooltipProvider>
    </QueryClientProvider>
  );
}