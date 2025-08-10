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
import SetupAgency from "./pages/setup-agency";
import ForgotPassword from "@/pages/auth/forgot-password";
import ResetPassword from "@/pages/auth/reset-password";

import DashboardLayout from "@/components/layout/dashboard-layout";
import Dashboard from "@/pages/dashboard/dashboard";
import TeamDashboard from "@/pages/team-member-portal/team-member-dashboard"; // Corrected import path
import Clients from "@/pages/dashboard/clients";
import ClientDetails from "@/pages/dashboard/client-details";
import Leads from "@/pages/dashboard/leads";
import LeadDetails from "@/pages/dashboard/lead-details";

import Projects from "@/pages/dashboard/projects"; // index.tsx
import NewProject from "@/pages/dashboard/projects/NewProject";
import ProjectDetails from "@/pages/dashboard/ProjectDetails";
import Tasks from "@/pages/dashboard/tasks";
import Team from "@/pages/dashboard/team";
import Reports from "@/pages/dashboard/reports";
import EmailSettings from "@/pages/dashboard/email-settings";
import ClientDashboard from "@/pages/client-portal/client-dashboard";
// Note: Removed client-dashboard-new.tsx as it was redundant
import Profile from "@/pages/dashboard/profile";
import Settings from "@/pages/dashboard/settings";
import EmailSetup from "@/pages/dashboard/email-setup";
// Removed unused pages for cleaner navigation
import Financial from "@/pages/dashboard/financial";
import ProductsPage from "@/pages/dashboard/products-with-items";
import NewQuotePage from "@/pages/dashboard/sales/quotes/new";
import QuotesPage from "@/pages/dashboard/sales/quotes/index";
import QuoteDetailPage from "@/pages/dashboard/sales/quotes/[id]";
import DocumentsPage from "@/pages/dashboard/financial/documents";
import TransactionsPage from "@/pages/dashboard/financial/transactions";
import InvoicesPage from "@/pages/dashboard/financial/invoices";
import QuoteApprovalPage from "@/pages/quote-approval/[id]";
import TeamMemberDashboard from "@/pages/team-member-portal/team-member-dashboard";
import NotFound from "@/pages/not-found";
import PrivacyPolicy from "@/pages/privacy-policy";
import TermsOfService from "@/pages/terms-of-service";
import HelpCenter from "@/pages/help-center";
import PDFSettingsPage from "@/pages/dashboard/settings/pdf-settings";
import PDFSettingsMainPage from "@/pages/dashboard/pdf-settings";
import AgencySettingsPage from "@/pages/dashboard/settings/agency-settings";
import AgencyTemplates from "@/pages/dashboard/agency-templates";
import PaymentsPage from "@/pages/dashboard/payments";
import FreeLeadFormsPage from "@/pages/dashboard/free-lead-forms";
import SubscriptionLanding from "@/pages/subscription/landing";
import CalendarPage from "@/pages/dashboard/calendar";
import CommunicationsPage from "@/pages/dashboard/communications";
import ReportsPage from "@/pages/dashboard/reports";
import UnifiedSettings from "@/pages/dashboard/unified-settings";
import ItemsManagement from "@/pages/dashboard/items-management";
import { FloatingChatButton } from "@/components/chat/FloatingChatButton";
// New financial pages
import ProductsPageNew from "@/pages/dashboard/products";
import QuotesPageNew from "@/pages/dashboard/quotes";
import FinancePage from "@/pages/dashboard/finance";

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
          <Route path="/setup-agency" component={SetupAgency} />
          <Route path="/forgot-password" component={ForgotPassword} />
          <Route path="/auth/reset-password" component={ResetPassword} />

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
          <Route path="/dashboard/leads/:leadId">
            <ProtectedRoute>
              <DashboardLayout>
                <LeadDetails />
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
          <Route path="/dashboard/settings/agency">
            <ProtectedRoute>
              <DashboardLayout>
                <AgencySettingsPage />
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

          {/* Removed client-templates page - streamlined navigation */}

          {/* Removed assets page - was not needed for the main workflow */}

          {/* Sales Routes */}
          <Route path="/dashboard/sales/quotes">
            <ProtectedRoute>
              <DashboardLayout>
                <QuotesPage />
              </DashboardLayout>
            </ProtectedRoute>
          </Route>
          <Route path="/dashboard/sales/quotes/new">
            <ProtectedRoute>
              <DashboardLayout>
                <NewQuotePage />
              </DashboardLayout>
            </ProtectedRoute>
          </Route>
          <Route path="/dashboard/sales/quotes/:id">
            <ProtectedRoute>
              <DashboardLayout>
                <QuoteDetailPage />
              </DashboardLayout>
            </ProtectedRoute>
          </Route>

          {/* New Financial Pages */}
          <Route path="/dashboard/finance">
            <ProtectedRoute>
              <DashboardLayout>
                <FinancePage />
              </DashboardLayout>
            </ProtectedRoute>
          </Route>
          <Route path="/dashboard/products">
            <ProtectedRoute>
              <DashboardLayout>
                <ProductsPageNew />
              </DashboardLayout>
            </ProtectedRoute>
          </Route>
          <Route path="/dashboard/quotes">
            <ProtectedRoute>
              <DashboardLayout>
                <QuotesPageNew />
              </DashboardLayout>
            </ProtectedRoute>
          </Route>

          {/* Financial Routes */}
          <Route path="/dashboard/financial/documents">
            <ProtectedRoute>
              <DashboardLayout>
                <DocumentsPage />
              </DashboardLayout>
            </ProtectedRoute>
          </Route>
          <Route path="/dashboard/financial/transactions">
            <ProtectedRoute>
              <DashboardLayout>
                <TransactionsPage />
              </DashboardLayout>
            </ProtectedRoute>
          </Route>
          <Route path="/dashboard/financial/invoices">
            <ProtectedRoute>
              <DashboardLayout>
                <InvoicesPage />
              </DashboardLayout>
            </ProtectedRoute>
          </Route>

          {/* Payments Route */}
          <Route path="/dashboard/payments">
            <ProtectedRoute>
              <DashboardLayout>
                <PaymentsPage />
              </DashboardLayout>
            </ProtectedRoute>
          </Route>
          
          <Route path="/dashboard/calendar">
            <ProtectedRoute>
              <DashboardLayout>
                <CalendarPage />
              </DashboardLayout>
            </ProtectedRoute>
          </Route>

          <Route path="/dashboard/communications">
            <ProtectedRoute>
              <DashboardLayout>
                <CommunicationsPage />
              </DashboardLayout>
            </ProtectedRoute>
          </Route>

          <Route path="/dashboard/reports">
            <ProtectedRoute>
              <DashboardLayout>
                <ReportsPage />
              </DashboardLayout>
            </ProtectedRoute>
          </Route>

          <Route path="/dashboard/unified-settings">
            <ProtectedRoute>
              <DashboardLayout>
                <UnifiedSettings />
              </DashboardLayout>
            </ProtectedRoute>
          </Route>

          <Route path="/dashboard/items-management">
            <ProtectedRoute>
              <DashboardLayout>
                <ItemsManagement />
              </DashboardLayout>
            </ProtectedRoute>
          </Route>

          {/* Free Lead Forms Route */}
          <Route path="/dashboard/free-lead-forms">
            <ProtectedRoute>
              <DashboardLayout>
                <FreeLeadFormsPage />
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
          <Route path="/privacy-policy" component={PrivacyPolicy} />
          <Route path="/terms-of-service" component={TermsOfService} />
          <Route path="/help-center" component={HelpCenter} />
          <Route path="/" component={Homepage} />

          {/* Public Subscription Landing */}
          <Route path="/subscription" component={SubscriptionLanding} />

          <Route component={NotFound} />
        </Switch>
        
        {/* Floating Chat Button - appears on all protected routes */}
        <FloatingChatButton />
        
      </TooltipProvider>
    </QueryClientProvider>
  );
}