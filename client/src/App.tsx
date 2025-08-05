import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";

import Landing from "@/pages/Landing";
import Home from "@/pages/Home";

import DashboardLayout from "@/components/layout/dashboard-layout";
import Dashboard from "@/pages/dashboard/dashboard";
import Clients from "@/pages/dashboard/clients";
import ClientDetails from "@/pages/dashboard/client-details";
import Projects from "@/pages/dashboard/projects";
import NewProject from "@/pages/dashboard/projects/NewProject";
import ProjectDetails from "@/pages/dashboard/ProjectDetails";
import Tasks from "@/pages/dashboard/tasks";
import Assets from "@/pages/dashboard/assets";
import Team from "@/pages/dashboard/team";
import Profile from "@/pages/dashboard/profile";
import Settings from "@/pages/dashboard/settings";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/dashboard">
            <DashboardLayout>
              <Dashboard />
            </DashboardLayout>
          </Route>
          <Route path="/dashboard/clients">
            <DashboardLayout>
              <Clients />
            </DashboardLayout>
          </Route>
          <Route path="/dashboard/clients/:id">
            <DashboardLayout>
              <ClientDetails />
            </DashboardLayout>
          </Route>
          <Route path="/dashboard/projects" component={() => (
            <DashboardLayout>
              <Projects />
            </DashboardLayout>
          )} />
          <Route path="/dashboard/projects/new" component={() => (
            <DashboardLayout>
              <NewProject />
            </DashboardLayout>
          )} />
          <Route path="/dashboard/project-details/:projectId" component={() => (
            <DashboardLayout>
              <ProjectDetails />
            </DashboardLayout>
          )} />
          <Route path="/dashboard/projects/:projectId" component={() => (
            <DashboardLayout>
              <ProjectDetails />
            </DashboardLayout>
          )} />
          <Route path="/dashboard/tasks">
            <DashboardLayout>
              <Tasks />
            </DashboardLayout>
          </Route>
          <Route path="/dashboard/assets">
            <DashboardLayout>
              <Assets />
            </DashboardLayout>
          </Route>
          <Route path="/dashboard/team">
            <DashboardLayout>
              <Team />
            </DashboardLayout>
          </Route>
          <Route path="/dashboard/profile">
            <DashboardLayout>
              <Profile />
            </DashboardLayout>
          </Route>
          <Route path="/dashboard/settings">
            <DashboardLayout>
              <Settings />
            </DashboardLayout>
          </Route>
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