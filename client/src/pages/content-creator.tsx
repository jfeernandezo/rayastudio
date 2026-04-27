import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation, useParams } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, Sparkles, Image, Loader2, Save, CheckCircle, Wand2, RefreshCw,
  BookOpen, Zap, ImageIcon, Layers, Palette, Download, AlertCircle, Link2, Send, Cpu
} from "lucide-react";
import type { Project, ContentPiece, Template, KnowledgeBase, Prompt, AgentProfile, ProductionPackage } from "@shared/schema";

const statusOptions = [
  { value: "draft",     label: "À Fazer" },
  { value: "review",    label: "Em Revisão" },
  { value: "approved",  label: "Aprovado" },
  { value: "scheduled", label: "Agendado" },
  { value: "published", label: "Publicado" },
];

const PLATFORM_SIZES: Record<string, { label: string; width: number; height: number }[]> = {
  instagram: [
    { label: "Post Quadrado (1080×1080)", width: 1080, height: 1080 },
    { label: "Story / Reels (1080×1920)", width: 1080, height: 1920 },
    { label: "Carrossel (1080×1080)",     width: 1080, height: 1080 },
    { label: "Landscape (1080×566)",      width: 1080, height: 566 },
  ],
  linkedin: [
    { label: "Post Landscape (1200×627)", width: 1200, height: 627 },
    { label: "Post Quadrado (1080×1080)", width: 1080, height: 1080 },
    { label: "Banner (1128×191)",         width: 1128, height: 191 },
  ],
};

function downloadImage(src: string, format: "png" | "jpg", width: number, height: number, filename: string) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  const img = document.createElement("img");
  img.crossOrigin = "anonymous";
  img.onload = () => {
    const scale = Math.min(width / img.naturalWidth, height / img.naturalHeight);
    const sw = img.naturalWidth * scale;
    const sh = img.naturalHeight * scale;
    const sx = (width - sw) / 2;
    const sy = (height - sh) / 2;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, sx, sy, sw, sh);
    const mime = format === "jpg" ? "image/jpeg" : "image/png";
    const quality = format === "jpg" ? 0.92 : 1.0;
    const dataUrl = canvas.toDataURL(mime, quality);
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `${filename}.${format === "jpg" ? "jpg" : "png"}`;
    a.click();
  };
  img.src = src;
}

