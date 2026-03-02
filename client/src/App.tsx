import { Switch, Route, useLocation } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Bell, AlertCircle, Loader2 } from "lucide-react";
import { Link } from "wouter";
import type { ContentPiece } from "@shared/schema";
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
import LoginPage from "@/pages/login";

function NotificationBell() {
  const { data: content = [] } = useQuery<ContentPiece[]>({ queryKey: ["/api/content"] });
  const revisions = content.filter(c => c.status === "review" && (c as any).approvalComment);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="relative w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-black/[0.05] dark:hover:bg-white/[0.06] transition-all"
          data-testid="button-notifications"
          title="Notificações"
        >
          <Bell className="w-4 h-4" />
          {revisions.length > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-background animate-pulse" />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0 rounded-2xl border-border shadow-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-muted/30">
          <p className="text-sm font-semibold text-foreground">Notificações</p>
        </div>
        {revisions.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <Bell className="w-6 h-6 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">Sem notificações no momento.</p>
          </div>
        ) : (
          <div className="divide-y divide-border max-h-72 overflow-y-auto">
            {revisions.map((item) => (
              <Link key={item.id} href={`/projects/${item.projectId}/content/${item.id}`}>
                <div className="px-4 py-3 hover:bg-muted/50 cursor-pointer transition-colors" data-testid={`notification-item-${item.id}`}>
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{item.title}</p>
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5 line-clamp-2">
                        {(item as any).approvalComment}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

function AppLayout({ username }: { username: string }) {
  const [location] = useLocation();
  const style = {
    "--sidebar-width": "15rem",
    "--sidebar-width-icon": "3.5rem",
  };

  const topKey = location.split("/")[1] || "root";

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full bg-background">
        <AppSidebar username={username} />
        <div className="flex flex-col flex-1 min-w-0">

          {/* ── Liquid glass header ── */}
          <header className="flex items-center gap-3 px-4 h-12 shrink-0 glass-strong border-b border-white/60 dark:border-white/10 sticky top-0 z-30">
            <SidebarTrigger
              data-testid="button-sidebar-toggle"
              className="w-8 h-8 rounded-xl text-muted-foreground hover:text-foreground hover:bg-black/[0.05] dark:hover:bg-white/[0.06] transition-all duration-200 flex items-center justify-center shrink-0"
            />
            <div className="flex-1" />
            <div className="flex items-center gap-2">
              <NotificationBell />
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

function AuthGuard() {
  const [, navigate] = useLocation();

  const { data: user, isLoading } = useQuery<{ id: string; username: string } | null>({
    queryKey: ["/api/me"],
    queryFn: async () => {
      const res = await fetch("/api/me", { credentials: "include" });
      if (res.status === 401) return null;
      if (!res.ok) throw new Error("Erro ao verificar autenticação");
      return res.json();
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/login");
    }
  }, [isLoading, user]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return <AppLayout username={user.username} />;
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

  if (location === "/login") {
    return <LoginPage />;
  }

  return <AuthGuard />;
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
