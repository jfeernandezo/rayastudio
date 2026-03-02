import { useRef, useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, FolderKanban, FileText, BookOpen, Zap, CalendarDays, ImagePlus, Settings2, Bot
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter
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

  return (
    <Sidebar>
      <SidebarHeader className="px-4 py-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <button
            onClick={() => fileRef.current?.click()}
            className="w-9 h-9 rounded-xl border-2 border-dashed border-sidebar-border flex items-center justify-center overflow-hidden shrink-0 hover:border-primary/50 transition-all group bg-sidebar"
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
              <div className="w-5 h-5 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <ImagePlus className="w-3 h-3 text-primary" />
              </div>
            )}
          </button>
          <div className="leading-none">
            <p className="text-sm font-bold text-sidebar-foreground tracking-tight">Raya</p>
            <p className="text-[11px] font-normal text-muted-foreground">Creative Studio</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-2">
        <SidebarGroup className="p-0">
          <SidebarGroupLabel className="px-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-1">
            Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {navItems.map((item) => {
                const isActive = item.url === "/"
                  ? location === "/"
                  : location.startsWith(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className="h-9 rounded-lg transition-all"
                      data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, "-")}`}
                    >
                      <Link href={item.url}>
                        <item.icon className="w-4 h-4 shrink-0" />
                        <span className="text-sm">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border px-2 py-2">
        <SidebarMenu className="gap-0.5">
          {bottomItems.map((item) => {
            const isActive = location.startsWith(item.url);
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  className="h-9 rounded-lg transition-all"
                  data-testid={`nav-${item.title.toLowerCase()}`}
                >
                  <Link href={item.url}>
                    <item.icon className="w-4 h-4 shrink-0" />
                    <span className="text-sm">{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
        <div className="px-2 pt-2 pb-0.5">
          <p className="text-[10px] text-muted-foreground/40">v1.0 · V3 Nexus</p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