export default function ContentCreator() {
  const { id, contentId } = useParams<{ id: string; contentId: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [aiTopic, setAiTopic] = useState("");
  const [aiTone, setAiTone] = useState("profissional e engajante");
  const [aiProvider, setAiProviderRaw] = useState(() => localStorage.getItem("raya_ai_provider") || "openai");
  const [aiModel, setAiModelRaw] = useState(() => localStorage.getItem("raya_ai_model") || "gpt-4.1");
  const setAiProvider = (v: string) => { localStorage.setItem("raya_ai_provider", v); setAiProviderRaw(v); };
  const setAiModel = (v: string) => { localStorage.setItem("raya_ai_model", v); setAiModelRaw(v); };
  const [imgProvider, setImgProviderRaw] = useState(() => localStorage.getItem("raya_img_provider") || "openai");
  const [imgModel, setImgModelRaw] = useState(() => localStorage.getItem("raya_img_model") || "gpt-image-1");
  const setImgProvider = (v: string) => { localStorage.setItem("raya_img_provider", v); setImgProviderRaw(v); };
  const setImgModel = (v: string) => { localStorage.setItem("raya_img_model", v); setImgModelRaw(v); };
  const [selectedTemplate, setSelectedTemplate] = useState<string>("none");
  const [selectedDesignAgent, setSelectedDesignAgent] = useState<string>("none");
  const [generatingCaption, setGeneratingCaption] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);

  const [form, setForm] = useState<Partial<ContentPiece>>({});
  const [saved, setSaved] = useState(false);

  const [exportFormat, setExportFormat] = useState<"png" | "jpg">("png");
  const [exportSizeIdx, setExportSizeIdx] = useState(0);

  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState("");

  const { data: project } = useQuery<Project>({ queryKey: ["/api/projects", id] });
  const { data: content, isLoading } = useQuery<ContentPiece>({
    queryKey: ["/api/content", contentId],
    enabled: !!contentId,
  });

  useEffect(() => {
    if (content) setForm(content);
  }, [content?.id]);

  const { data: aiModels = {} } = useQuery<Record<string, { id: string; name: string }[]>>({
    queryKey: ["/api/ai/models"],
    staleTime: 5 * 60 * 1000,
  });
  const availableProviders = Object.keys(aiModels).filter(p => p !== "gemini_image" && aiModels[p]?.length > 0);
  const modelsForProvider = aiModels[aiProvider] || [];
  const availableImageProviders: { id: string; label: string }[] = [
    { id: "openai", label: "OpenAI" },
    ...(aiModels.gemini_image?.length ? [{ id: "gemini", label: "Gemini" }] : []),
  ];
  const imageModelsForProvider =
    imgProvider === "gemini"
      ? (aiModels.gemini_image || [{ id: "gemini-2.0-flash-preview-image-generation", name: "Gemini 2.0 Flash Preview" }])
      : [{ id: "gpt-image-1", name: "gpt-image-1" }];

  const { data: templates = [] } = useQuery<Template[]>({ queryKey: ["/api/templates"] });
  const { data: knowledge = [] } = useQuery<KnowledgeBase[]>({
    queryKey: ["/api/knowledge", "project", id],
    queryFn: async () => {
      const res = await fetch(`/api/knowledge?projectId=${id}`, { credentials: "include" });
      return res.json();
    },
  });
  const { data: prompts = [] } = useQuery<Prompt[]>({ queryKey: ["/api/prompts"] });
  const { data: agentProfiles = [] } = useQuery<AgentProfile[]>({ queryKey: ["/api/agent-profiles"] });

  const designAgents = agentProfiles.filter(a => a.agentType === "criacao");
  const selectedDesignAgentObj = designAgents.find(a => a.id === Number(selectedDesignAgent));
  const selectedTemplateObj = templates.find(t => t.id === Number(selectedTemplate));
  const templateSlideCount = (selectedTemplateObj as any)?.slideCount as number | null | undefined;
  const productionPackage = (form as any).productionPackage as ProductionPackage | null | undefined;

  const platform = form.platform || "instagram";
  const platformSizes = PLATFORM_SIZES[platform] || PLATFORM_SIZES.instagram;
  const exportSize = platformSizes[Math.min(exportSizeIdx, platformSizes.length - 1)];

  const saveMutation = useMutation<ContentPiece, Error, Partial<ContentPiece> | undefined>({
    mutationFn: async (overrides) => {
      const payload = {
        projectId: Number(id),
        title: form.title?.trim() || "Sem título",
        platform: form.platform || "instagram",
        format: form.format || "post",
        status: form.status || "draft",
        ...form,
        ...overrides,
      };
      const res = await apiRequest(
        contentId ? "PATCH" : "POST",
        contentId ? `/api/content/${contentId}` : "/api/content",
        payload,
      );
      return res.json() as Promise<ContentPiece>;
    },
    onSuccess: (savedContent) => {
      queryClient.invalidateQueries({ queryKey: ["/api/content"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", id] });
      if (!contentId) {
        navigate(`/projects/${id}/content/${savedContent.id}`);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
    onError: () => toast({ title: "Erro ao salvar", variant: "destructive" }),
  });

  const shareMutation = useMutation({
    mutationFn: async (targetContentId?: number) => {
      const shareContentId = targetContentId ?? Number(contentId);
      if (!shareContentId) throw new Error("Conteúdo ainda não foi salvo");
      const res = await fetch(`/api/content/${shareContentId}/share`, { method: "POST" });
      if (!res.ok) throw new Error("Erro");
      return res.json() as Promise<{ token: string }>;
    },
    onSuccess: ({ token }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/content"] });
      const url = `${window.location.origin}/approve/${token}`;
      setShareUrl(url);
    },
    onError: () => toast({ title: "Erro ao gerar link", variant: "destructive" }),
  });

  const handleSaveAndReview = async () => {
    const savedContent = await saveMutation.mutateAsync({ status: "review" });
    setForm(prev => ({ ...prev, status: "review" }));
    await shareMutation.mutateAsync(savedContent.id);
    setShareDialogOpen(true);
  };

  const updateField = (field: keyof ContentPiece, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const applyProductionPackage = (data: ProductionPackage) => {
    setForm(prev => ({
      ...prev,
      productionPackage: data,
      briefing: aiTopic || (prev as any).briefing || prev.title || "",
      title: prev.title || data.mainTitle || "Conteúdo sem título",
      caption: data.caption || prev.caption,
      hashtags: data.hashtags || prev.hashtags,
      imagePrompt: data.imagePrompt || prev.imagePrompt,
      visualDirection: data.visualDirection || (prev as any).visualDirection,
      reviewChecklist: data.reviewChecklist || (prev as any).reviewChecklist,
    } as Partial<ContentPiece>));
  };

  const handleTemplateChange = (value: string) => {
    setSelectedTemplate(value);
    const tmpl = templates.find(t => t.id === Number(value));
    if (tmpl?.promptTemplate) updateField("imagePrompt", tmpl.promptTemplate);
    if (tmpl?.format && tmpl.format !== "any") updateField("format", tmpl.format);
  };

  const handleGenerateCaption = async () => {
    setGeneratingCaption(true);
    try {
      const template = selectedTemplateObj;
      const knowledgeContext = knowledge.map(k => `${k.title}: ${k.content}`).join("\n");
      const isCarousel = (form.format === "carrossel") || (template?.format === "carrossel");
      const slideCount = templateSlideCount;
      const res = await fetch("/api/ai/content-package", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectContext: `${project?.name}. ${project?.instructions || ""}. ${project?.description || ""}`,
          platform: form.platform,
          format: form.format,
          template: template?.captionTemplate,
          topic: aiTopic || form.title,
          briefing: aiTopic || (form as any).briefing || form.notes || form.title,
          tone: aiTone,
          knowledgeContext,
          provider: aiProvider,
          model: aiModel,
          designBrief: (project as any)?.designBrief,
          designAgent: selectedDesignAgentObj,
          ...(isCarousel && slideCount ? { carouselSlides: slideCount } : {}),
        }),
      });
      const data = await res.json();
      applyProductionPackage(data);
      toast({ title: "Pacote de conteúdo gerado!" });
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
      const designAgent = selectedDesignAgentObj;
      const res = await fetch("/api/ai/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: form.imagePrompt,
          platform: form.platform,
          format: form.format,
          brandColors: (project as any)?.brandColors,
          designBrief: (project as any)?.designBrief,
          provider: imgProvider,
          model: imgModel,
          designAgent: designAgent ? {
            visualMood: designAgent.visualMood,
            colorApproach: designAgent.colorApproach,
            typographyStyle: designAgent.typographyStyle,
            layoutPreferences: designAgent.layoutPreferences,
            graphicElements: designAgent.graphicElements,
            extractedVisualStyle: designAgent.extractedVisualStyle,
            restrictions: designAgent.restrictions,
            referencePersonas: designAgent.referencePersonas,
          } : null,
        }),
      });
      const data = await res.json();
      if (data.url) {
        updateField("imageUrl", data.url);
        toast({ title: "Imagem gerada!" });
      } else if (data.error) {
        throw new Error(data.error);
      }
    } catch (e) {
      toast({ title: "Erro ao gerar imagem", variant: "destructive" });
    } finally {
      setGeneratingImage(false);
    }
  };

  const handleGenerateComplete = async () => {
    setGeneratingCaption(true);
    try {
      const template = selectedTemplateObj;
      const knowledgeContext = knowledge.map(k => `${k.title}: ${k.content}`).join("\n");
      const isCarousel = (form.format === "carrossel") || (template?.format === "carrossel");
      const slideCount = templateSlideCount;
      const captionRes = await fetch("/api/ai/content-package", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectContext: `${project?.name}. ${project?.instructions || ""}. ${project?.description || ""}`,
          platform: form.platform,
            format: form.format,
            template: template?.captionTemplate,
            topic: aiTopic || form.title,
            briefing: aiTopic || (form as any).briefing || form.notes || form.title,
            tone: aiTone,
            knowledgeContext,
            provider: aiProvider,
            model: aiModel,
            designBrief: (project as any)?.designBrief,
            designAgent: selectedDesignAgentObj,
            ...(isCarousel && slideCount ? { carouselSlides: slideCount } : {}),
          }),
        });
      const captionData = await captionRes.json();
      applyProductionPackage(captionData);

      const imagePromptToUse = form.imagePrompt || captionData.imagePrompt;
      setGeneratingCaption(false);

      if (imagePromptToUse) {
        setGeneratingImage(true);
        try {
          const designAgent = selectedDesignAgentObj;
          const imageRes = await fetch("/api/ai/image", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              prompt: imagePromptToUse,
              platform: form.platform,
              format: form.format,
              brandColors: (project as any)?.brandColors,
              designBrief: (project as any)?.designBrief,
              provider: imgProvider,
              model: imgModel,
              designAgent: designAgent ? {
                visualMood: designAgent.visualMood,
                colorApproach: designAgent.colorApproach,
                typographyStyle: designAgent.typographyStyle,
                layoutPreferences: designAgent.layoutPreferences,
                graphicElements: designAgent.graphicElements,
                extractedVisualStyle: designAgent.extractedVisualStyle,
                restrictions: designAgent.restrictions,
                referencePersonas: designAgent.referencePersonas,
              } : null,
            }),
          });
          const imageData = await imageRes.json();
          if (imageData.url) {
            updateField("imageUrl", imageData.url);
            toast({ title: "Publicação gerada!", description: "Legenda e imagem criadas com sucesso." });
          } else if (imageData.error) {
            toast({ title: "Legenda gerada", description: `Imagem falhou: ${imageData.error}`, variant: "destructive" });
          }
        } catch {
          toast({ title: "Legenda gerada", description: "Erro ao gerar imagem — tente na aba Imagem.", variant: "destructive" });
        } finally {
          setGeneratingImage(false);
        }
      } else {
        toast({ title: "Legenda gerada!", description: "A IA não retornou prompt de imagem — adicione um manualmente se necessário." });
      }
    } catch (e) {
      toast({ title: "Erro ao gerar publicação", variant: "destructive" });
      setGeneratingCaption(false);
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

  const hasRevision = !!content?.approvalComment && content?.status === "review";

  return (
    <div className="page-shell space-y-5">

      {/* ── Revision request banner ── */}
      {hasRevision && (
        <div className="flex items-start gap-3 p-4 rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/15 animate-slide-up"
          data-testid="revision-comment-banner"
        >
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Alteração solicitada pelo cliente</p>
            <p className="text-sm text-amber-700 dark:text-amber-400 mt-0.5 whitespace-pre-wrap">{content.approvalComment}</p>
          </div>
        </div>
      )}

      {/* ── Header row ── */}
      <div className="app-surface rounded-2xl p-4">
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
          <SelectTrigger className="w-36 h-8" data-testid="select-status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>

        {/* Save and send for review */}
        {(contentId || saved) && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleSaveAndReview}
            disabled={saveMutation.isPending || shareMutation.isPending}
            data-testid="button-save-and-review"
            title="Salvar e enviar para aprovação do cliente"
            className="gap-1.5"
          >
            {(saveMutation.isPending || shareMutation.isPending)
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Send className="w-4 h-4" />
            }
            <span className="hidden sm:inline">Enviar para Revisão</span>
          </Button>
        )}

        <Button
          size="sm"
          onClick={() => saveMutation.mutate(undefined)}
          disabled={saveMutation.isPending}
          data-testid="button-save-content"
        >
          {saved
            ? <><CheckCircle className="w-4 h-4 mr-1" /> Salvo</>
            : saveMutation.isPending
              ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Salvando</>
              : <><Save className="w-4 h-4 mr-1" /> Salvar</>
          }
        </Button>
      </div>

      <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-2">
        {[
          { label: "Briefing", active: !!((form as any).briefing || aiTopic) },
          { label: "Estrutura", active: !!productionPackage?.slides?.length },
          { label: "Copy", active: !!form.caption },
          { label: "Visual", active: !!((form as any).visualDirection || form.imagePrompt) },
          { label: "Aprovação", active: form.status === "review" || form.status === "approved" },
        ].map((step, index) => (
          <div key={step.label} className="workflow-step rounded-xl border bg-background/65 px-3 py-2" data-active={step.active}>
            <span className="workflow-step-dot">{index + 1}</span>
            <span className="text-xs font-medium truncate">{step.label}</span>
          </div>
        ))}
      </div>
      </div>

      {/* ── Platform / Format row ── */}
      <div className="grid md:grid-cols-2 gap-2 text-sm rounded-2xl border bg-card p-3">
        <div className="flex items-center gap-2">
          <Label className="text-xs w-20 shrink-0">Plataforma</Label>
          <Select value={form.platform || "instagram"} onValueChange={(v) => { updateField("platform", v); setExportSizeIdx(0); }}>
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

      <div className="grid md:grid-cols-[1.05fr_0.95fr] gap-6">
        {/* ── LEFT: Caption / AI ── */}
        <div className="space-y-4">
          <Tabs defaultValue="briefing">
            <TabsList className="w-full grid grid-cols-5 h-auto rounded-xl bg-muted/70 p-1">
              <TabsTrigger value="briefing">Briefing</TabsTrigger>
              <TabsTrigger value="structure">Estrutura</TabsTrigger>
              <TabsTrigger value="caption">Copy</TabsTrigger>
              <TabsTrigger value="visual">Visual</TabsTrigger>
              <TabsTrigger value="ai">IA</TabsTrigger>
            </TabsList>

            <TabsContent value="briefing" className="space-y-3 mt-3">
              <div className="space-y-1">
                <Label className="text-xs">Briefing da demanda</Label>
                <Textarea
                  value={(form as any).briefing || aiTopic || ""}
                  onChange={(e) => {
                    updateField("briefing" as keyof ContentPiece, e.target.value);
                    setAiTopic(e.target.value);
                  }}
                  placeholder="Tema, objetivo, público, promessa, oferta, referências, restrições e qualquer informação obrigatória."
                  rows={8}
                  className="resize-none"
                  data-testid="input-production-briefing"
                />
              </div>
              {productionPackage?.diagnosis && (
                <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
                  <div>
                    <p className="text-xs font-semibold text-foreground">Diagnóstico</p>
                    <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">{productionPackage.diagnosis}</p>
                  </div>
                  {productionPackage.recommendedAngle && (
                    <div>
                      <p className="text-xs font-semibold text-foreground">Ângulo recomendado</p>
                      <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">{productionPackage.recommendedAngle}</p>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="structure" className="space-y-3 mt-3">
              {productionPackage?.slides?.length ? (
                <div className="space-y-2">
                  {productionPackage.slides.map((slide) => (
                    <div key={slide.number} className="rounded-lg border bg-card p-3 space-y-1" data-testid={`slide-structure-${slide.number}`}>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-primary/10 text-primary">Slide {slide.number}</span>
                        <span className="text-[11px] text-muted-foreground">{slide.role}</span>
                      </div>
                      <Input
                        value={slide.headline || ""}
                        onChange={(e) => {
                          const next = productionPackage.slides?.map(s => s.number === slide.number ? { ...s, headline: e.target.value } : s) || [];
                          updateField("productionPackage" as keyof ContentPiece, { ...productionPackage, slides: next });
                        }}
                        className="h-8 text-xs font-semibold"
                      />
                      <Textarea
                        value={slide.body || ""}
                        onChange={(e) => {
                          const next = productionPackage.slides?.map(s => s.number === slide.number ? { ...s, body: e.target.value } : s) || [];
                          updateField("productionPackage" as keyof ContentPiece, { ...productionPackage, slides: next });
                        }}
                        rows={2}
                        className="resize-none text-xs"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border border-dashed rounded-xl p-6 text-center">
                  <Layers className="w-7 h-7 text-muted-foreground mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">Gere o pacote com IA para receber a estrutura slide a slide.</p>
                </div>
              )}
            </TabsContent>

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

            <TabsContent value="visual" className="space-y-3 mt-3">
              <div className="space-y-1">
                <Label className="text-xs">Direção visual geral</Label>
                <Textarea
                  value={(form as any).visualDirection || productionPackage?.visualDirection || ""}
                  onChange={(e) => updateField("visualDirection" as keyof ContentPiece, e.target.value)}
                  placeholder="Layout, hierarquia, paleta, tipografia, imagem, composição e restrições para o designer."
                  rows={5}
                  className="resize-none"
                  data-testid="input-visual-direction"
                />
              </div>
              {productionPackage?.slides?.length && (
                <div className="space-y-2">
                  <Label className="text-xs">Direção por slide</Label>
                  {productionPackage.slides.map((slide) => (
                    <div key={slide.number} className="rounded-lg border bg-muted/20 p-2">
                      <p className="text-[11px] font-semibold text-foreground mb-1">Slide {slide.number}</p>
                      <Textarea
                        value={slide.visualDirection || ""}
                        onChange={(e) => {
                          const next = productionPackage.slides?.map(s => s.number === slide.number ? { ...s, visualDirection: e.target.value } : s) || [];
                          updateField("productionPackage" as keyof ContentPiece, { ...productionPackage, slides: next });
                        }}
                        rows={2}
                        className="resize-none text-xs"
                      />
                    </div>
                  ))}
                </div>
              )}
              <div className="space-y-1">
                <Label className="text-xs">Checklist de revisão</Label>
                <Textarea
                  value={((form as any).reviewChecklist || productionPackage?.reviewChecklist || []).join("\n")}
                  onChange={(e) => updateField("reviewChecklist" as keyof ContentPiece, e.target.value.split("\n").filter(Boolean))}
                  placeholder="Um item por linha."
                  rows={5}
                  className="resize-none"
                  data-testid="input-review-checklist"
                />
              </div>
            </TabsContent>

            <TabsContent value="ai" className="space-y-3 mt-3">
              {/* AI Model Selector */}
              <div className="rounded-lg border border-border bg-muted/30 p-2.5 space-y-1.5">
                <Label className="text-xs flex items-center gap-1 text-muted-foreground">
                  <Cpu className="w-3 h-3" /> Modelo de IA
                </Label>
                <div className="flex gap-2">
                  <Select
                    value={aiProvider}
                    onValueChange={(v) => {
                      setAiProvider(v);
                      const firstModel = aiModels[v]?.[0]?.id;
                      if (firstModel) setAiModel(firstModel);
                    }}
                  >
                    <SelectTrigger className="h-7 text-xs w-28 shrink-0" data-testid="select-ai-provider">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableProviders.length > 0 ? (
                        availableProviders.map(p => (
                          <SelectItem key={p} value={p}>
                            {p === "openai" ? "OpenAI" : p === "anthropic" ? "Anthropic" : "Gemini"}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="openai">OpenAI</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <Select value={aiModel} onValueChange={setAiModel}>
                    <SelectTrigger className="h-7 text-xs flex-1" data-testid="select-ai-model">
                      <SelectValue placeholder="Selecionar modelo..." />
                    </SelectTrigger>
                    <SelectContent>
                      {modelsForProvider.length > 0 ? (
                        modelsForProvider.map(m => (
                          <SelectItem key={m.id} value={m.id}>{m.id}</SelectItem>
                        ))
                      ) : (
                        <SelectItem value={aiModel}>{aiModel}</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

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
                {selectedTemplateObj && (selectedTemplateObj.referenceImageUrl || selectedTemplateObj.promptTemplate || templateSlideCount) && (
                  <div className="flex items-start gap-2 p-2 rounded-md border border-primary/20 bg-primary/5 mt-1">
                    {selectedTemplateObj.referenceImageUrl && (
                      <div className="relative shrink-0">
                        <img src={selectedTemplateObj.referenceImageUrl} alt="Referência visual" className="w-12 h-12 object-cover rounded-sm" />
                        {templateSlideCount && (
                          <span className="absolute -bottom-1 -right-1 text-[9px] font-bold bg-primary text-primary-foreground px-1 rounded-full">{templateSlideCount}</span>
                        )}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-xs font-medium text-primary flex items-center gap-1">
                          <ImageIcon className="w-3 h-3" /> Referência visual carregada
                        </p>
                        {templateSlideCount && (
                          <span className="inline-flex items-center gap-1 text-xs text-primary font-medium">
                            <Layers className="w-3 h-3" /> {templateSlideCount} slides
                          </span>
                        )}
                      </div>
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

              {/* Primary: Generate complete publication */}
              <Button
                onClick={handleGenerateComplete}
                disabled={generatingCaption || generatingImage}
                size="sm"
                className="w-full"
                data-testid="button-generate-complete"
              >
                {generatingCaption
                  ? <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Gerando legenda...</>
                  : generatingImage
                  ? <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Gerando imagem...</>
                  : <><Zap className="w-4 h-4 mr-1.5" /> Gerar Publicação Completa</>
                }
              </Button>

              {/* Secondary: individual controls */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
                <div className="relative flex justify-center"><span className="bg-background px-2 text-xs text-muted-foreground">ou gerar separadamente</span></div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button onClick={handleGenerateCaption} disabled={generatingCaption || generatingImage} size="sm" variant="outline" data-testid="button-generate-caption">
                  {generatingCaption ? <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Gerando...</> : <><Sparkles className="w-3 h-3 mr-1" /> Só legenda</>}
                </Button>
                <Button onClick={() => {
                  const imagePromptToUse = form.imagePrompt;
                  if (!imagePromptToUse) { toast({ title: "Preencha o prompt de imagem", variant: "destructive" }); return; }
                  handleGenerateImage();
                }} disabled={generatingCaption || generatingImage || !form.imagePrompt} size="sm" variant="outline" data-testid="button-generate-image-only">
                  {generatingImage ? <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Gerando...</> : <><Wand2 className="w-3 h-3 mr-1" /> Só imagem</>}
                </Button>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
                <div className="relative flex justify-center"><span className="bg-background px-2 text-xs text-muted-foreground">imagem</span></div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Agente de Design</Label>
                <Select value={selectedDesignAgent} onValueChange={setSelectedDesignAgent}>
                  <SelectTrigger className="h-8" data-testid="select-design-agent">
                    <SelectValue placeholder="Sem agente — usar briefing do projeto" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem agente — usar briefing do projeto</SelectItem>
                    {designAgents.map(a => (
                      <SelectItem key={a.id} value={String(a.id)}>{a.name}{a.description ? ` — ${a.description}` : ""}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedDesignAgentObj && (
                  <div className="flex items-start gap-2 p-2 rounded-md border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/10 mt-1">
                    <Palette className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-amber-700 dark:text-amber-400">{selectedDesignAgentObj.name}</p>
                      {selectedDesignAgentObj.visualMood && <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{selectedDesignAgentObj.visualMood}</p>}
                      {selectedDesignAgentObj.extractedVisualStyle && <p className="text-xs text-amber-600 dark:text-amber-500 mt-0.5">✓ Estilo extraído de referências reais</p>}
                    </div>
                  </div>
                )}
                {designAgents.length === 0 && (
                  <p className="text-xs text-muted-foreground">Nenhum agente de design cadastrado. <a href="/agents" className="text-primary underline">Criar agente</a></p>
                )}
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Prompt de Imagem</Label>
                <Textarea
                  value={form.imagePrompt || ""}
                  onChange={(e) => updateField("imagePrompt", e.target.value)}
                  placeholder={selectedTemplateObj?.promptTemplate ? "Prompt carregado do template — edite se necessário..." : "Descreva a imagem que quer gerar..."}
                  rows={3}
                  className="resize-none"
                  data-testid="input-image-prompt"
                />
              </div>

              {/* Image provider/model selector */}
              <div className="rounded-lg border border-border bg-muted/30 p-2.5 space-y-1.5">
                <Label className="text-xs flex items-center gap-1 text-muted-foreground">
                  <Cpu className="w-3 h-3" /> Modelo de Geração de Imagem
                </Label>
                <div className="flex gap-2">
                  <Select
                    value={imgProvider}
                    onValueChange={(v) => {
                      setImgProvider(v);
                      const firstModel = v === "gemini"
                        ? (aiModels.gemini_image?.[0]?.id || "gemini-2.0-flash-preview-image-generation")
                        : "gpt-image-1";
                      setImgModel(firstModel);
                    }}
                  >
                    <SelectTrigger className="h-7 text-xs w-24 shrink-0" data-testid="select-img-provider">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableImageProviders.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={imgModel} onValueChange={setImgModel}>
                    <SelectTrigger className="h-7 text-xs flex-1 font-mono" data-testid="select-img-model">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {imageModelsForProvider.map(m => (
                        <SelectItem key={m.id} value={m.id}>{m.id}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {imgProvider === "gemini" && !aiModels.gemini_image?.length && (
                  <p className="text-[11px] text-amber-600 dark:text-amber-400">
                    Configure a chave Gemini em Configurações → IA para habilitar.
                  </p>
                )}
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

        {/* ── RIGHT: Image + Export ── */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs">Imagem</Label>
            {form.imageUrl ? (
              <div className="space-y-3">
                <div className="relative rounded-xl overflow-hidden border border-border shadow-xs">
                  <img src={form.imageUrl} alt="Gerada" className="w-full object-cover" style={{ maxHeight: "320px" }} />
                  <div className="absolute top-2 right-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs bg-background/90 backdrop-blur-sm"
                      onClick={handleGenerateImage}
                      disabled={generatingImage}
                      data-testid="button-regenerate-image"
                    >
                      <RefreshCw className="w-3 h-3 mr-1" /> Refazer
                    </Button>
                  </div>
                </div>

                {/* ── Export panel ── */}
                <div className="rounded-xl border border-border bg-muted/30 p-3 space-y-3" data-testid="export-panel">
                  <p className="text-xs font-semibold text-foreground">Exportar imagem</p>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground">Formato</Label>
                      <div className="flex gap-1">
                        {(["png", "jpg"] as const).map(f => (
                          <button
                            key={f}
                            onClick={() => setExportFormat(f)}
                            className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-medium border transition-colors
                              ${exportFormat === f
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border text-muted-foreground hover:border-muted-foreground"
                              }`}
                            data-testid={`button-format-${f}`}
                          >
                            {f.toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground">Tamanho</Label>
                      <Select
                        value={String(exportSizeIdx)}
                        onValueChange={(v) => setExportSizeIdx(Number(v))}
                      >
                        <SelectTrigger className="h-8 text-[11px]" data-testid="select-export-size">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {platformSizes.map((s, i) => (
                            <SelectItem key={i} value={String(i)}>{s.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-[11px] text-muted-foreground">
                      {exportSize.width}×{exportSize.height}px · {exportFormat.toUpperCase()}
                    </p>
                    <Button
                      size="sm"
                      className="h-8 text-xs gap-1.5"
                      onClick={() => downloadImage(
                        form.imageUrl!,
                        exportFormat,
                        exportSize.width,
                        exportSize.height,
                        (form.title || "post").toLowerCase().replace(/\s+/g, "-").slice(0, 40)
                      )}
                      data-testid="button-download-image"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Baixar
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div
                className="border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center gap-2 cursor-pointer hover-elevate"
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

      {/* ── Share dialog ── */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Link de aprovação gerado</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              O conteúdo foi movido para <span className="font-medium text-amber-600">Em Revisão</span>. Compartilhe o link abaixo com o cliente para aprovação.
            </p>
            <div className="flex gap-2">
              <Input
                value={shareUrl}
                readOnly
                className="flex-1 text-xs font-mono h-9"
                data-testid="input-share-url"
              />
              <Button
                size="sm"
                className="h-9 shrink-0"
                onClick={() => {
                  navigator.clipboard.writeText(shareUrl);
                  toast({ title: "Link copiado!" });
                }}
                data-testid="button-copy-share-url"
              >
                <Link2 className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              O cliente poderá aprovar ou solicitar alterações neste link. Você será notificado no sistema.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
