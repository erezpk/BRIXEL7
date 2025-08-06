import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";
import { lazy } from "react";

import Homepage from "@/pages/homepage";
import Login from "@/pages/auth/login";
import Signup from "@/pages/auth/signup";
import ForgotPassword from "@/pages/auth/forgot-password";
import ResetPassword from "@/pages/auth/reset-password";

import DashboardLayout from "@/components/layout/dashboard-layout";
import Dashboard from "@/pages/dashboard/dashboard";
import TeamDashboard from "@/pages/team-member-portal/team-member-dashboard"; // Corrected import path
import Clients from "@/pages/dashboard/clients";
import ClientDetails from "@/pages/dashboard/client-details";
import Leads from "@/pages/dashboard/leads";

import Projects from "@/pages/dashboard/projects"; // index.tsx
import NewProject from "@/pages/dashboard/projects/NewProject";
import ProjectDetails from "@/pages/dashboard/ProjectDetails";
import Tasks from "@/pages/dashboard/tasks";
import Team from "@/pages/dashboard/team";
import Reports from "@/pages/dashboard/reports";
import EmailSettings from "@/pages/dashboard/email-settings";
import ClientDashboard from "@/pages/client-portal/client-dashboard";
import Profile from "@/pages/dashboard/profile";
import Settings from "@/pages/dashboard/settings";
import EmailSetup from "@/pages/dashboard/email-setup";
import ClientTemplates from "@/pages/dashboard/client-templates";
import Assets from "@/pages/dashboard/assets";
import Financial from "@/pages/dashboard/financial";
import ProductsPage from "@/pages/dashboard/products";
import NewQuotePage from "@/pages/dashboard/financial/quotes/new";
import QuotesPage from "@/pages/dashboard/financial/quotes/index";
import QuoteDetailPage from "@/pages/dashboard/financial/quotes/[id]";
import QuoteApprovalPage from "@/pages/quote-approval/[id]";
import TeamMemberDashboard from "@/pages/team-member-portal/team-member-dashboard";
import NotFound from "@/pages/not-found";
import HelpCenter from "@/pages/help-center";
import PDFSettingsPage from "@/pages/dashboard/settings/pdf-settings";
import PDFSettingsMainPage from "@/pages/dashboard/pdf-settings";

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

function DashboardRouteContent() {
  const { user } = useAuth();

  return (
    <DashboardLayout>
      {user?.role === 'client' ? <ClientDashboard /> :
       user?.role === 'team_member' ? <TeamDashboard /> :
       <Dashboard />}
    </DashboardLayout>
  );
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
          {/* Updated dashboard route to render different dashboards based on user role */}
          <Route path="/dashboard">
            <ProtectedRoute>
              <DashboardRouteContent />
            </ProtectedRoute>
          </Route>

          <Route path="/dashboard/leads">
            <ProtectedRoute>
              <DashboardLayout>
                <Leads />
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
          <Route path="/dashboard/client-templates">
            <ProtectedRoute>
              <DashboardLayout>
                <ClientTemplates />
              </DashboardLayout>
            </ProtectedRoute>
          </Route>

          <Route path="/dashboard/email-settings">
            <ProtectedRoute>
              <DashboardLayout>
                <EmailSettings />
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
          <Route path="/dashboard/settings/pdf">
            <ProtectedRoute>
              <DashboardLayout>
                <PDFSettingsMainPage />
              </DashboardLayout>
            </ProtectedRoute>
          </Route>

          <Route path="/dashboard/email-setup">
            <ProtectedRoute>
              <DashboardLayout>
                <EmailSetup />
              </DashboardLayout>
            </ProtectedRoute>
          </Route>

          <Route path="/dashboard/client-templates">
            <ProtectedRoute>
              <DashboardLayout>
                <ClientTemplates />
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

          {/* FINANCIAL MANAGEMENT ROUTES */}
          {/* More specific routes first */}
          <Route path="/dashboard/financial/quotes/new">
            <ProtectedRoute>
              <DashboardLayout>
                <NewQuotePage />
              </DashboardLayout>
            </ProtectedRoute>
          </Route>

          <Route path="/dashboard/financial/quotes/:id">
            <ProtectedRoute>
              <DashboardLayout>
                <QuoteDetailPage />
              </DashboardLayout>
            </ProtectedRoute>
          </Route>

          <Route path="/dashboard/financial/quotes">
            <ProtectedRoute>
              <DashboardLayout>
                <QuotesPage />
              </DashboardLayout>
            </ProtectedRoute>
          </Route>

          <Route path="/dashboard/financial">
            <ProtectedRoute>
              <DashboardLayout>
                <Financial />
              </DashboardLayout>
            </ProtectedRoute>
          </Route>

          <Route path="/dashboard/products">
            <ProtectedRoute>
              <DashboardLayout>
                <ProductsPage />
              </DashboardLayout>
            </ProtectedRoute>
          </Route>

          {/* CLIENT PORTAL - Standalone authentication */}
          <Route path="/client-portal" component={() => {
          const urlParams = new URLSearchParams(window.location.search);
          const clientId = urlParams.get('clientId');

          if (clientId) {
            return <ClientDashboard />;
          } else {
            return <ClientDashboard />;
          }
        }} />
          {/* SETTINGS SUB-ROUTES */}
          <Route path="/dashboard/settings/email">
            <ProtectedRoute>
              <DashboardLayout>
                <EmailSetup />
              </DashboardLayout>
            </ProtectedRoute>
          </Route>

          <Route path="/dashboard/settings/pdf">
            <ProtectedRoute>
              <DashboardLayout>
                <PDFSettingsPage />
              </DashboardLayout>
            </ProtectedRoute>
          </Route>

          {/* ADDED CLIENT SETTINGS ROUTE */}
          <Route path="/client-settings" component={lazy(() => import("./pages/client-portal/client-settings"))} />

          {/* TEAM MEMBER DASHBOARD */}
          <Route path="/team-member-dashboard">
            <ProtectedRoute>
              <TeamMemberDashboard />
            </ProtectedRoute>
          </Route>

          {/* QUOTE APPROVAL - Public route */}
          <Route path="/quote-approval/:id" component={QuoteApprovalPage} />

          {/* ADDED HELP CENTER ROUTE */}
          <Route path="/help" component={HelpCenter} />

          <Route component={NotFound} />
        </Switch>
      </TooltipProvider>
    </QueryClientProvider>
  );
}