import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FolderKanban, FileText, BookOpen, Zap, Plus, ArrowRight,
  Image, Clock, CheckCircle2, AlertCircle, Sparkles
} from "lucide-react";
import type { Project, ContentPiece } from "@shared/schema";

const statusColors: Record<string, string> = {
  draft: "bg-slate-100 text-slate-600 dark:bg-slate-800/50 dark:text-slate-400",
  review: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  approved: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  scheduled: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  published: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
};

const statusLabels: Record<string, string> = {
  draft: "À Fazer",
  review: "Em Revisão",
  approved: "Aprovado",
  scheduled: "Agendado",
  published: "Publicado",
};

const platformLabels: Record<string, string> = {
  instagram: "Instagram",
  linkedin: "LinkedIn",
};

export default function Dashboard() {
  const { data: projects = [], isLoading: loadingProjects } = useQuery<Project[]>({ queryKey: ["/api/projects"] });
  const { data: content = [], isLoading: loadingContent } = useQuery<ContentPiece[]>({ queryKey: ["/api/content"] });

  const revisionsNeeded = content.filter(c => c.status === "review" && (c as any).approvalComment);
  const draftCount = content.filter(c => c.status === "draft").length;
  const reviewCount = content.filter(c => c.status === "review").length;
  const approvedCount = content.filter(c => c.status === "approved").length;
  const firstProject = projects[0];
  const totalOperational = Math.max(content.length, 1);

  const stats = [
    { label: "Projetos", value: projects.length, icon: FolderKanban, color: "text-primary", hint: "marcas ativas" },
    { label: "Conteúdos", value: content.length, icon: FileText, color: "text-blue-500", hint: "na base" },
    { label: "Em Revisão", value: reviewCount, icon: Clock, color: "text-amber-500", hint: "aguardando cliente" },
    { label: "Aprovados", value: approvedCount, icon: CheckCircle2, color: "text-green-500", hint: "prontos" },
  ];

  const recentContent = content.slice(0, 6);

  return (
    <div className="page-shell space-y-6">
      <div className="page-heading">
        <div>
          <p className="text-xs font-semibold uppercase text-primary">Cockpit</p>
          <h1 className="page-title">Produção de conteúdo</h1>
          <p className="page-subtitle">Prioridades, gargalos e próximos movimentos da operação.</p>
        </div>
        <Button asChild size="sm" className="h-9" data-testid="button-new-project">
          <Link href="/projects">
            <Plus className="w-4 h-4 mr-1" />
            Novo Projeto
          </Link>
        </Button>
      </div>

      <div className="app-surface rounded-2xl p-4 md:p-5">
        <div className="grid md:grid-cols-[1.2fr_0.8fr] gap-5 items-stretch">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-sm">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold">Próxima melhor ação</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {revisionsNeeded.length > 0
                    ? "Responder às revisões do cliente antes de criar novas peças."
                    : draftCount > 0
                    ? "Levar rascunhos para revisão usando a esteira de aprovação."
                    : firstProject
                    ? "Criar o próximo conteúdo estruturado para manter a cadência."
                    : "Criar o primeiro projeto e preencher o perfil da marca."}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {revisionsNeeded[0] ? (
                <Button asChild size="sm">
                  <Link href={`/projects/${revisionsNeeded[0].projectId}/content/${revisionsNeeded[0].id}`}>
                    Abrir revisão <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Link>
                </Button>
              ) : firstProject ? (
                <Button asChild size="sm">
                  <Link href={`/projects/${firstProject.id}/content/new`}>
                    Criar conteúdo <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Link>
                </Button>
              ) : (
                <Button asChild size="sm"><Link href="/projects">Criar projeto</Link></Button>
              )}
              <Button asChild size="sm" variant="outline">
                <Link href="/calendar"><Clock className="w-3.5 h-3.5 mr-1" /> Ver calendário</Link>
              </Button>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase">Saúde da esteira</p>
              <span className="text-xs text-muted-foreground">{content.length} peças</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden bg-muted flex">
              <span className="bg-slate-400" style={{ width: `${(draftCount / totalOperational) * 100}%` }} />
              <span className="bg-amber-400" style={{ width: `${(reviewCount / totalOperational) * 100}%` }} />
              <span className="bg-green-500" style={{ width: `${(approvedCount / totalOperational) * 100}%` }} />
            </div>
            <div className="grid grid-cols-3 gap-2 mt-3 text-center">
              <div><p className="text-lg font-bold">{draftCount}</p><p className="text-[11px] text-muted-foreground">A fazer</p></div>
              <div><p className="text-lg font-bold">{reviewCount}</p><p className="text-[11px] text-muted-foreground">Revisão</p></div>
              <div><p className="text-lg font-bold">{approvedCount}</p><p className="text-[11px] text-muted-foreground">Aprovado</p></div>
            </div>
          </div>
        </div>
      </div>

      {revisionsNeeded.length > 0 && (
        <div className="rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/15 p-4 space-y-2 animate-slide-up" data-testid="revision-alerts">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
              {revisionsNeeded.length} alteração{revisionsNeeded.length > 1 ? "ões solicitadas" : " solicitada"} pelo cliente
            </p>
          </div>
          <div className="space-y-1">
            {revisionsNeeded.slice(0, 3).map(item => (
              <Link key={item.id} href={`/projects/${item.projectId}/content/${item.id}`}>
                <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400 hover:underline cursor-pointer">
                  <span className="font-medium">{item.title}</span>
                  <span className="text-amber-500 truncate">- {(item as any).approvalComment?.slice(0, 60)}...</span>
                </div>
              </Link>
            ))}
            {revisionsNeeded.length > 3 && <p className="text-xs text-amber-600">+{revisionsNeeded.length - 3} mais</p>}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((stat) => (
          <div key={stat.label} className="metric-tile" data-testid={`stat-${stat.label.toLowerCase()}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  {loadingProjects || loadingContent ? <Skeleton className="h-7 w-10 mb-1" /> : <p className="text-2xl font-bold text-foreground">{stat.value}</p>}
                  <p className="text-xs font-medium text-foreground">{stat.label}</p>
                  <p className="text-[11px] text-muted-foreground">{stat.hint}</p>
                </div>
                <div className={`${stat.color} w-10 h-10 rounded-xl bg-muted flex items-center justify-center`}>
                  <stat.icon className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Projetos Ativos</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/projects">Ver todos <ArrowRight className="w-3 h-3 ml-1" /></Link>
            </Button>
          </div>
          {loadingProjects ? (
            <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}</div>
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
                  <div className="interactive-row flex items-center gap-3 p-3 cursor-pointer" data-testid={`project-card-${project.id}`}>
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <FolderKanban className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{project.name}</p>
                      {project.clientName && <p className="text-xs text-muted-foreground truncate">{project.clientName}</p>}
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
              <Link href="/calendar">Calendário <ArrowRight className="w-3 h-3 ml-1" /></Link>
            </Button>
          </div>
          {loadingContent ? (
            <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}</div>
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
                <div key={item.id} className="interactive-row flex items-center gap-3 p-3" data-testid={`content-card-${item.id}`}>
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    {item.imageUrl ? <img src={item.imageUrl} alt="" className="w-8 h-8 rounded-lg object-cover" /> : <Image className="w-4 h-4 text-muted-foreground" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{platformLabels[item.platform] || item.platform}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[item.status] || "bg-muted text-muted-foreground"}`}>
                    {statusLabels[item.status] || item.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-3">
        {[
          { title: "Templates", desc: "Modelos de conteúdo", href: "/templates", icon: FileText },
          { title: "Prompts", desc: "Prompts pré-configurados", href: "/prompts", icon: Zap },
          { title: "Base de Conhecimento", desc: "Contextos e referências", href: "/knowledge", icon: BookOpen },
        ].map((item) => (
          <Link key={item.href} href={item.href}>
            <div className="interactive-row p-4 flex items-center gap-3" data-testid={`quick-link-${item.title.toLowerCase()}`}>
              <item.icon className="w-5 h-5 text-primary shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">{item.title}</p>
                <p className="text-xs text-muted-foreground truncate">{item.desc}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
