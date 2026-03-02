import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { CalendarDays, Sparkles, Loader2, ChevronLeft, ChevronRight, BookOpen, Bot } from "lucide-react";
import type { ContentPiece, Project, AgentProfile } from "@shared/schema";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";

const statusColors: Record<string, string> = {
  draft: "bg-muted",
  review: "bg-amber-200 dark:bg-amber-900/50",
  approved: "bg-green-200 dark:bg-green-900/50",
  published: "bg-blue-200 dark:bg-blue-900/50",
};

const platformDot: Record<string, string> = {
  instagram: "bg-pink-500",
  linkedin: "bg-blue-600",
};

const statusLabels: Record<string, string> = { draft: "Rascunho", review: "Revisão", approved: "Aprovado", published: "Publicado" };

const objectiveOptions = [
  { value: "crescimento", label: "Crescimento de audiência" },
  { value: "leads", label: "Geração de leads" },
  { value: "vendas", label: "Venda direta" },
  { value: "engajamento", label: "Engajamento e comunidade" },
  { value: "lancamento", label: "Lançamento de produto/serviço" },
  { value: "posicionamento", label: "Posicionamento de marca" },
];

const contentMixOptions = [
  { value: "equilibrado", label: "Equilibrado (educativo + relacional + promocional)" },
  { value: "educativo", label: "Mais educativo — autoridade e valor" },
  { value: "promocional", label: "Mais promocional — conversão e vendas" },
  { value: "relacional", label: "Mais relacional — humanização e conexão" },
];

