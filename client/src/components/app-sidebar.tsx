import { useRef, useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, FolderKanban, FileText, BookOpen, Zap, CalendarDays, ImagePlus, Settings2, Bot
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarMenu, SidebarMenuItem, SidebarHeader, SidebarFooter
} from "@/components/ui/sidebar";

const navItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Projetos", url: "/projects", icon: FolderKanban },
  { title: "Calendário", url: "/calendar", icon: CalendarDays },
  { title: "Templates", url: "/templates", icon: FileText },
  { title: "Agentes", url: "/agents", icon: Bot },
  { title: "Prompts", url: "/prompts", icon: Zap },
  { title: "Base de Conhecimento", url: "/knowledge", icon: BookOpen },
];

const bottomItems = [
  { title: "Configurações", url: "/settings", icon: Settings2 },
];

export function AppSidebar() {
  const [location] = useLocation();
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

  const isActive = (url: string) =>
    url === "/" ? location === "/" : location.startsWith(url);

  return (
    <Sidebar className="border-r border-sidebar-border bg-white dark:bg-sidebar">
      <SidebarHeader className="px-4 pt-5 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => fileRef.current?.click()}
            className="w-9 h-9 rounded-2xl border border-orange-200 dark:border-orange-900/50 flex items-center justify-center overflow-hidden shrink-0 hover:border-primary/60 transition-all group bg-orange-50 dark:bg-orange-950/30"
            title="Clique para adicionar a logo"
            data-testid="button-upload-logo"
          >
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleLogoUpload}
            />
            {logo ? (
              <img src={logo} alt="Logo" className="w-full h-full object-contain" />
            ) : (
              <div className="flex items-center justify-center w-full h-full">
                <ImagePlus className="w-3.5 h-3.5 text-primary group-hover:scale-110 transition-transform" />
              </div>
            )}
          </button>
          <div className="leading-tight">
            <p className="text-sm font-bold text-foreground tracking-tight">Raya Studio</p>
            <p className="text-[10.5px] text-muted-foreground">Creative AI Platform</p>
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
                        className={`flex items-center gap-3 px-3 h-9 rounded-xl cursor-pointer transition-all duration-150 select-none
                          ${active
                            ? "bg-primary text-white font-medium sidebar-active-glow"
                            : "text-muted-foreground hover:text-foreground hover:bg-orange-50/80 dark:hover:bg-orange-950/20"
                          }`}
                        data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, "-")}`}
                      >
                        <item.icon className={`w-4 h-4 shrink-0 ${active ? "text-white" : ""}`} />
                        <span className="text-[13px] leading-none">{item.title}</span>
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
        <div className="w-full h-px bg-border/60 mb-2" />
        <SidebarMenu className="gap-0.5">
          {bottomItems.map((item) => {
            const active = isActive(item.url);
            return (
              <SidebarMenuItem key={item.title}>
                <Link href={item.url}>
                  <div
                    className={`flex items-center gap-3 px-3 h-9 rounded-xl cursor-pointer transition-all duration-150 select-none
                      ${active
                        ? "bg-primary text-white font-medium sidebar-active-glow"
                        : "text-muted-foreground hover:text-foreground hover:bg-orange-50/80 dark:hover:bg-orange-950/20"
                      }`}
                    data-testid={`nav-${item.title.toLowerCase()}`}
                  >
                    <item.icon className={`w-4 h-4 shrink-0 ${active ? "text-white" : ""}`} />
                    <span className="text-[13px] leading-none">{item.title}</span>
                  </div>
                </Link>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
        <div className="px-2 pt-2">
          <p className="text-[10px] text-muted-foreground/40">v1.0 · Raya Studio</p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
