import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useParams, useLocation } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, ArrowLeft, Trash2, Edit, Settings } from "lucide-react";
import { useForm } from "react-hook-form";
import { type Project, type ContentPiece } from "@shared/schema";

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  review: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  approved: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  published: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
};
const statusLabels: Record<string, string> = { draft: "Rascunho", review: "Revisão", approved: "Aprovado", published: "Publicado" };
const formatLabels: Record<string, string> = { post: "Post", story: "Story", carrossel: "Carrossel", reels: "Reels" };

function getBrandColors(raw: any): { dominant: string; secondary: string; accent: string } | null {
  if (!raw) return null;
  if (Array.isArray(raw) && raw.length >= 3) return { dominant: raw[0], secondary: raw[1], accent: raw[2] };
  if (raw.dominant) return raw as { dominant: string; secondary: string; accent: string };
  return null;
}

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const [newContentOpen, setNewContentOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { toast } = useToast();

  const { data: project, isLoading: loadingProject } = useQuery<Project>({ queryKey: ["/api/projects", id] });
  const { data: content = [], isLoading: loadingContent } = useQuery<ContentPiece[]>({
    queryKey: ["/api/content", id],
    queryFn: async () => {
      const res = await fetch(`/api/content?projectId=${id}`, { credentials: "include" });
      return res.json();
    },
  });

  const contentForm = useForm({
    defaultValues: { projectId: Number(id), title: "", platform: "instagram", format: "post", status: "draft", notes: "", scheduledDate: "" },
  });

  const projectForm = useForm({
    defaultValues: {
      name: "", description: "", clientName: "", rules: "", instructions: "",
      brandColorDominant: "#6B46C1", brandColorSecondary: "#9F7AEA", brandColorAccent: "#E9D8FD",
    },
  });

  const createContentMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/content", data),
    onSuccess: async (res) => {
      const newContent: ContentPiece = await res.json();
      queryClient.invalidateQueries({ queryKey: ["/api/content"] });
      setNewContentOpen(false);
      contentForm.reset({ projectId: Number(id), title: "", platform: "instagram", format: "post", status: "draft" });
      navigate(`/projects/${id}/content/${newContent.id}`);
    },
    onError: () => toast({ title: "Erro ao criar conteúdo", variant: "destructive" }),
  });

  const deleteContentMutation = useMutation({
    mutationFn: (contentId: number) => apiRequest("DELETE", `/api/content/${contentId}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/content"] }); toast({ title: "Conteúdo removido" }); },
  });

  const updateProjectMutation = useMutation({
    mutationFn: (data: any) => {
      const { brandColorDominant, brandColorSecondary, brandColorAccent, ...rest } = data;
      return apiRequest("PATCH", `/api/projects/${id}`, {
        ...rest,
        brandColors: { dominant: brandColorDominant, secondary: brandColorSecondary, accent: brandColorAccent },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", id] });
      setSettingsOpen(false);
      toast({ title: "Projeto atualizado!" });
    },
  });

  const openSettings = () => {
    if (!project) return;
    const palette = getBrandColors(project.brandColors);
    projectForm.reset({
      name: project.name,
      description: project.description || "",
      clientName: project.clientName || "",
      rules: project.rules || "",
      instructions: project.instructions || "",
      brandColorDominant: palette?.dominant || "#6B46C1",
      brandColorSecondary: palette?.secondary || "#9F7AEA",
      brandColorAccent: palette?.accent || "#E9D8FD",
    });
    setSettingsOpen(true);
  };

  if (loadingProject) return (
    <div className="p-6 max-w-4xl mx-auto space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-64" />
      <div className="grid md:grid-cols-3 gap-3 mt-6">
        {[1,2,3].map(i => <Skeleton key={i} className="h-32 rounded-md" />)}
      </div>
    </div>
  );

  if (!project) return (
    <div className="p-6"><p className="text-muted-foreground">Projeto não encontrado.</p></div>
  );

  const grouped = {
    draft: content.filter(c => c.status === "draft"),
    review: content.filter(c => c.status === "review"),
    approved: content.filter(c => c.status === "approved"),
    published: content.filter(c => c.status === "published"),
  };

  const palette = getBrandColors(project.brandColors);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild className="w-8 h-8">
          <Link href="/projects"><ArrowLeft className="w-4 h-4" /></Link>
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-foreground">{project.name}</h1>
            {palette && (
              <div className="flex items-center gap-1 ml-1" title="Paleta de cores do cliente">
                <span
                  className="w-4 h-4 rounded-sm border border-border shadow-sm"
                  style={{ backgroundColor: palette.dominant }}
                  title={`Dominante 60%: ${palette.dominant}`}
                />
                <span
                  className="w-3 h-3 rounded-sm border border-border shadow-sm"
                  style={{ backgroundColor: palette.secondary }}
                  title={`Secundária 30%: ${palette.secondary}`}
                />
                <span
                  className="w-2 h-2 rounded-sm border border-border shadow-sm"
                  style={{ backgroundColor: palette.accent }}
                  title={`Destaque 10%: ${palette.accent}`}
                />
              </div>
            )}
          </div>
          {project.clientName && <p className="text-sm text-muted-foreground">{project.clientName}</p>}
        </div>
        <Button variant="outline" size="sm" onClick={openSettings} data-testid="button-project-settings">
          <Settings className="w-4 h-4 mr-1" /> Configurações
        </Button>
        <Button size="sm" onClick={() => setNewContentOpen(true)} data-testid="button-new-content">
          <Plus className="w-4 h-4 mr-1" /> Novo Conteúdo
        </Button>
      </div>

      {project.instructions && (
        <Card>
          <CardContent className="p-3 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Instruções: </span>{project.instructions}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Object.entries(grouped).map(([status, items]) => (
          <Card key={status}>
            <CardContent className="p-3">
              <p className="text-xs font-medium text-muted-foreground mb-1">{statusLabels[status]}</p>
              <p className="text-2xl font-bold text-foreground">{items.length}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-4 gap-4 items-start">
        {Object.entries(grouped).map(([status, items]) => (
          <div key={status} className="space-y-2">
            <div className="flex items-center gap-2 pb-1 border-b border-border">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-sm ${statusColors[status]}`}>
                {statusLabels[status]}
              </span>
              <span className="text-xs text-muted-foreground ml-auto">{items.length}</span>
            </div>
            {loadingContent ? (
              <Skeleton className="h-20 rounded-md" />
            ) : items.length === 0 ? (
              <div className="border border-dashed border-border rounded-md p-4 text-center">
                <p className="text-xs text-muted-foreground">Nenhum item</p>
              </div>
            ) : (
              items.map((item) => (
                <div key={item.id} className="group border border-card-border bg-card rounded-md p-3 space-y-2 hover-elevate cursor-pointer" data-testid={`content-item-${item.id}`}>
                  <Link href={`/projects/${id}/content/${item.id}`}>
                    <div>
                      {item.imageUrl && (
                        <div className="rounded-sm overflow-hidden mb-2">
                          <img src={item.imageUrl} alt={item.title} className="w-full h-20 object-cover" />
                        </div>
                      )}
                      <p className="text-xs font-medium text-foreground line-clamp-2">{item.title}</p>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <span className="text-xs text-muted-foreground">{item.platform === "instagram" ? "IG" : "LI"}</span>
                        <span className="text-muted-foreground text-xs">·</span>
                        <span className="text-xs text-muted-foreground">{formatLabels[item.format] || item.format}</span>
                        {item.scheduledDate && (
                          <>
                            <span className="text-muted-foreground text-xs">·</span>
                            <span className="text-xs text-muted-foreground">{item.scheduledDate}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </Link>
                  <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="w-6 h-6" onClick={() => deleteContentMutation.mutate(item.id)}>
                      <Trash2 className="w-3 h-3 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        ))}
      </div>

      <Dialog open={newContentOpen} onOpenChange={setNewContentOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Novo Conteúdo</DialogTitle></DialogHeader>
          <form onSubmit={contentForm.handleSubmit((d) => createContentMutation.mutate(d))} className="space-y-3">
            <div className="space-y-1">
              <Label>Título *</Label>
              <Input placeholder="Ex: Post sobre lançamento de produto" data-testid="input-content-title" {...contentForm.register("title", { required: true })} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>Plataforma</Label>
                <Select value={contentForm.watch("platform")} onValueChange={(v) => contentForm.setValue("platform", v)}>
                  <SelectTrigger data-testid="select-platform"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="linkedin">LinkedIn</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Formato</Label>
                <Select value={contentForm.watch("format")} onValueChange={(v) => contentForm.setValue("format", v)}>
                  <SelectTrigger data-testid="select-format"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="post">Post</SelectItem>
                    <SelectItem value="story">Story</SelectItem>
                    <SelectItem value="carrossel">Carrossel</SelectItem>
                    <SelectItem value="reels">Reels</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label>Data de Publicação</Label>
              <Input type="date" data-testid="input-scheduled-date" {...contentForm.register("scheduledDate")} />
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" size="sm" onClick={() => setNewContentOpen(false)}>Cancelar</Button>
              <Button type="submit" size="sm" disabled={createContentMutation.isPending} data-testid="button-submit-content">
                {createContentMutation.isPending ? "Criando..." : "Criar e Editar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Configurações do Cliente</DialogTitle></DialogHeader>
          <form onSubmit={projectForm.handleSubmit((d) => updateProjectMutation.mutate(d))} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Nome do Projeto</Label>
                <Input data-testid="input-edit-project-name" {...projectForm.register("name")} />
              </div>
              <div className="space-y-1">
                <Label>Nome do Cliente</Label>
                <Input data-testid="input-edit-client-name" {...projectForm.register("clientName")} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Descrição</Label>
              <Textarea rows={2} {...projectForm.register("description")} />
            </div>

            <div className="space-y-2 p-3 rounded-md border border-border bg-muted/30">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Paleta de Cores</Label>
                <span className="text-xs text-muted-foreground">Regra 60 · 30 · 10</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      className="w-8 h-8 rounded cursor-pointer border border-border"
                      data-testid="color-dominant"
                      {...projectForm.register("brandColorDominant")}
                    />
                    <div>
                      <p className="text-xs font-medium text-foreground">Dominante</p>
                      <p className="text-xs text-muted-foreground">60% · Base</p>
                    </div>
                  </div>
                  <Input
                    className="h-7 text-xs font-mono"
                    placeholder="#000000"
                    {...projectForm.register("brandColorDominant")}
                  />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      className="w-8 h-8 rounded cursor-pointer border border-border"
                      data-testid="color-secondary"
                      {...projectForm.register("brandColorSecondary")}
                    />
                    <div>
                      <p className="text-xs font-medium text-foreground">Secundária</p>
                      <p className="text-xs text-muted-foreground">30% · Contraste</p>
                    </div>
                  </div>
                  <Input
                    className="h-7 text-xs font-mono"
                    placeholder="#000000"
                    {...projectForm.register("brandColorSecondary")}
                  />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      className="w-8 h-8 rounded cursor-pointer border border-border"
                      data-testid="color-accent"
                      {...projectForm.register("brandColorAccent")}
                    />
                    <div>
                      <p className="text-xs font-medium text-foreground">Destaque</p>
                      <p className="text-xs text-muted-foreground">10% · Acento</p>
                    </div>
                  </div>
                  <Input
                    className="h-7 text-xs font-mono"
                    placeholder="#000000"
                    {...projectForm.register("brandColorAccent")}
                  />
                </div>
              </div>
              {projectForm.watch("brandColorDominant") && (
                <div className="flex rounded-md overflow-hidden h-5 mt-1">
                  <div className="w-[60%]" style={{ backgroundColor: projectForm.watch("brandColorDominant") }} title="60% Dominante" />
                  <div className="w-[30%]" style={{ backgroundColor: projectForm.watch("brandColorSecondary") }} title="30% Secundária" />
                  <div className="w-[10%]" style={{ backgroundColor: projectForm.watch("brandColorAccent") }} title="10% Destaque" />
                </div>
              )}
            </div>

            <div className="space-y-1">
              <Label>Regras de Conteúdo</Label>
              <Textarea placeholder="O que NÃO fazer, restrições..." rows={2} {...projectForm.register("rules")} />
            </div>
            <div className="space-y-1">
              <Label>Instruções de Tom e Voz</Label>
              <Textarea placeholder="Tom de comunicação, público-alvo..." rows={2} {...projectForm.register("instructions")} />
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" size="sm" onClick={() => setSettingsOpen(false)}>Cancelar</Button>
              <Button type="submit" size="sm" disabled={updateProjectMutation.isPending}>
                {updateProjectMutation.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