function buildPeriod(quinzena: "primeira" | "segunda", date: Date): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const monthPadded = String(month).padStart(2, "0");
  const monthName = format(date, "MMMM yyyy", { locale: ptBR });
  if (quinzena === "primeira") return `01/${monthPadded}/${year} a 15/${monthPadded}/${year} (1ª quinzena de ${monthName})`;
  const lastDay = endOfMonth(date).getDate();
  return `16/${monthPadded}/${year} a ${lastDay}/${monthPadded}/${year} (2ª quinzena de ${monthName})`;
}

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [aiOpen, setAiOpen] = useState(false);
  const [generatingCalendar, setGeneratingCalendar] = useState(false);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const { toast } = useToast();

  const [aiForm, setAiForm] = useState({
    projectId: "",
    agentProfileId: "",
    quinzena: "primeira" as "primeira" | "segunda",
    calendarMonth: new Date(),
    platforms: ["instagram", "linkedin"],
    objective: "posicionamento",
    contentMix: "equilibrado",
    postsPerWeek: "3",
    topics: "",
    instructions: "",
  });

  const { data: content = [], isLoading } = useQuery<ContentPiece[]>({ queryKey: ["/api/content"] });
  const { data: projects = [] } = useQuery<Project[]>({ queryKey: ["/api/projects"] });
  const { data: agentProfiles = [] } = useQuery<AgentProfile[]>({ queryKey: ["/api/agent-profiles"] });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getContentForDay = (day: Date) => {
    return content.filter(c => c.scheduledDate && isSameDay(parseISO(c.scheduledDate), day));
  };

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const handleGenerateCalendar = async () => {
    if (!aiForm.projectId) { toast({ title: "Selecione um projeto", variant: "destructive" }); return; }
    setGeneratingCalendar(true);
    try {
      const project = projects.find(p => p.id === Number(aiForm.projectId));
      const period = buildPeriod(aiForm.quinzena, aiForm.calendarMonth);

      const selectedAgent = (aiForm.agentProfileId && aiForm.agentProfileId !== "none")
        ? agentProfiles.find(a => a.id === Number(aiForm.agentProfileId))
        : undefined;

      const res = await fetch("/api/ai/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: Number(aiForm.projectId),
          projectContext: `
            Nome: ${project?.name}.
            Cliente: ${project?.clientName || ""}.
            Descrição: ${project?.description || ""}.
            Nicho: ${(project?.niche as string[])?.join(", ") || ""}.
            Tom e instruções: ${project?.instructions || ""}.
            Regras: ${project?.rules || ""}.
            Formatos preferidos: ${(project?.formats as string[])?.join(", ") || ""}.
          `.trim(),
          brandRules: project?.rules || "",
          period,
          platforms: aiForm.platforms,
          objective: objectiveOptions.find(o => o.value === aiForm.objective)?.label || aiForm.objective,
          contentMix: aiForm.contentMix,
          postsPerWeek: aiForm.postsPerWeek,
          topics: aiForm.topics,
          instructions: aiForm.instructions,
          agentProfile: selectedAgent || null,
        }),
      });
      const data = await res.json();

      if (data.posts && Array.isArray(data.posts)) {
        let created = 0;
        for (const post of data.posts) {
          try {
            await apiRequest("POST", "/api/content", {
              projectId: Number(aiForm.projectId),
              title: post.title,
              platform: post.platform || "instagram",
              format: post.format || "post",
              status: "draft",
              scheduledDate: post.date,
              notes: [
                post.objective ? `Objetivo: ${post.objective}` : "",
                post.contentPillar ? `Pilar: ${post.contentPillar}` : "",
                post.hook ? `Gancho: ${post.hook}` : "",
                post.topic ? `Tema: ${post.topic}` : "",
              ].filter(Boolean).join(" | "),
            });
            created++;
          } catch (e) { /* skip */ }
        }
        queryClient.invalidateQueries({ queryKey: ["/api/content"] });
        setAiOpen(false);
        toast({ title: `Calendário gerado!`, description: `${created} posts criados com estratégia de conteúdo.` });
      }
    } catch (e) {
      toast({ title: "Erro ao gerar calendário", variant: "destructive" });
    } finally {
      setGeneratingCalendar(false);
    }
  };

  const dayContent = selectedDay ? getContentForDay(selectedDay) : [];
  const firstDayOfWeek = monthStart.getDay();
  const paddingDays = Array.from({ length: firstDayOfWeek }, (_, i) => i);

  const selectedProject = projects.find(p => p.id === Number(aiForm.projectId));

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Calendário</h1>
          <p className="text-sm text-muted-foreground">Calendário de publicações</p>
        </div>
        <Button size="sm" onClick={() => setAiOpen(true)} data-testid="button-generate-calendar">
          <Sparkles className="w-4 h-4 mr-1" /> Gerar Calendário IA
        </Button>
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        <div className="md:col-span-2">
          <Card>
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold capitalize">
                  {format(currentDate, "MMMM yyyy", { locale: ptBR })}
                </CardTitle>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="w-7 h-7" onClick={prevMonth}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="w-7 h-7" onClick={nextMonth}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="grid grid-cols-7 gap-1 mb-1">
                {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map(d => (
                  <div key={d} className="text-xs text-muted-foreground text-center py-1">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {paddingDays.map(i => <div key={`pad-${i}`} />)}
                {isLoading ? (
                  days.map(day => <Skeleton key={day.toISOString()} className="h-14 rounded-sm" />)
                ) : (
                  days.map(day => {
                    const dayPosts = getContentForDay(day);
                    const isSelected = selectedDay && isSameDay(day, selectedDay);
                    const isToday = isSameDay(day, new Date());
                    return (
                      <div
                        key={day.toISOString()}
                        onClick={() => setSelectedDay(day)}
                        className={`min-h-14 p-1.5 rounded-sm border cursor-pointer transition-colors ${isSelected ? "border-primary bg-primary/5" : "border-border"} ${isToday ? "font-semibold" : ""}`}
                        data-testid={`calendar-day-${format(day, "yyyy-MM-dd")}`}
                      >
                        <p className={`text-xs mb-1 ${isToday ? "text-primary" : "text-muted-foreground"}`}>{format(day, "d")}</p>
                        <div className="space-y-0.5">
                          {dayPosts.slice(0, 3).map(post => (
                            <div key={post.id} className={`flex items-center gap-1 rounded-xs p-0.5 ${statusColors[post.status] || "bg-muted"}`}>
                              <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${platformDot[post.platform] || "bg-muted-foreground"}`} />
                              <p className="text-xs truncate leading-none">{post.title}</p>
                            </div>
                          ))}
                          {dayPosts.length > 3 && (
                            <p className="text-xs text-muted-foreground">+{dayPosts.length - 3}</p>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="flex items-center gap-4 mt-4">
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-muted border" /><span className="text-xs text-muted-foreground">Rascunho</span></div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-amber-200 dark:bg-amber-900/50" /><span className="text-xs text-muted-foreground">Revisão</span></div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-green-200 dark:bg-green-900/50" /><span className="text-xs text-muted-foreground">Aprovado</span></div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-blue-200 dark:bg-blue-900/50" /><span className="text-xs text-muted-foreground">Publicado</span></div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-3">
          {selectedDay ? (
            <>
              <h2 className="text-sm font-medium text-foreground">
                {format(selectedDay, "dd 'de' MMMM", { locale: ptBR })}
              </h2>
              {dayContent.length === 0 ? (
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-xs text-muted-foreground">Nenhum conteúdo neste dia.</p>
                  </CardContent>
                </Card>
              ) : (
                dayContent.map(item => (
                  <Card key={item.id} className="hover-elevate" data-testid={`calendar-item-${item.id}`}>
                    <CardContent className="p-3 space-y-1.5">
                      <div className="flex items-start gap-2">
                        <div className={`w-2 h-2 rounded-full mt-1 shrink-0 ${platformDot[item.platform] || "bg-muted-foreground"}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">{item.title}</p>
                          <p className="text-xs text-muted-foreground">{item.platform === "instagram" ? "Instagram" : "LinkedIn"} · {item.format}</p>
                        </div>
                        <span className={`text-xs px-1.5 py-0.5 rounded-xs ${statusColors[item.status]}`}>{statusLabels[item.status]}</span>
                      </div>
                      {item.notes && <p className="text-xs text-muted-foreground line-clamp-2">{item.notes}</p>}
                      <Button variant="outline" size="sm" className="w-full h-7 text-xs" asChild>
                        <Link href={`/projects/${item.projectId}/content/${item.id}`}>Editar</Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))
              )}
            </>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <CalendarDays className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Clique em um dia para ver os conteúdos.</p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-3">
              <p className="text-xs font-medium text-foreground mb-2">Resumo do mês</p>
              <div className="space-y-1">
                {Object.entries({ draft: "Rascunho", review: "Revisão", approved: "Aprovado", published: "Publicado" }).map(([status, label]) => {
                  const count = content.filter(c => c.status === status && c.scheduledDate && c.scheduledDate.startsWith(format(currentDate, "yyyy-MM"))).length;
                  return (
                    <div key={status} className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{label}</span>
                      <span className="text-xs font-medium text-foreground">{count}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={aiOpen} onOpenChange={setAiOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gerar Calendário Quinzenal com IA</DialogTitle>
            <DialogDescription>
              A IA vai pensar como uma Social Media Sênior + Copywriter para montar um calendário estratégico.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Agente de Social Media</Label>
              <Select value={aiForm.agentProfileId} onValueChange={(v) => setAiForm(prev => ({ ...prev, agentProfileId: v }))}>
                <SelectTrigger data-testid="select-calendar-agent">
                  <SelectValue placeholder="Sem agente (padrão)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem agente — usar configuração padrão</SelectItem>
                  {agentProfiles.map(a => (
                    <SelectItem key={a.id} value={String(a.id)}>
                      {a.name}{a.description ? ` — ${a.description}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {aiForm.agentProfileId && aiForm.agentProfileId !== "none" && (() => {
                const agent = agentProfiles.find(a => a.id === Number(aiForm.agentProfileId));
                return agent ? (
                  <div className="flex items-start gap-2 text-xs bg-primary/5 border border-primary/20 rounded-md px-2 py-1.5">
                    <Bot className="w-3 h-3 text-primary shrink-0 mt-0.5" />
                    <div>
                      <span className="font-medium text-primary">{agent.name}</span>
                      {agent.referencePersonas && <span className="text-muted-foreground"> · Ref: {agent.referencePersonas}</span>}
                      {(agent.toneCharacteristics as string[])?.length > 0 && (
                        <p className="text-muted-foreground mt-0.5">{(agent.toneCharacteristics as string[]).slice(0, 3).join(", ")}{(agent.toneCharacteristics as string[]).length > 3 ? "..." : ""}</p>
                      )}
                    </div>
                  </div>
                ) : null;
              })()}
              {agentProfiles.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Nenhum agente cadastrado.{" "}
                  <a href="/agents" className="text-primary underline">Criar agente</a>
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Projeto *</Label>
              <Select value={aiForm.projectId} onValueChange={(v) => setAiForm(prev => ({ ...prev, projectId: v }))}>
                <SelectTrigger data-testid="select-calendar-project">
                  <SelectValue placeholder="Selecione o projeto" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
              {selectedProject && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted rounded-md px-2 py-1.5">
                  <BookOpen className="w-3 h-3 shrink-0" />
                  <span>Base de conhecimento do projeto será carregada automaticamente</span>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Quinzena</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAiForm(prev => ({ ...prev, quinzena: "primeira" }))}
                  className={`px-3 py-2 rounded-md border text-sm transition-colors ${aiForm.quinzena === "primeira" ? "border-primary bg-primary/5 text-primary font-medium" : "border-border text-muted-foreground hover:border-muted-foreground"}`}
                  data-testid="button-quinzena-primeira"
                >
                  1ª quinzena (01–15)
                </button>
                <button
                  type="button"
                  onClick={() => setAiForm(prev => ({ ...prev, quinzena: "segunda" }))}
                  className={`px-3 py-2 rounded-md border text-sm transition-colors ${aiForm.quinzena === "segunda" ? "border-primary bg-primary/5 text-primary font-medium" : "border-border text-muted-foreground hover:border-muted-foreground"}`}
                  data-testid="button-quinzena-segunda"
                >
                  2ª quinzena (16–30)
                </button>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => setAiForm(prev => ({ ...prev, calendarMonth: subMonths(prev.calendarMonth, 1) }))}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm font-medium flex-1 text-center capitalize">
                  {format(aiForm.calendarMonth, "MMMM yyyy", { locale: ptBR })}
                </span>
                <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => setAiForm(prev => ({ ...prev, calendarMonth: addMonths(prev.calendarMonth, 1) }))}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Período selecionado: <span className="font-medium">{buildPeriod(aiForm.quinzena, aiForm.calendarMonth)}</span>
              </p>
            </div>

            <div className="space-y-1.5">
              <Label>Objetivo da quinzena *</Label>
              <Select value={aiForm.objective} onValueChange={(v) => setAiForm(prev => ({ ...prev, objective: v }))}>
                <SelectTrigger data-testid="select-calendar-objective">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {objectiveOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Mix de conteúdo</Label>
              <Select value={aiForm.contentMix} onValueChange={(v) => setAiForm(prev => ({ ...prev, contentMix: v }))}>
                <SelectTrigger data-testid="select-calendar-mix">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {contentMixOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Como distribuir educativo, relacional e promocional</p>
            </div>

            <div className="space-y-1.5">
              <Label>Posts por semana (por plataforma)</Label>
              <Select value={aiForm.postsPerWeek} onValueChange={(v) => setAiForm(prev => ({ ...prev, postsPerWeek: v }))}>
                <SelectTrigger data-testid="select-calendar-frequency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2 posts/semana</SelectItem>
                  <SelectItem value="3">3 posts/semana</SelectItem>
                  <SelectItem value="4">4 posts/semana</SelectItem>
                  <SelectItem value="5">5 posts/semana</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Temas / Tópicos específicos</Label>
              <Textarea
                placeholder="Ex: lançamento do novo serviço, depoimentos de clientes, dicas do setor..."
                rows={2}
                className="resize-none"
                value={aiForm.topics}
                onChange={(e) => setAiForm(prev => ({ ...prev, topics: e.target.value }))}
                data-testid="input-calendar-topics"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Instruções adicionais</Label>
              <Textarea
                placeholder="Ex: evitar posts promocionais na primeira semana, incluir datas comemorativas, usar mais stories..."
                rows={2}
                className="resize-none"
                value={aiForm.instructions}
                onChange={(e) => setAiForm(prev => ({ ...prev, instructions: e.target.value }))}
                data-testid="input-calendar-instructions"
              />
            </div>

            <div className="bg-muted/50 border border-border rounded-md p-3 space-y-1">
              <p className="text-xs font-medium text-foreground">Como a IA vai pensar:</p>
              <ul className="text-xs text-muted-foreground space-y-0.5">
                <li>· Aplica funil de consciência (topo → meio → fundo)</li>
                <li>· Varia formatos estrategicamente por dia da semana</li>
                <li>· Usa ganchos de copywriting para cada título</li>
                <li>· Adapta tom por plataforma (Instagram vs LinkedIn)</li>
                <li>· Usa a base de conhecimento do projeto automaticamente</li>
              </ul>
            </div>

            <div className="flex gap-2 justify-end pt-1">
              <Button variant="outline" size="sm" onClick={() => setAiOpen(false)}>Cancelar</Button>
              <Button size="sm" onClick={handleGenerateCalendar} disabled={generatingCalendar || !aiForm.projectId} data-testid="button-confirm-generate-calendar">
                {generatingCalendar
                  ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Gerando estratégia...</>
                  : <><Sparkles className="w-4 h-4 mr-1" /> Gerar Calendário</>
                }
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
