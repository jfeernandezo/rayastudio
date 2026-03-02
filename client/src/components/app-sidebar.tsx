import { useRef, useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, FolderKanban, FileText, BookOpen, Zap, CalendarDays, ImagePlus
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
  { title: "Prompts", url: "/prompts", icon: Zap },
  { title: "Base de Conhecimento", url: "/knowledge", icon: BookOpen },
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
      <SidebarHeader className="px-4 py-3 border-b border-sidebar-border">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fileRef.current?.click()}
            className="w-9 h-9 rounded-md border border-dashed border-sidebar-border flex items-center justify-center overflow-hidden shrink-0 hover:border-primary transition-colors group"
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
              <ImagePlus className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
            )}
          </button>
          <div className="leading-none">
            <p className="text-sm font-bold text-sidebar-foreground tracking-tight">Raya</p>
            <p className="text-[11px] font-light text-muted-foreground tracking-wide">Creative Studio</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = item.url === "/"
                  ? location === "/"
                  : location.startsWith(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, "-")}`}
                    >
                      <Link href={item.url}>
                        <item.icon className="w-4 h-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="px-4 py-3 border-t border-sidebar-border">
        <p className="text-xs text-muted-foreground/50">v1.0 · V3 Nexus</p>
      </SidebarFooter>
    </Sidebar>
  );
}
