import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { CalendarDays, Sparkles, Loader2, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import type { ContentPiece, Project } from "@shared/schema";
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO } from "date-fns";
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

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [aiOpen, setAiOpen] = useState(false);
  const [generatingCalendar, setGeneratingCalendar] = useState(false);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const { toast } = useToast();

  const [aiForm, setAiForm] = useState({ projectId: "", period: "", platforms: ["instagram", "linkedin"], topics: "", instructions: "" });

  const { data: content = [], isLoading } = useQuery<ContentPiece[]>({ queryKey: ["/api/content"] });
  const { data: projects = [] } = useQuery<Project[]>({ queryKey: ["/api/projects"] });

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
      const period = aiForm.period || `${format(currentDate, "MMMM yyyy", { locale: ptBR })}`;

      const res = await fetch("/api/ai/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectContext: `${project?.name}. ${project?.description || ""}. ${project?.instructions || ""}`,
          period,
          platforms: aiForm.platforms,
          formats: ["post", "carrossel", "story", "reels"],
          topics: aiForm.topics,
          instructions: aiForm.instructions,
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
              notes: `Objetivo: ${post.objective || ""}. Tópico: ${post.topic || ""}`,
            });
            created++;
          } catch (e) { /* skip */ }
        }
        queryClient.invalidateQueries({ queryKey: ["/api/content"] });
        setAiOpen(false);
        toast({ title: `Calendário gerado! ${created} posts criados.` });
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
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-muted" /><span className="text-xs text-muted-foreground">Rascunho</span></div>
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Gerar Calendário Quinzenal com IA</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Projeto *</Label>
              <Select value={aiForm.projectId} onValueChange={(v) => setAiForm(prev => ({ ...prev, projectId: v }))}>
                <SelectTrigger data-testid="select-calendar-project"><SelectValue placeholder="Selecione o projeto" /></SelectTrigger>
                <SelectContent>
                  {projects.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Período (quinzena)</Label>
              <Input placeholder="Ex: 01/07 à 15/07" value={aiForm.period} onChange={(e) => setAiForm(prev => ({ ...prev, period: e.target.value }))} data-testid="input-calendar-period" />
              <p className="text-xs text-muted-foreground">Deixe em branco para usar o mês atual</p>
            </div>
            <div className="space-y-1">
              <Label>Tópicos / Temas</Label>
              <Textarea placeholder="Ex: lançamento de produto, dicas do setor, cases de sucesso..." rows={2} className="resize-none" value={aiForm.topics} onChange={(e) => setAiForm(prev => ({ ...prev, topics: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Instruções Adicionais</Label>
              <Textarea placeholder="Ex: focar em engajamento, incluir datas comemorativas..." rows={2} className="resize-none" value={aiForm.instructions} onChange={(e) => setAiForm(prev => ({ ...prev, instructions: e.target.value }))} />
            </div>
            <div className="bg-muted rounded-md p-3">
              <p className="text-xs text-muted-foreground">
                A IA irá criar automaticamente posts para Instagram e LinkedIn, distribuídos ao longo da quinzena, com formatos variados (posts, stories, carrosseis).
              </p>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setAiOpen(false)}>Cancelar</Button>
              <Button size="sm" onClick={handleGenerateCalendar} disabled={generatingCalendar} data-testid="button-confirm-generate-calendar">
                {generatingCalendar ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Gerando...</> : <><Sparkles className="w-4 h-4 mr-1" /> Gerar Calendário</>}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
