import { useState, useRef, useEffect } from "react";
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
import { Plus, ArrowLeft, Trash2, Settings, FileText, Copy, Check, Type, Upload, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { type Project, type ContentPiece, type DesignBrief, type ProjectFont } from "@shared/schema";

const FONT_ROLES = [
  { value: "none", label: "Sem papel definido" },
  { value: "h1", label: "H1 — Título principal" },
  { value: "h2", label: "H2 — Subtítulo" },
  { value: "body", label: "Corpo de texto" },
  { value: "assets", label: "Assets / Elementos" },
];

function loadFontFace(font: ProjectFont) {
  const styleId = `font-face-${font.id}`;
  if (document.getElementById(styleId)) return;
  const style = document.createElement("style");
  style.id = styleId;
  style.textContent = `@font-face { font-family: "${font.name}"; src: url("${font.url}"); }`;
  document.head.appendChild(style);
}

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
  const [briefOpen, setBriefOpen] = useState(false);
  const [briefCopied, setBriefCopied] = useState(false);
  const [fontsOpen, setFontsOpen] = useState(false);
  const [fontName, setFontName] = useState("");
  const [fontRole, setFontRole] = useState("none");
  const [isDragOver, setIsDragOver] = useState(false);
  const fontFileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const { data: project, isLoading: loadingProject } = useQuery<Project>({ queryKey: ["/api/projects", id] });
  const { data: content = [], isLoading: loadingContent } = useQuery<ContentPiece[]>({
    queryKey: ["/api/content", id],
    queryFn: async () => {
      const res = await fetch(`/api/content?projectId=${id}`, { credentials: "include" });
      return res.json();
    },
  });
  const { data: fonts = [] } = useQuery<ProjectFont[]>({
    queryKey: ["/api/projects", id, "fonts"],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${id}/fonts`, { credentials: "include" });
      return res.json();
    },
  });

  useEffect(() => {
    fonts.forEach(loadFontFace);
  }, [fonts]);

  const contentForm = useForm({
    defaultValues: { projectId: Number(id), title: "", platform: "instagram", format: "post", status: "draft", notes: "", scheduledDate: "" },
  });

  const projectForm = useForm({
    defaultValues: {
      name: "", description: "", clientName: "", rules: "", instructions: "",
      brandColorDominant: "#6B46C1", brandColorSecondary: "#9F7AEA", brandColorAccent: "#E9D8FD",
    },
  });

  const emptyBrief: DesignBrief = {
    brandAdherence: "", mood: "", colorPreference: "", typographyPreference: "",
    infoHierarchy: "", imageType: "", layoutComplexity: "", styleReference: "",
    accessibility: "", mandatoryElements: [], visualRestrictions: [], additionalNotes: "",
  };
  const [briefForm, setBriefForm] = useState<DesignBrief>(emptyBrief);

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

  const updateDesignBriefMutation = useMutation({
    mutationFn: (brief: DesignBrief) => apiRequest("PATCH", `/api/projects/${id}`, { designBrief: brief }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", id] });
      toast({ title: "Briefing salvo!" });
    },
    onError: () => toast({ title: "Erro ao salvar briefing", variant: "destructive" }),
  });

  const uploadFontMutation = useMutation({
    mutationFn: async ({ file, name, role }: { file: File; name: string; role: string }) => {
      const formData = new FormData();
      formData.append("font", file);
      formData.append("name", name || file.name.replace(/\.[^.]+$/, ""));
      if (role && role !== "none") formData.append("role", role);
      const res = await fetch(`/api/projects/${id}/fonts`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Falha no upload");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", id, "fonts"] });
      setFontName("");
      setFontRole("none");
      if (fontFileRef.current) fontFileRef.current.value = "";
      toast({ title: "Fonte enviada com sucesso!" });
    },
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });

  const updateFontRoleMutation = useMutation({
    mutationFn: ({ fontId, role }: { fontId: number; role: string }) =>
      apiRequest("PATCH", `/api/projects/${id}/fonts/${fontId}`, { role: role === "none" ? null : role }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/projects", id, "fonts"] }),
    onError: () => toast({ title: "Erro ao atualizar papel da fonte", variant: "destructive" }),
  });

  const deleteFontMutation = useMutation({
    mutationFn: (fontId: number) => apiRequest("DELETE", `/api/projects/${id}/fonts/${fontId}`),
    onSuccess: (_, fontId) => {
      const styleEl = document.getElementById(`font-face-${fontId}`);
      if (styleEl) styleEl.remove();
      queryClient.invalidateQueries({ queryKey: ["/api/projects", id, "fonts"] });
      toast({ title: "Fonte removida" });
    },
    onError: () => toast({ title: "Erro ao remover fonte", variant: "destructive" }),
  });

  const handleFontUpload = (file: File) => {
    if (!file) return;
    const name = fontName || file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ");
    uploadFontMutation.mutate({ file, name, role: fontRole });
  };

  const openBrief = () => {
    if (!project) return;
    const existing = (project as any).designBrief as DesignBrief | null;
    setBriefForm(existing ? { ...emptyBrief, ...existing } : emptyBrief);
    setBriefOpen(true);
  };

  const toggleMulti = (field: "mandatoryElements" | "visualRestrictions", value: string) => {
    setBriefForm(prev => {
      const current = prev[field] || [];
      return {
        ...prev,
        [field]: current.includes(value) ? current.filter(v => v !== value) : [...current, value],
      };
    });
  };

  const formatBriefAsText = (): string => {
    if (!project) return "";
    const b = (project as any).designBrief as DesignBrief | null;
    if (!b) return "Briefing não preenchido.";
    const lines = [`BRIEFING DE DESIGN — ${project.clientName || project.name}`, ""];
    const palette = getBrandColors(project.brandColors);
    if (palette) {
      lines.push(`Paleta de Cores (60-30-10):`);
      lines.push(`  • Dominante (60%): ${palette.dominant}`);
      lines.push(`  • Secundária (30%): ${palette.secondary}`);
      lines.push(`  • Destaque (10%): ${palette.accent}`);
      lines.push("");
    }
    if (b.brandAdherence) lines.push(`Aderência à Identidade: ${b.brandAdherence}`);
    if (b.mood) lines.push(`Mood/Clima Visual: ${b.mood}`);
    if (b.colorPreference) lines.push(`Preferência de Cores: ${b.colorPreference}`);
    if (b.typographyPreference) lines.push(`Tipografia: ${b.typographyPreference}`);
    if (b.infoHierarchy) lines.push(`Hierarquia Visual: ${b.infoHierarchy}`);
    if (b.imageType) lines.push(`Tipo de Imagem: ${b.imageType}`);
    if (b.layoutComplexity) lines.push(`Complexidade do Layout: ${b.layoutComplexity}`);
    if (b.styleReference) lines.push(`Referência de Estilo: ${b.styleReference}`);
    if (b.accessibility) lines.push(`Acessibilidade/Legibilidade: ${b.accessibility}`);
    if (b.mandatoryElements?.length) lines.push(`Elementos Obrigatórios: ${b.mandatoryElements.join(", ")}`);
    if (b.visualRestrictions?.length) lines.push(`Restrições Visuais: ${b.visualRestrictions.join(", ")}`);
    if (b.additionalNotes) { lines.push(""); lines.push(`Notas Adicionais: ${b.additionalNotes}`); }
    if (project.rules) { lines.push(""); lines.push(`Regras de Conteúdo: ${project.rules}`); }
    if (project.instructions) { lines.push(""); lines.push(`Tom e Instruções: ${project.instructions}`); }
    return lines.join("\n");
  };

  const copyBrief = () => {
    const text = formatBriefAsText();
    navigator.clipboard.writeText(text).then(() => {
      setBriefCopied(true);
      setTimeout(() => setBriefCopied(false), 2000);
    });
  };

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
        <Button variant="outline" size="sm" onClick={() => setFontsOpen(true)} data-testid="button-project-fonts">
          <Type className="w-4 h-4 mr-1" /> Fontes
          {fonts.length > 0 && <span className="ml-1 text-xs bg-primary/15 text-primary rounded-full px-1.5">{fonts.length}</span>}
        </Button>
        <Button variant="outline" size="sm" onClick={openBrief} data-testid="button-design-brief">
          <FileText className="w-4 h-4 mr-1" /> Briefing
        </Button>
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

      <Dialog open={briefOpen} onOpenChange={setBriefOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start justify-between gap-2">
              <div>
                <DialogTitle>Briefing de Design</DialogTitle>
                <p className="text-xs text-muted-foreground mt-0.5">Preenchido uma vez por cliente. Alimenta a IA de imagem e o designer automaticamente.</p>
              </div>
              <Button variant="outline" size="sm" onClick={copyBrief} className="shrink-0" data-testid="button-copy-brief">
                {briefCopied ? <><Check className="w-3.5 h-3.5 mr-1 text-green-600" /> Copiado</> : <><Copy className="w-3.5 h-3.5 mr-1" /> Copiar para Designer</>}
              </Button>
            </div>
          </DialogHeader>

          <div className="space-y-5">
            <section className="space-y-3">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide border-b pb-1">Identidade Visual</h3>

              <div className="space-y-1.5">
                <Label>Aderência à identidade visual</Label>
                <Select value={briefForm.brandAdherence || "none"} onValueChange={(v) => setBriefForm(p => ({ ...p, brandAdherence: v === "none" ? "" : v }))}>
                  <SelectTrigger data-testid="select-brief-brand-adherence"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Não definido</SelectItem>
                    <SelectItem value="Seguir 100% o manual/identidade existente">Seguir 100% o manual/identidade existente</SelectItem>
                    <SelectItem value="Seguir parcialmente, com liberdade criativa">Seguir parcialmente, com liberdade criativa</SelectItem>
                    <SelectItem value="Explorar algo novo mantendo o espírito da marca">Explorar algo novo mantendo o espírito da marca</SelectItem>
                    <SelectItem value="Visual completamente novo/experimental">Visual completamente novo/experimental</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Clima / Mood visual</Label>
                <Select value={briefForm.mood || "none"} onValueChange={(v) => setBriefForm(p => ({ ...p, mood: v === "none" ? "" : v }))}>
                  <SelectTrigger data-testid="select-brief-mood"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Não definido</SelectItem>
                    <SelectItem value="Minimalista e clean">Minimalista e clean</SelectItem>
                    <SelectItem value="Moderno e tecnológico">Moderno e tecnológico</SelectItem>
                    <SelectItem value="Sofisticado/premium">Sofisticado/premium</SelectItem>
                    <SelectItem value="Divertido e leve">Divertido e leve</SelectItem>
                    <SelectItem value="Sério e profissional">Sério e profissional</SelectItem>
                    <SelectItem value="Jovem e descolado">Jovem e descolado</SelectItem>
                    <SelectItem value="Acolhedor/humano">Acolhedor/humano</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Preferência de paleta de cores</Label>
                <Select value={briefForm.colorPreference || "none"} onValueChange={(v) => setBriefForm(p => ({ ...p, colorPreference: v === "none" ? "" : v }))}>
                  <SelectTrigger data-testid="select-brief-colors"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Não definido</SelectItem>
                    <SelectItem value="Usar apenas as cores oficiais da marca">Usar apenas as cores oficiais da marca</SelectItem>
                    <SelectItem value="Cores da marca com alguns toques complementares">Cores da marca com alguns toques complementares</SelectItem>
                    <SelectItem value="Cores mais vibrantes e chamativas">Cores mais vibrantes e chamativas</SelectItem>
                    <SelectItem value="Cores mais sóbrias/neutras">Cores mais sóbrias/neutras</SelectItem>
                    <SelectItem value="Fundo claro predominante">Fundo claro predominante</SelectItem>
                    <SelectItem value="Fundo escuro predominante">Fundo escuro predominante</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Preferência de tipografia</Label>
                <Select value={briefForm.typographyPreference || "none"} onValueChange={(v) => setBriefForm(p => ({ ...p, typographyPreference: v === "none" ? "" : v }))}>
                  <SelectTrigger data-testid="select-brief-typography"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Não definido</SelectItem>
                    <SelectItem value="Usar estritamente as fontes oficiais da marca">Usar estritamente as fontes oficiais da marca</SelectItem>
                    <SelectItem value="Fontes similares mantendo o estilo">Fontes similares mantendo o estilo</SelectItem>
                    <SelectItem value="Permitir novas fontes desde que legíveis">Permitir novas fontes desde que legíveis</SelectItem>
                    <SelectItem value="Preferência por fontes serifadas (clássicas)">Preferência por fontes serifadas (clássicas)</SelectItem>
                    <SelectItem value="Preferência por fontes sem serifa (modernas)">Preferência por fontes sem serifa (modernas)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide border-b pb-1">Layout e Composição</h3>

              <div className="space-y-1.5">
                <Label>Hierarquia de informação (maior destaque visual)</Label>
                <Select value={briefForm.infoHierarchy || "none"} onValueChange={(v) => setBriefForm(p => ({ ...p, infoHierarchy: v === "none" ? "" : v }))}>
                  <SelectTrigger data-testid="select-brief-hierarchy"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Não definido</SelectItem>
                    <SelectItem value="Headline/título principal">Headline/título principal</SelectItem>
                    <SelectItem value="Imagem/foto/ilustração">Imagem/foto/ilustração</SelectItem>
                    <SelectItem value="Benefício/resultado prometido">Benefício/resultado prometido</SelectItem>
                    <SelectItem value="Prova social (número, depoimento)">Prova social (número, depoimento)</SelectItem>
                    <SelectItem value="Call to action (botão/chamada)">Call to action (botão/chamada)</SelectItem>
                    <SelectItem value="Logo/marca">Logo/marca</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Tipo de imagem / visual</Label>
                <Select value={briefForm.imageType || "none"} onValueChange={(v) => setBriefForm(p => ({ ...p, imageType: v === "none" ? "" : v }))}>
                  <SelectTrigger data-testid="select-brief-image-type"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Não definido</SelectItem>
                    <SelectItem value="Fotografias reais de pessoas">Fotografias reais de pessoas</SelectItem>
                    <SelectItem value="Fotografias de produto/ambiente">Fotografias de produto/ambiente</SelectItem>
                    <SelectItem value="Ilustrações flat/vetoriais">Ilustrações flat/vetoriais</SelectItem>
                    <SelectItem value="Ilustrações mais complexas/3D">Ilustrações mais complexas/3D</SelectItem>
                    <SelectItem value="Ícones/pictogramas simples">Ícones/pictogramas simples</SelectItem>
                    <SelectItem value="Gráficos e elementos data driven">Gráficos e elementos data driven</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Complexidade do layout</Label>
                <Select value={briefForm.layoutComplexity || "none"} onValueChange={(v) => setBriefForm(p => ({ ...p, layoutComplexity: v === "none" ? "" : v }))}>
                  <SelectTrigger data-testid="select-brief-layout"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Não definido</SelectItem>
                    <SelectItem value="Ultra minimalista (poucos elementos, muito respiro)">Ultra minimalista (poucos elementos, muito respiro)</SelectItem>
                    <SelectItem value="Equilibrado (bem distribuído, sem poluição)">Equilibrado (bem distribuído, sem poluição)</SelectItem>
                    <SelectItem value="Rico em elementos gráficos (formas, texturas, detalhes)">Rico em elementos gráficos (formas, texturas, detalhes)</SelectItem>
                    <SelectItem value="Estilo editorial (como revista/apresentação)">Estilo editorial (como revista/apresentação)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Referência de estilo</Label>
                <Select value={briefForm.styleReference || "none"} onValueChange={(v) => setBriefForm(p => ({ ...p, styleReference: v === "none" ? "" : v }))}>
                  <SelectTrigger data-testid="select-brief-style"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Não definido</SelectItem>
                    <SelectItem value="Similar aos posts atuais do próprio perfil">Similar aos posts atuais do próprio perfil</SelectItem>
                    <SelectItem value="Seguir perfis de referência do nicho">Seguir perfis de referência do nicho</SelectItem>
                    <SelectItem value="Tendências atuais de design do nicho">Tendências atuais de design do nicho</SelectItem>
                    <SelectItem value="Clássico e atemporal (pouco modinha)">Clássico e atemporal (pouco modinha)</SelectItem>
                    <SelectItem value="Visual ousado/diferentão dentro do nicho">Visual ousado/diferentão dentro do nicho</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide border-b pb-1">Regras e Restrições</h3>

              <div className="space-y-1.5">
                <Label>Acessibilidade / legibilidade</Label>
                <Select value={briefForm.accessibility || "none"} onValueChange={(v) => setBriefForm(p => ({ ...p, accessibility: v === "none" ? "" : v }))}>
                  <SelectTrigger data-testid="select-brief-accessibility"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Não definido</SelectItem>
                    <SelectItem value="Máxima — fonte grande, alto contraste, poucos textos">Máxima — fonte grande, alto contraste, poucos textos</SelectItem>
                    <SelectItem value="Alta, com espaço para variações criativas">Alta, com espaço para variações criativas</SelectItem>
                    <SelectItem value="Moderada — ok sacrificar legibilidade por estética">Moderada — ok sacrificar legibilidade por estética</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Elementos obrigatórios (selecione todos que se aplicam)</Label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    "Logo da marca em posição fixa",
                    "Selo, carimbo ou assinatura visual",
                    "Rodapé com contatos/site",
                    "Marca d'água discreta",
                    "Nenhum elemento obrigatório",
                  ].map(opt => {
                    const selected = briefForm.mandatoryElements?.includes(opt);
                    return (
                      <button
                        key={opt} type="button"
                        onClick={() => toggleMulti("mandatoryElements", opt)}
                        className={`text-left text-xs px-2.5 py-2 rounded-md border transition-colors ${selected ? "border-primary bg-primary/10 text-primary font-medium" : "border-border text-muted-foreground hover:border-muted-foreground"}`}
                        data-testid={`toggle-mandatory-${opt.toLowerCase().replace(/\s+/g, "-")}`}
                      >
                        {selected ? "✓ " : ""}{opt}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Restrições visuais (o que NÃO deve aparecer)</Label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    "Não usar fotos de banco de imagem padrão",
                    "Não usar degradês muito fortes",
                    "Não usar ilustrações infantis/demais",
                    "Não usar muitas cores ao mesmo tempo",
                    "Não usar bordas/contornos pesados",
                    "Nenhuma restrição relevante",
                  ].map(opt => {
                    const selected = briefForm.visualRestrictions?.includes(opt);
                    return (
                      <button
                        key={opt} type="button"
                        onClick={() => toggleMulti("visualRestrictions", opt)}
                        className={`text-left text-xs px-2.5 py-2 rounded-md border transition-colors ${selected ? "border-destructive bg-destructive/5 text-destructive font-medium" : "border-border text-muted-foreground hover:border-muted-foreground"}`}
                        data-testid={`toggle-restriction-${opt.toLowerCase().replace(/\s+/g, "-")}`}
                      >
                        {selected ? "✗ " : ""}{opt}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Notas adicionais para o designer / IA</Label>
                <Textarea
                  placeholder="Ex: Perfis de referência a seguir, links de moodboard, observações específicas deste cliente..."
                  rows={3}
                  className="resize-none"
                  value={briefForm.additionalNotes || ""}
                  onChange={(e) => setBriefForm(p => ({ ...p, additionalNotes: e.target.value }))}
                  data-testid="input-brief-notes"
                />
              </div>
            </section>

            <div className="flex gap-2 justify-end pt-1 border-t">
              <Button variant="outline" size="sm" onClick={() => setBriefOpen(false)}>Cancelar</Button>
              <Button
                size="sm"
                onClick={() => updateDesignBriefMutation.mutate(briefForm)}
                disabled={updateDesignBriefMutation.isPending}
                data-testid="button-save-brief"
              >
                {updateDesignBriefMutation.isPending ? "Salvando..." : "Salvar Briefing"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={fontsOpen} onOpenChange={setFontsOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Fontes do Projeto</DialogTitle>
            <p className="text-xs text-muted-foreground">Suba TTF, OTF, WOFF ou WOFF2. Atribua o papel de cada fonte para que a IA e o designer saibam como usá-las.</p>
          </DialogHeader>

          <div className="space-y-5">
            <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Adicionar nova fonte</h3>

              <div className="space-y-2">
                <Label>Nome da fonte</Label>
                <Input
                  placeholder="Ex: Playfair Display, Montserrat..."
                  value={fontName}
                  onChange={(e) => setFontName(e.target.value)}
                  data-testid="input-font-name"
                />
              </div>

              <div className="space-y-2">
                <Label>Papel</Label>
                <Select value={fontRole} onValueChange={setFontRole}>
                  <SelectTrigger data-testid="select-font-role"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FONT_ROLES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${isDragOver ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground"}`}
                onClick={() => fontFileRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragOver(false);
                  const file = e.dataTransfer.files[0];
                  if (file) handleFontUpload(file);
                }}
                data-testid="dropzone-font"
              >
                <input
                  ref={fontFileRef}
                  type="file"
                  accept=".ttf,.otf,.woff,.woff2"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFontUpload(f); }}
                />
                {uploadFontMutation.isPending ? (
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    Enviando...
                  </div>
                ) : (
                  <>
                    <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm font-medium">Arraste ou clique para selecionar</p>
                    <p className="text-xs text-muted-foreground mt-1">TTF, OTF, WOFF, WOFF2 — máx. 10 MB</p>
                  </>
                )}
              </div>
            </div>

            {fonts.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Fontes do projeto ({fonts.length})</h3>
                <div className="space-y-2">
                  {fonts.map(font => (
                    <div key={font.id} className="flex items-center gap-3 p-3 border rounded-lg" data-testid={`font-card-${font.id}`}>
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-sm font-medium truncate"
                          style={{ fontFamily: `"${font.name}", sans-serif` }}
                          data-testid={`font-name-${font.id}`}
                        >
                          {font.name}
                        </p>
                        <p className="text-xs text-muted-foreground uppercase">{font.format}</p>
                        <p
                          className="text-xs text-muted-foreground mt-0.5 truncate"
                          style={{ fontFamily: `"${font.name}", sans-serif`, fontSize: "11px" }}
                        >
                          AaBbCcDdEe 0123456789
                        </p>
                      </div>
                      <Select
                        value={font.role || "none"}
                        onValueChange={(v) => updateFontRoleMutation.mutate({ fontId: font.id, role: v })}
                      >
                        <SelectTrigger className="w-36 shrink-0 text-xs h-8" data-testid={`select-font-role-${font.id}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {FONT_ROLES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                        onClick={() => deleteFontMutation.mutate(font.id)}
                        disabled={deleteFontMutation.isPending}
                        data-testid={`button-delete-font-${font.id}`}
                      >
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="pt-2">
                  <h4 className="text-xs font-semibold text-muted-foreground mb-1.5">Papéis atribuídos</h4>
                  <div className="grid grid-cols-2 gap-1.5">
                    {["h1", "h2", "body", "assets"].map(role => {
                      const assigned = fonts.find(f => f.role === role);
                      const roleLabel = FONT_ROLES.find(r => r.value === role)?.label.split(" — ")[1] || role;
                      return (
                        <div key={role} className={`text-xs p-2 rounded-md border ${assigned ? "border-primary/30 bg-primary/5" : "border-dashed text-muted-foreground"}`}>
                          <span className="font-medium text-muted-foreground">{roleLabel}:</span>{" "}
                          {assigned ? (
                            <span style={{ fontFamily: `"${assigned.name}", sans-serif` }}>{assigned.name}</span>
                          ) : (
                            <span className="italic">não definido</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {fonts.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-4">Nenhuma fonte adicionada ainda.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
