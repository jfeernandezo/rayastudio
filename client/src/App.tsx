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
import AgentProfiles from "@/pages/agent-profiles";

function AppLayout() {
  const [location] = useLocation();
  const style = {
    "--sidebar-width": "15rem",
    "--sidebar-width-icon": "3.5rem",
  };

  const topKey = location.split("/")[1] || "root";

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0">

          {/* ── Liquid glass header ── */}
          <header className="flex items-center gap-3 px-4 h-12 shrink-0 glass-strong border-b border-white/60 dark:border-white/10 sticky top-0 z-30">
            <SidebarTrigger
              data-testid="button-sidebar-toggle"
              className="w-8 h-8 rounded-xl text-muted-foreground hover:text-foreground hover:bg-black/[0.05] dark:hover:bg-white/[0.06] transition-all duration-200 flex items-center justify-center shrink-0"
            />
            <div className="flex-1" />
            <div className="flex items-center gap-2">
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-2xl pill-neumorphic dark:bg-white/[0.07] dark:shadow-none dark:border dark:border-white/10 cursor-default"
                title="Raya Studio"
              >
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shrink-0 glow-orange-sm">
                  <span className="text-[9px] font-black text-white leading-none select-none">R</span>
                </div>
                <span className="text-[12px] font-semibold text-foreground hidden sm:block tracking-tight">Raya</span>
              </div>
            </div>
          </header>

          {/* ── Animated page content ── */}
          <main key={topKey} className="flex-1 overflow-auto animate-page-in">
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
              <Route path="/agents" component={AgentProfiles} />
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
