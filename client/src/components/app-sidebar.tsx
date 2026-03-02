import { useRef, useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import {
  LayoutDashboard, Briefcase, CalendarDays, LayoutTemplate,
  BrainCircuit, Lightbulb, Library, Settings2, Sparkles, LogOut, User
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarMenu, SidebarMenuItem, SidebarHeader, SidebarFooter
} from "@/components/ui/sidebar";

const navItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Projetos", url: "/projects", icon: Briefcase },
  { title: "Calendário", url: "/calendar", icon: CalendarDays },
  { title: "Templates", url: "/templates", icon: LayoutTemplate },
  { title: "Agentes", url: "/agents", icon: BrainCircuit },
  { title: "Prompts", url: "/prompts", icon: Lightbulb },
  { title: "Base de Conhecimento", url: "/knowledge", icon: Library },
];

const bottomItems = [
  { title: "Configurações", url: "/settings", icon: Settings2 },
];

export function AppSidebar({ username }: { username: string }) {
  const [location, navigate] = useLocation();
  const [logo, setLogo] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem("raya-studio-logo");
    if (saved) setLogo(saved);
  }, []);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setLogo(dataUrl);
      localStorage.setItem("raya-studio-logo", dataUrl);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    },
    onSuccess: () => {
      queryClient.clear();
      navigate("/login");
    },
  });

  const isActive = (url: string) =>
    url === "/" ? location === "/" : location.startsWith(url);

  return (
    <Sidebar className="border-r border-sidebar-border bg-white dark:bg-sidebar">
      <SidebarHeader className="px-4 pt-5 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => fileRef.current?.click()}
            className="w-9 h-9 rounded-2xl flex items-center justify-center overflow-hidden shrink-0 transition-all group
              bg-gradient-to-br from-orange-400 to-orange-600
              shadow-[0_2px_8px_rgba(249,115,22,0.35),0_0_0_1px_rgba(249,115,22,0.15),inset_0_1px_0_rgba(255,255,255,0.3)]
              hover:shadow-[0_4px_14px_rgba(249,115,22,0.45),0_0_0_1px_rgba(249,115,22,0.2),inset_0_1px_0_rgba(255,255,255,0.3)]"
            title="Clique para adicionar a logo"
            data-testid="button-upload-logo"
          >
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
            {logo ? (
              <img src={logo} alt="Logo" className="w-full h-full object-contain" />
            ) : (
              <Sparkles className="w-4 h-4 text-white drop-shadow-sm" />
            )}
          </button>
          <div className="leading-tight">
            <p className="text-[13.5px] font-bold text-foreground tracking-tight">Raya Studio</p>
            <p className="text-[10.5px] text-muted-foreground leading-none mt-0.5">Creative AI Platform</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 py-1">
        <SidebarGroup className="p-0">
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {navItems.map((item) => {
                const active = isActive(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <Link href={item.url}>
                      <div
                        className={`flex items-center gap-2.5 px-3 h-9 rounded-xl cursor-pointer select-none
                          transition-all duration-200 ease-out group
                          ${active
                            ? "sidebar-active-card text-foreground font-semibold"
                            : "text-muted-foreground hover:text-foreground hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
                          }`}
                        data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, "-")}`}
                      >
                        <item.icon
                          className={`w-4 h-4 shrink-0 transition-colors duration-200
                            ${active ? "text-primary" : "group-hover:text-foreground"}`}
                        />
                        <span className="text-[13px] leading-none flex-1">{item.title}</span>
                        {active && (
                          <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 animate-pulse" />
                        )}
                      </div>
                    </Link>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="px-3 py-3">
        <div className="w-full h-px bg-border/70 mb-2" />
        <SidebarMenu className="gap-0.5">
          {bottomItems.map((item) => {
            const active = isActive(item.url);
            return (
              <SidebarMenuItem key={item.title}>
                <Link href={item.url}>
                  <div
                    className={`flex items-center gap-2.5 px-3 h-9 rounded-xl cursor-pointer select-none
                      transition-all duration-200 ease-out group
                      ${active
                        ? "sidebar-active-card text-foreground font-semibold"
                        : "text-muted-foreground hover:text-foreground hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
                      }`}
                    data-testid={`nav-${item.title.toLowerCase()}`}
                  >
                    <item.icon className={`w-4 h-4 shrink-0 ${active ? "text-primary" : "group-hover:text-foreground"}`} />
                    <span className="text-[13px] leading-none flex-1">{item.title}</span>
                    {active && <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
                  </div>
                </Link>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>

        {/* User info + logout */}
        <div className="mt-2 pt-2 border-t border-border/50">
          <div className="flex items-center gap-2 px-2">
            <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center shrink-0">
              <User className="w-3 h-3 text-muted-foreground" />
            </div>
            <span className="text-[12px] text-muted-foreground flex-1 truncate">{username}</span>
            <button
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-black/[0.05] dark:hover:bg-white/[0.05] transition-all"
              title="Sair"
              data-testid="button-logout"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="px-2 pt-2">
          <p className="text-[10px] text-muted-foreground/35">v1.0 · Raya Studio</p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
