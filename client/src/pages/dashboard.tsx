import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FolderKanban, FileText, BookOpen, Zap, Plus, ArrowRight, Image, Clock, CheckCircle2, Pencil } from "lucide-react";
import type { Project, ContentPiece } from "@shared/schema";

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  review: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  approved: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  published: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
};

const statusLabels: Record<string, string> = {
  draft: "Rascunho",
  review: "Em Revisão",
  approved: "Aprovado",
  published: "Publicado",
};

const platformLabels: Record<string, string> = {
  instagram: "Instagram",
  linkedin: "LinkedIn",
};

export default function Dashboard() {
  const { data: projects = [], isLoading: loadingProjects } = useQuery<Project[]>({ queryKey: ["/api/projects"] });
  const { data: content = [], isLoading: loadingContent } = useQuery<ContentPiece[]>({ queryKey: ["/api/content"] });

  const stats = {
    projects: projects.length,
    total: content.length,
    review: content.filter(c => c.status === "review").length,
    approved: content.filter(c => c.status === "approved").length,
    published: content.filter(c => c.status === "published").length,
  };

  const recentContent = content.slice(0, 6);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Visão geral da produção de conteúdo</p>
        </div>
        <Button asChild size="sm" data-testid="button-new-project">
          <Link href="/projects">
            <Plus className="w-4 h-4 mr-1" />
            Novo Projeto
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Projetos", value: stats.projects, icon: FolderKanban, color: "text-primary" },
          { label: "Conteúdos", value: stats.total, icon: FileText, color: "text-blue-500" },
          { label: "Em Revisão", value: stats.review, icon: Clock, color: "text-amber-500" },
          { label: "Aprovados", value: stats.approved, icon: CheckCircle2, color: "text-green-500" },
        ].map((stat) => (
          <Card key={stat.label} data-testid={`stat-${stat.label.toLowerCase()}`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`${stat.color}`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <div>
                  {loadingProjects || loadingContent ? (
                    <Skeleton className="h-6 w-8 mb-1" />
                  ) : (
                    <p className="text-xl font-bold text-foreground">{stat.value}</p>
                  )}
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Projetos Ativos</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/projects">
                Ver todos <ArrowRight className="w-3 h-3 ml-1" />
              </Link>
            </Button>
          </div>
          {loadingProjects ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full rounded-md" />)}
            </div>
          ) : projects.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <FolderKanban className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Nenhum projeto ainda.</p>
                <Button variant="outline" size="sm" className="mt-3" asChild>
                  <Link href="/projects">Criar projeto</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {projects.slice(0, 4).map((project) => (
                <Link key={project.id} href={`/projects/${project.id}`}>
                  <div className="flex items-center gap-3 p-3 rounded-md border border-card-border bg-card hover-elevate cursor-pointer" data-testid={`project-card-${project.id}`}>
                    <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                      <FolderKanban className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{project.name}</p>
                      {project.clientName && (
                        <p className="text-xs text-muted-foreground truncate">{project.clientName}</p>
                      )}
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Conteúdos Recentes</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/calendar">
                Calendário <ArrowRight className="w-3 h-3 ml-1" />
              </Link>
            </Button>
          </div>
          {loadingContent ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full rounded-md" />)}
            </div>
          ) : recentContent.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Nenhum conteúdo criado.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {recentContent.map((item) => (
                <div key={item.id} className="flex items-center gap-3 p-3 rounded-md border border-card-border bg-card" data-testid={`content-card-${item.id}`}>
                  <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center shrink-0">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt="" className="w-8 h-8 rounded-md object-cover" />
                    ) : (
                      <Image className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{platformLabels[item.platform] || item.platform}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-sm font-medium ${statusColors[item.status] || "bg-muted text-muted-foreground"}`}>
                    {statusLabels[item.status] || item.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { title: "Templates", desc: "Modelos de conteúdo", href: "/templates", icon: FileText },
          { title: "Prompts", desc: "Prompts pré-configurados", href: "/prompts", icon: Zap },
          { title: "Base de Conhecimento", desc: "Contextos e referências", href: "/knowledge", icon: BookOpen },
        ].map((item) => (
          <Link key={item.href} href={item.href}>
            <Card className="hover-elevate cursor-pointer" data-testid={`quick-link-${item.title.toLowerCase()}`}>
              <CardContent className="p-4 flex items-center gap-3">
                <item.icon className="w-5 h-5 text-primary shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{item.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{item.desc}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
