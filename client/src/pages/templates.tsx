import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, FileText, Trash2, Edit, Globe, Upload, Loader2, Image, Sparkles } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import type { Template, Project } from "@shared/schema";

export default function Templates() {
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState<Template | null>(null);
  const [extractOpen, setExtractOpen] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [extractResult, setExtractResult] = useState<any>(null);
  const [extractPreview, setExtractPreview] = useState<string | null>(null);
  const extractFileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const { data: templates = [], isLoading } = useQuery<Template[]>({ queryKey: ["/api/templates"] });
  const { data: projects = [] } = useQuery<Project[]>({ queryKey: ["/api/projects"] });

  const form = useForm({
    defaultValues: { name: "", description: "", platform: "any", format: "any", captionTemplate: "", promptTemplate: "", category: "", isGlobal: true, projectId: null as number | null },
  });

  const openCreate = () => {
    setEditItem(null);
    form.reset({ name: "", description: "", platform: "any", format: "any", captionTemplate: "", promptTemplate: "", category: "", isGlobal: true, projectId: null });
    setOpen(true);
  };

  const openEdit = (t: Template) => {
    setEditItem(t);
    form.reset({ name: t.name, description: t.description || "", platform: t.platform || "any", format: t.format || "any", captionTemplate: t.captionTemplate || "", promptTemplate: t.promptTemplate || "", category: t.category || "", isGlobal: t.isGlobal ?? true, projectId: t.projectId || null });
    setOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: (data: any) => {
      const cleaned = { ...data, platform: data.platform === "any" ? null : data.platform, format: data.format === "any" ? null : data.format };
      return editItem ? apiRequest("PATCH", `/api/templates/${editItem.id}`, cleaned) : apiRequest("POST", "/api/templates", cleaned);
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/templates"] }); setOpen(false); toast({ title: editItem ? "Template atualizado!" : "Template criado!" }); },
    onError: () => toast({ title: "Erro ao salvar template", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/templates/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/templates"] }); toast({ title: "Template removido" }); },
  });

  const handleExtractImage = async (file: File) => {
    setExtracting(true);
    setExtractResult(null);
    const reader = new FileReader();
    reader.onload = (e) => setExtractPreview(e.target?.result as string);
    reader.readAsDataURL(file);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch("/api/ai/analyze-image", { method: "POST", body: formData });
      const data = await res.json();
      setExtractResult(data);
      toast({ title: "Imagem analisada! Revise e salve como template." });
    } catch {
      toast({ title: "Erro ao analisar imagem", variant: "destructive" });
    } finally {
      setExtracting(false);
    }
  };

  const saveExtractedAsTemplate = () => {
    if (!extractResult) return;
    const captionStructure = extractResult.suggestedCaption
      ? `[HOOK/TÍTULO]\n\n${extractResult.suggestedCaption}\n\n[HASHTAGS]`
      : "[HOOK/TÍTULO]\n\n[CORPO DO CONTEÚDO]\n\n[CHAMADA PARA AÇÃO]\n\n[HASHTAGS]";
    form.reset({
      name: extractResult.contentType ? `Template: ${extractResult.contentType}` : "Template Extraído",
      description: extractResult.description || "Template extraído a partir de imagem de referência.",
      platform: "any",
      format: "any",
      captionTemplate: captionStructure,
      promptTemplate: extractResult.imagePromptToReplicate || "",
      category: extractResult.contentType || "Referência Visual",
      isGlobal: true,
      projectId: null,
    });
    setEditItem(null);
    setExtractOpen(false);
    setOpen(true);
  };

  const platformLabels: Record<string, string> = { instagram: "Instagram", linkedin: "LinkedIn" };
  const formatLabels: Record<string, string> = { post: "Post", story: "Story", carrossel: "Carrossel", reels: "Reels" };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Templates</h1>
          <p className="text-sm text-muted-foreground">Modelos de conteúdo reutilizáveis</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => { setExtractResult(null); setExtractPreview(null); setExtractOpen(true); }} data-testid="button-extract-from-image">
            <Image className="w-4 h-4 mr-1" /> Extrair de Imagem
          </Button>
          <Button size="sm" onClick={openCreate} data-testid="button-create-template">
            <Plus className="w-4 h-4 mr-1" /> Novo Template
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-3">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-32 rounded-md" />)}
        </div>
      ) : templates.length === 0 ? (
        <Card>
          <CardContent className="p-12 flex flex-col items-center gap-3">
            <FileText className="w-12 h-12 text-muted-foreground" />
            <p className="text-sm text-muted-foreground text-center">Nenhum template ainda.<br />Crie templates ou extraia de uma imagem de referência.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          {templates.map((t) => (
            <Card key={t.id} className="group" data-testid={`template-${t.id}`}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-foreground">{t.name}</p>
                    {t.isGlobal && <Badge variant="secondary" className="text-xs"><Globe className="w-3 h-3 mr-1" />Global</Badge>}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => openEdit(t)}>
                      <Edit className="w-3.5 h-3.5 text-muted-foreground" />
                    </Button>
                    <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => deleteMutation.mutate(t.id)}>
                      <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
                {t.description && <p className="text-xs text-muted-foreground">{t.description}</p>}
                <div className="flex flex-wrap gap-1">
                  {t.platform && <Badge variant="outline" className="text-xs">{platformLabels[t.platform] || t.platform}</Badge>}
                  {t.format && <Badge variant="outline" className="text-xs">{formatLabels[t.format] || t.format}</Badge>}
                  {t.category && <Badge variant="outline" className="text-xs">{t.category}</Badge>}
                </div>
                {t.captionTemplate && (
                  <p className="text-xs text-muted-foreground bg-muted rounded-sm p-2 line-clamp-2">{t.captionTemplate}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editItem ? "Editar Template" : "Criar Template"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit((d) => saveMutation.mutate(d))} className="space-y-3">
            <div className="space-y-1">
              <Label>Nome *</Label>
              <Input placeholder="Ex: Post de Lançamento" data-testid="input-template-name" {...form.register("name", { required: true })} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>Plataforma</Label>
                <Controller name="platform" control={form.control} render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="h-8"><SelectValue placeholder="Qualquer" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Qualquer</SelectItem>
                      <SelectItem value="instagram">Instagram</SelectItem>
                      <SelectItem value="linkedin">LinkedIn</SelectItem>
                    </SelectContent>
                  </Select>
                )} />
              </div>
              <div className="space-y-1">
                <Label>Formato</Label>
                <Controller name="format" control={form.control} render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="h-8"><SelectValue placeholder="Qualquer" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Qualquer</SelectItem>
                      <SelectItem value="post">Post</SelectItem>
                      <SelectItem value="story">Story</SelectItem>
                      <SelectItem value="carrossel">Carrossel</SelectItem>
                      <SelectItem value="reels">Reels</SelectItem>
                    </SelectContent>
                  </Select>
                )} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Categoria</Label>
              <Input placeholder="Ex: Lançamento, Engajamento, Educativo..." {...form.register("category")} />
            </div>
            <div className="space-y-1">
              <Label>Template de Legenda</Label>
              <Textarea placeholder="Ex: [HEADLINE]\n\n[CORPO DO POST]\n\nO que você achou? Conta nos comentários!" rows={5} className="resize-none" {...form.register("captionTemplate")} />
            </div>
            <div className="space-y-1">
              <Label>Prompt Visual (para replicar o estilo da imagem)</Label>
              <Textarea placeholder="Ex: Describe the image style, colors, and visual elements to replicate..." rows={3} className="resize-none" {...form.register("promptTemplate")} />
            </div>
            <div className="space-y-1">
              <Label>Descrição</Label>
              <Input placeholder="Para que serve este template?" {...form.register("description")} />
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" size="sm" disabled={saveMutation.isPending} data-testid="button-submit-template">
                {saveMutation.isPending ? "Salvando..." : "Salvar Template"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={extractOpen} onOpenChange={setExtractOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Extrair Template de Imagem
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Envie uma imagem de referência e a IA vai analisar a estrutura, estilo visual e texto para criar um template reutilizável.
            </p>

            <div
              className="border-2 border-dashed border-border rounded-md p-6 text-center cursor-pointer hover-elevate"
              onClick={() => extractFileRef.current?.click()}
              data-testid="extract-upload-zone"
            >
              <input
                ref={extractFileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => { if (e.target.files?.[0]) handleExtractImage(e.target.files[0]); }}
              />
              {extracting ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  <p className="text-sm text-muted-foreground">Analisando estrutura e estilo...</p>
                </div>
              ) : extractPreview ? (
                <div className="space-y-2">
                  <img src={extractPreview} alt="Preview" className="max-h-40 mx-auto rounded-md object-contain" />
                  <p className="text-xs text-muted-foreground">Clique para trocar a imagem</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="w-8 h-8 text-muted-foreground" />
                  <p className="text-sm font-medium text-foreground">Clique para enviar uma imagem</p>
                  <p className="text-xs text-muted-foreground">PNG, JPG ou WEBP · Máx. 20MB</p>
                </div>
              )}
            </div>

            {extractResult && (
              <div className="space-y-3 p-3 rounded-md border border-border bg-muted/30">
                <p className="text-xs font-semibold text-foreground">Análise da IA</p>
                {extractResult.description && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-0.5">Descrição</p>
                    <p className="text-xs text-foreground">{extractResult.description}</p>
                  </div>
                )}
                {extractResult.style && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-0.5">Estilo Visual</p>
                    <p className="text-xs text-foreground">{extractResult.style}</p>
                  </div>
                )}
                {extractResult.contentType && (
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-medium text-muted-foreground">Tipo:</p>
                    <Badge variant="outline" className="text-xs">{extractResult.contentType}</Badge>
                  </div>
                )}
                {extractResult.imagePromptToReplicate && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-0.5">Prompt para replicar o visual</p>
                    <p className="text-xs text-foreground bg-muted p-2 rounded-sm line-clamp-3">{extractResult.imagePromptToReplicate}</p>
                  </div>
                )}
                {extractResult.suggestedCaption && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-0.5">Estrutura de legenda sugerida</p>
                    <p className="text-xs text-foreground bg-muted p-2 rounded-sm line-clamp-3">{extractResult.suggestedCaption}</p>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" size="sm" onClick={() => setExtractOpen(false)}>Cancelar</Button>
              {extractResult && (
                <Button size="sm" onClick={saveExtractedAsTemplate} data-testid="button-save-extracted-template">
                  <Plus className="w-4 h-4 mr-1" /> Salvar como Template
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
