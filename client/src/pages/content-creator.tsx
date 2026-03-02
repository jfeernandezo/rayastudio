import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Sparkles, Image, Loader2, Save, CheckCircle, Wand2, RefreshCw, BookOpen, Zap, Share2, ImageIcon } from "lucide-react";
import type { Project, ContentPiece, Template, KnowledgeBase, Prompt } from "@shared/schema";

const statusOptions = [
  { value: "draft", label: "Rascunho" },
  { value: "review", label: "Em Revisão" },
  { value: "approved", label: "Aprovado" },
  { value: "published", label: "Publicado" },
];

export default function ContentCreator() {
  const { id, contentId } = useParams<{ id: string; contentId: string }>();
  const { toast } = useToast();

  const [aiTopic, setAiTopic] = useState("");
  const [aiTone, setAiTone] = useState("profissional e engajante");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("none");
  const [generatingCaption, setGeneratingCaption] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);

  const [form, setForm] = useState<Partial<ContentPiece>>({});
  const [saved, setSaved] = useState(false);

  const { data: project } = useQuery<Project>({ queryKey: ["/api/projects", id] });
  const { data: content, isLoading } = useQuery<ContentPiece>({
    queryKey: ["/api/content", contentId],
    enabled: !!contentId,
  });

  useEffect(() => {
    if (content) setForm(content);
  }, [content?.id]);

  const { data: templates = [] } = useQuery<Template[]>({ queryKey: ["/api/templates"] });
  const { data: knowledge = [] } = useQuery<KnowledgeBase[]>({
    queryKey: ["/api/knowledge", "project", id],
    queryFn: async () => {
      const res = await fetch(`/api/knowledge?projectId=${id}`, { credentials: "include" });
      return res.json();
    },
  });
  const { data: prompts = [] } = useQuery<Prompt[]>({ queryKey: ["/api/prompts"] });

  const selectedTemplateObj = templates.find(t => t.id === Number(selectedTemplate));

  const saveMutation = useMutation({
    mutationFn: () => apiRequest("PATCH", `/api/content/${contentId}`, form),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/content"] }); setSaved(true); setTimeout(() => setSaved(false), 2000); },
    onError: () => toast({ title: "Erro ao salvar", variant: "destructive" }),
  });

  const shareMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/content/${contentId}/share`, { method: "POST" });
      if (!res.ok) throw new Error("Erro");
      return res.json() as Promise<{ token: string }>;
    },
    onSuccess: ({ token }) => {
      const url = `${window.location.origin}/approve/${token}`;
      navigator.clipboard.writeText(url).then(() => {
        toast({ title: "Link copiado!", description: "Compartilhe com o cliente para aprovação." });
      }).catch(() => {
        toast({ title: "Link gerado", description: url });
      });
      queryClient.invalidateQueries({ queryKey: ["/api/content"] });
    },
    onError: () => toast({ title: "Erro ao gerar link", variant: "destructive" }),
  });

  const updateField = (field: keyof ContentPiece, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleTemplateChange = (value: string) => {
    setSelectedTemplate(value);
    const tmpl = templates.find(t => t.id === Number(value));
    if (tmpl?.promptTemplate) {
      updateField("imagePrompt", tmpl.promptTemplate);
    }
  };

  const handleGenerateCaption = async () => {
    setGeneratingCaption(true);
    try {
      const template = selectedTemplateObj;
      const knowledgeContext = knowledge.map(k => `${k.title}: ${k.content}`).join("\n");
      const res = await fetch("/api/ai/caption", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectContext: `${project?.name}. ${project?.instructions || ""}. ${project?.description || ""}`,
          platform: form.platform,
          format: form.format,
          template: template?.captionTemplate,
          topic: aiTopic || form.title,
          tone: aiTone,
          knowledgeContext,
        }),
      });
      const data = await res.json();
      if (data.caption) updateField("caption", data.caption);
      if (data.hashtags) updateField("hashtags", data.hashtags);
      if (data.imagePrompt && !form.imagePrompt) updateField("imagePrompt", data.imagePrompt);
      toast({ title: "Legenda gerada!" });
    } catch (e) {
      toast({ title: "Erro ao gerar legenda", variant: "destructive" });
    } finally {
      setGeneratingCaption(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!form.imagePrompt) {
      toast({ title: "Preencha o prompt de imagem primeiro", variant: "destructive" });
      return;
    }
    setGeneratingImage(true);
    try {
      const res = await fetch("/api/ai/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: form.imagePrompt,
          platform: form.platform,
          format: form.format,
          brandColors: (project as any)?.brandColors,
          designBrief: (project as any)?.designBrief,
        }),
      });
      const data = await res.json();
      if (data.b64_json) {
        const imageUrl = `data:image/png;base64,${data.b64_json}`;
        updateField("imageUrl", imageUrl);
        toast({ title: "Imagem gerada!" });
      }
    } catch (e) {
      toast({ title: "Erro ao gerar imagem", variant: "destructive" });
    } finally {
      setGeneratingImage(false);
    }
  };

  const applyPrompt = (prompt: Prompt) => {
    setAiTopic(prev => prev ? `${prev}\n${prompt.content}` : prompt.content);
    toast({ title: `Prompt "${prompt.name}" aplicado` });
  };

  if (isLoading) return (
    <div className="p-6 max-w-5xl mx-auto space-y-4">
      <Skeleton className="h-8 w-48" />
      <div className="grid md:grid-cols-2 gap-6">
        <Skeleton className="h-96 rounded-md" />
        <Skeleton className="h-96 rounded-md" />
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild className="w-8 h-8">
          <Link href={`/projects/${id}`}><ArrowLeft className="w-4 h-4" /></Link>
        </Button>
        <div className="flex-1 min-w-0">
          <Input
            value={form.title || ""}
            onChange={(e) => updateField("title", e.target.value)}
            placeholder="Título do conteúdo..."
            className="text-lg font-semibold border-0 px-0 h-auto focus-visible:ring-0 bg-transparent"
            data-testid="input-content-editor-title"
          />
          {project && <p className="text-xs text-muted-foreground">{project.name}</p>}
        </div>
        <Select value={form.status || "draft"} onValueChange={(v) => updateField("status", v)}>
          <SelectTrigger className="w-32 h-8" data-testid="select-status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
        {contentId && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => shareMutation.mutate()}
            disabled={shareMutation.isPending}
            data-testid="button-share-approval"
            title="Gerar link de aprovação para o cliente"
          >
            {shareMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
            <span className="hidden sm:inline ml-1.5">Compartilhar</span>
          </Button>
        )}
        <Button size="sm" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} data-testid="button-save-content">
          {saved ? <><CheckCircle className="w-4 h-4 mr-1" /> Salvo</> : saveMutation.isPending ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Salvando</> : <><Save className="w-4 h-4 mr-1" /> Salvar</>}
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-2 text-sm">
        <div className="flex items-center gap-2">
          <Label className="text-xs w-20 shrink-0">Plataforma</Label>
          <Select value={form.platform || "instagram"} onValueChange={(v) => updateField("platform", v)}>
            <SelectTrigger className="h-8" data-testid="select-editor-platform"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="instagram">Instagram</SelectItem>
              <SelectItem value="linkedin">LinkedIn</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-xs w-20 shrink-0">Formato</Label>
          <Select value={form.format || "post"} onValueChange={(v) => updateField("format", v)}>
            <SelectTrigger className="h-8" data-testid="select-editor-format"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="post">Post</SelectItem>
              <SelectItem value="story">Story</SelectItem>
              <SelectItem value="carrossel">Carrossel</SelectItem>
              <SelectItem value="reels">Reels</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Tabs defaultValue="caption">
            <TabsList className="w-full">
              <TabsTrigger value="caption" className="flex-1">Legenda</TabsTrigger>
              <TabsTrigger value="ai" className="flex-1">Gerador IA</TabsTrigger>
            </TabsList>

            <TabsContent value="caption" className="space-y-3 mt-3">
              <div className="space-y-1">
                <Label className="text-xs">Legenda</Label>
                <Textarea
                  value={form.caption || ""}
                  onChange={(e) => updateField("caption", e.target.value)}
                  placeholder="Escreva a legenda aqui ou use a IA para gerar..."
                  rows={8}
                  className="resize-none"
                  data-testid="input-caption"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Hashtags</Label>
                <Input
                  value={form.hashtags || ""}
                  onChange={(e) => updateField("hashtags", e.target.value)}
                  placeholder="#marketing #agencia #conteudo"
                  data-testid="input-hashtags"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Data de Publicação</Label>
                <Input type="date" value={form.scheduledDate || ""} onChange={(e) => updateField("scheduledDate", e.target.value)} data-testid="input-date" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Notas Internas</Label>
                <Textarea value={form.notes || ""} onChange={(e) => updateField("notes", e.target.value)} placeholder="Notas para a equipe..." rows={2} className="resize-none" />
              </div>
            </TabsContent>

            <TabsContent value="ai" className="space-y-3 mt-3">
              <div className="space-y-1">
                <Label className="text-xs">Template</Label>
                <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
                  <SelectTrigger className="h-8" data-testid="select-template"><SelectValue placeholder="Selecionar template..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {templates.map(t => (
                      <SelectItem key={t.id} value={String(t.id)}>
                        {t.name}{t.referenceImageUrl || t.promptTemplate ? " 🖼" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedTemplateObj && (selectedTemplateObj.referenceImageUrl || selectedTemplateObj.promptTemplate) && (
                  <div className="flex items-start gap-2 p-2 rounded-md border border-primary/20 bg-primary/5 mt-1">
                    {selectedTemplateObj.referenceImageUrl && (
                      <img
                        src={selectedTemplateObj.referenceImageUrl}
                        alt="Referência visual"
                        className="w-12 h-12 object-cover rounded-sm shrink-0"
                      />
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-primary flex items-center gap-1">
                        <ImageIcon className="w-3 h-3" /> Referência visual carregada
                      </p>
                      {selectedTemplateObj.promptTemplate && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{selectedTemplateObj.promptTemplate.slice(0, 100)}...</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Tópico / Contexto</Label>
                <Textarea
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  placeholder="Sobre o que é este conteúdo? Quais pontos principais?"
                  rows={4}
                  className="resize-none"
                  data-testid="input-ai-topic"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Tom</Label>
                <Input value={aiTone} onChange={(e) => setAiTone(e.target.value)} placeholder="Ex: informal, inspirador, educativo..." data-testid="input-ai-tone" />
              </div>

              {prompts.length > 0 && (
                <div className="space-y-1">
                  <Label className="text-xs">Prompts Rápidos</Label>
                  <div className="flex flex-wrap gap-1">
                    {prompts.slice(0, 8).map(p => (
                      <button
                        key={p.id}
                        onClick={() => applyPrompt(p)}
                        className="text-xs px-2 py-1 rounded-sm bg-muted hover-elevate cursor-pointer text-muted-foreground"
                        data-testid={`prompt-chip-${p.id}`}
                      >
                        <Zap className="w-3 h-3 inline mr-1" />{p.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <Button onClick={handleGenerateCaption} disabled={generatingCaption} size="sm" className="w-full" data-testid="button-generate-caption">
                {generatingCaption ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Gerando legenda...</> : <><Sparkles className="w-4 h-4 mr-1" /> Gerar Legenda</>}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
                <div className="relative flex justify-center"><span className="bg-background px-2 text-xs text-muted-foreground">imagem</span></div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Prompt de Imagem</Label>
                <Textarea
                  value={form.imagePrompt || ""}
                  onChange={(e) => updateField("imagePrompt", e.target.value)}
                  placeholder={selectedTemplateObj?.promptTemplate ? "Prompt carregado do template — edite se necessário..." : "Descreva a imagem que quer gerar ou selecione um template com referência visual..."}
                  rows={3}
                  className="resize-none"
                  data-testid="input-image-prompt"
                />
              </div>

              <Button onClick={handleGenerateImage} disabled={generatingImage || !form.imagePrompt} size="sm" className="w-full" variant="outline" data-testid="button-generate-image-ai">
                {generatingImage ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Gerando imagem...</> : <><Wand2 className="w-4 h-4 mr-1" /> Gerar Imagem com IA</>}
              </Button>

              {knowledge.length > 0 && (
                <div className="space-y-1 pt-1">
                  <Label className="text-xs flex items-center gap-1 text-muted-foreground"><BookOpen className="w-3 h-3" /> Base de Conhecimento ativa</Label>
                  <div className="space-y-1 max-h-24 overflow-y-auto">
                    {knowledge.slice(0, 3).map(k => (
                      <div key={k.id} className="text-xs p-2 rounded-sm bg-muted">
                        <span className="font-medium">{k.title}:</span> <span className="text-muted-foreground">{k.content.slice(0, 80)}...</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs">Imagem</Label>
            {form.imageUrl ? (
              <div className="relative rounded-md overflow-hidden border border-border">
                <img src={form.imageUrl} alt="Gerada" className="w-full object-cover" style={{ maxHeight: "300px" }} />
                <div className="absolute bottom-2 right-2 flex gap-1">
                  <Button size="sm" variant="outline" className="h-7 text-xs bg-background/80" onClick={handleGenerateImage} disabled={generatingImage}>
                    <RefreshCw className="w-3 h-3 mr-1" /> Regerar
                  </Button>
                </div>
              </div>
            ) : (
              <div
                className="border-2 border-dashed border-border rounded-md p-8 flex flex-col items-center gap-2 cursor-pointer hover-elevate"
                onClick={handleGenerateImage}
                data-testid="image-generate-zone"
              >
                {generatingImage ? (
                  <>
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    <p className="text-xs text-muted-foreground">Gerando imagem...</p>
                  </>
                ) : (
                  <>
                    <Image className="w-8 h-8 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground text-center">
                      {form.imagePrompt ? "Clique para gerar a imagem" : "Preencha o prompt de imagem na aba Gerador IA"}
                    </p>
                  </>
                )}
              </div>
            )}
          </div>

          {form.caption && (
            <Card>
              <CardHeader className="p-3 pb-1">
                <CardTitle className="text-xs text-muted-foreground">Preview da Legenda</CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <p className="text-xs text-foreground whitespace-pre-wrap line-clamp-6">{form.caption}</p>
                {form.hashtags && <p className="text-xs text-primary mt-2">{form.hashtags}</p>}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
