import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Projects from "@/pages/projects";
import ProjectDetail from "@/pages/project-detail";
import ContentCreator from "@/pages/content-creator";
import Templates from "@/pages/templates";
import KnowledgeBase from "@/pages/knowledge-base";
import Prompts from "@/pages/prompts";
import Calendar from "@/pages/calendar";
import ApprovePage from "@/pages/approve";
import Settings from "@/pages/settings";

function AppLayout() {
  const style = {
    "--sidebar-width": "15rem",
    "--sidebar-width-icon": "3.5rem",
  };
  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <header className="flex items-center gap-2 px-4 py-2 border-b border-border bg-background h-12 shrink-0">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <div className="flex-1" />
            <span className="text-xs text-muted-foreground font-medium">Raya Studio</span>
          </header>
          <main className="flex-1 overflow-auto">
            <Switch>
              <Route path="/" component={Dashboard} />
              <Route path="/projects" component={Projects} />
              <Route path="/projects/:id" component={ProjectDetail} />
              <Route path="/projects/:id/content/:contentId" component={ContentCreator} />
              <Route path="/projects/:id/content/new" component={ContentCreator} />
              <Route path="/templates" component={Templates} />
              <Route path="/knowledge" component={KnowledgeBase} />
              <Route path="/prompts" component={Prompts} />
              <Route path="/calendar" component={Calendar} />
              <Route path="/settings" component={Settings} />
              <Route component={NotFound} />
            </Switch>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function Router() {
  const [location] = useLocation();
  if (location.startsWith("/approve/")) {
    return (
      <Switch>
        <Route path="/approve/:token" component={ApprovePage} />
      </Switch>
    );
  }
  return <AppLayout />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
