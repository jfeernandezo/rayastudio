import { useState, useRef, useEffect } from "react";
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
import { ArrowLeft, Sparkles, Image, Upload, Loader2, Save, CheckCircle, Copy, Wand2, RefreshCw, BookOpen, Zap, Share2 } from "lucide-react";
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
  const fileRef = useRef<HTMLInputElement>(null);

  const [aiTopic, setAiTopic] = useState("");
  const [aiTone, setAiTone] = useState("profissional e engajante");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [generatingCaption, setGeneratingCaption] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [analyzingImage, setAnalyzingImage] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

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

  const handleGenerateCaption = async () => {
    setGeneratingCaption(true);
    try {
      const template = templates.find(t => t.id === Number(selectedTemplate));
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
      if (data.imagePrompt) updateField("imagePrompt", data.imagePrompt);
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

  const handleAnalyzeImage = async (file: File) => {
    setAnalyzingImage(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch("/api/ai/analyze-image", { method: "POST", body: formData });
      const data = await res.json();
      setAnalysisResult(data);
      if (data.imagePromptToReplicate) updateField("imagePrompt", data.imagePromptToReplicate);
      if (data.suggestedCaption) updateField("caption", data.suggestedCaption);
      toast({ title: "Imagem analisada!" });
    } catch (e) {
      toast({ title: "Erro ao analisar imagem", variant: "destructive" });
    } finally {
      setAnalyzingImage(false);
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
              <TabsTrigger value="analyze" className="flex-1">Analisar</TabsTrigger>
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
              <div className="space-y-1">
                <Label className="text-xs">Template</Label>
                <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                  <SelectTrigger className="h-8" data-testid="select-template"><SelectValue placeholder="Selecionar template..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {templates.map(t => <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
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
                {generatingCaption ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Gerando...</> : <><Sparkles className="w-4 h-4 mr-1" /> Gerar Legenda</>}
              </Button>
            </TabsContent>

            <TabsContent value="analyze" className="space-y-3 mt-3">
              <div
                className="border-2 border-dashed border-border rounded-md p-6 text-center cursor-pointer hover-elevate"
                onClick={() => fileRef.current?.click()}
                data-testid="upload-zone"
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => { if (e.target.files?.[0]) handleAnalyzeImage(e.target.files[0]); }}
                />
                {analyzingImage ? (
                  <><Loader2 className="w-6 h-6 text-muted-foreground animate-spin mx-auto mb-2" /><p className="text-xs text-muted-foreground">Analisando imagem...</p></>
                ) : (
                  <><Upload className="w-6 h-6 text-muted-foreground mx-auto mb-2" /><p className="text-sm font-medium text-foreground">Enviar imagem de referência</p><p className="text-xs text-muted-foreground mt-1">Extraia o estilo, texto e prompt para replicar</p></>
                )}
              </div>
              {analysisResult && (
                <Card>
                  <CardContent className="p-3 space-y-2">
                    <p className="text-xs font-medium text-foreground">Análise da Imagem</p>
                    {analysisResult.description && <p className="text-xs text-muted-foreground"><span className="font-medium">Descrição:</span> {analysisResult.description}</p>}
                    {analysisResult.style?.mood && <p className="text-xs text-muted-foreground"><span className="font-medium">Tom:</span> {analysisResult.style.mood}</p>}
                    {analysisResult.style?.composition && <p className="text-xs text-muted-foreground"><span className="font-medium">Composição:</span> {analysisResult.style.composition}</p>}
                    {analysisResult.targetAudience && <p className="text-xs text-muted-foreground"><span className="font-medium">Público:</span> {analysisResult.targetAudience}</p>}
                    {analysisResult.contentType && <Badge variant="outline" className="text-xs">{analysisResult.contentType}</Badge>}
                  </CardContent>
                </Card>
              )}
              {knowledge.length > 0 && (
                <div className="space-y-1">
                  <Label className="text-xs flex items-center gap-1"><BookOpen className="w-3 h-3" /> Base de Conhecimento</Label>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {knowledge.slice(0, 5).map(k => (
                      <div key={k.id} className="text-xs p-2 rounded-sm bg-muted">
                        <span className="font-medium">{k.title}:</span> <span className="text-muted-foreground">{k.content.slice(0, 100)}...</span>
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
              <div className="border-2 border-dashed border-border rounded-md p-8 flex flex-col items-center gap-2">
                <Image className="w-8 h-8 text-muted-foreground" />
                <p className="text-xs text-muted-foreground text-center">Gere uma imagem com IA ou faça upload</p>
              </div>
            )}
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Prompt de Imagem</Label>
            <Textarea
              value={form.imagePrompt || ""}
              onChange={(e) => updateField("imagePrompt", e.target.value)}
              placeholder="Descreva a imagem que quer gerar (em inglês para melhores resultados)..."
              rows={4}
              className="resize-none"
              data-testid="input-image-prompt"
            />
          </div>
          <Button onClick={handleGenerateImage} disabled={generatingImage || !form.imagePrompt} size="sm" className="w-full" data-testid="button-generate-image">
            {generatingImage ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Gerando Imagem...</> : <><Wand2 className="w-4 h-4 mr-1" /> Gerar Imagem com IA</>}
          </Button>

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
