import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Bot, Plus, Pencil, Trash2, X, Target, Mic, Users, ShieldAlert,
  Sparkles, BookOpen, Palette, ImageIcon, Loader2, Upload, Eye
} from "lucide-react";
import type { AgentProfile } from "@shared/schema";

const TONE_OPTIONS = [
  "conversacional", "autoridade suave", "íntimo", "didático", "energético",
  "provocador", "inspirador", "analítico", "acolhedor", "sofisticado",
  "descontraído", "reflexivo", "direto", "empático", "visionário",
];

const FRAMEWORK_OPTIONS = [
  "AIDA (Atenção, Interesse, Desejo, Ação)",
  "PAS (Problema, Agitação, Solução)",
  "FOREST (Foco, Obstáculo, Resolução, Emoção, Stakes, Transformação)",
  "Jornada do Herói para Branding",
  "Tema & Verdade Universal",
  "Anatomia do Reel (Hook → Desenvolvimento → CTA)",
  "Contrarian Take (posição contrária ao óbvio)",
  "Storytelling Vulnerável + Aprendizado",
  "Funil de Consciência (Topo → Meio → Fundo)",
  "Antes e Depois (Transformação)",
];

const OBJECTIVE_OPTIONS = [
  { value: "educar", label: "Educar — gerar valor e autoridade" },
  { value: "vender", label: "Vender — conversão e oferta" },
  { value: "inspirar", label: "Inspirar — motivação e aspiração" },
  { value: "conectar", label: "Conectar — humanização e comunidade" },
  { value: "posicionar", label: "Posicionar — diferenciação de marca" },
  { value: "engajar", label: "Engajar — comentários e interação" },
];

const DEPTH_OPTIONS = [
  { value: "rápido", label: "Rápido — conteúdo direto, sem aprofundamento" },
  { value: "intermediário", label: "Intermediário — equilibra leveza e substância" },
  { value: "profundo", label: "Profundo — reflexivo, denso, educativo" },
];

function TagInput({ value, onChange, placeholder, options }: {
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
  options?: string[];
}) {
  const [input, setInput] = useState("");
  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !value.includes(trimmed)) onChange([...value, trimmed]);
    setInput("");
  };
  return (
    <div className="space-y-2">
      {options && (
        <div className="flex flex-wrap gap-1.5">
          {options.map(opt => {
            const active = value.includes(opt);
            return (
              <button key={opt} type="button"
                onClick={() => active ? onChange(value.filter(v => v !== opt)) : addTag(opt)}
                className={`text-xs px-2 py-1 rounded-full border transition-colors ${active ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary hover:text-primary"}`}>
                {opt}
              </button>
            );
          })}
        </div>
      )}
      <div className="flex gap-2">
        <Input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addTag(input); } }}
          placeholder={placeholder || "Adicionar e pressionar Enter..."} className="h-8 text-xs" />
        <Button type="button" size="sm" variant="outline" className="h-8 shrink-0" onClick={() => addTag(input)}>
          <Plus className="w-3 h-3" />
        </Button>
      </div>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {value.map(v => (
            <Badge key={v} variant="secondary" className="text-xs gap-1 pr-1">
              {v}
              <button type="button" onClick={() => onChange(value.filter(x => x !== v))}>
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

const emptyForm = {
  agentType: "estrategia" as "estrategia" | "criacao",
  name: "",
  description: "",
  personaDescription: "",
  referencePersonas: "",
  toneCharacteristics: [] as string[],
  voiceRegister: "",
  deliveryDepth: "intermediário",
  contentObjectives: [] as string[],
  contentPillars: [] as string[],
  preferredFrameworks: [] as string[],
  targetAudience: "",
  audiencePains: "",
  audienceDreams: "",
  restrictions: [] as string[],
  forbiddenWords: [] as string[],
  hookStyle: "",
  ctaStyle: "",
  visualMood: "",
  colorApproach: "",
  typographyStyle: "",
  layoutPreferences: "",
  graphicElements: "",
  referenceImages: [] as string[],
  extractedVisualStyle: "",
  isGlobal: true,
  projectId: null as number | null,
};
type AgentForm = typeof emptyForm;

export default function AgentProfiles() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<AgentForm>(emptyForm);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [extractingStyle, setExtractingStyle] = useState<number | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const { data: agents = [], isLoading } = useQuery<AgentProfile[]>({ queryKey: ["/api/agent-profiles"] });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editingId) return apiRequest("PATCH", `/api/agent-profiles/${editingId}`, form);
      return apiRequest("POST", "/api/agent-profiles", form);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agent-profiles"] });
      setDialogOpen(false); setEditingId(null); setForm(emptyForm);
      toast({ title: editingId ? "Agente atualizado!" : "Agente criado!" });
    },
    onError: () => toast({ title: "Erro ao salvar agente", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/agent-profiles/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/agent-profiles"] }); setDeleteId(null); toast({ title: "Agente excluído" }); },
    onError: () => toast({ title: "Erro ao excluir", variant: "destructive" }),
  });

  const openCreate = () => { setEditingId(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (agent: AgentProfile) => {
    setEditingId(agent.id);
    setForm({
      agentType: (agent.agentType as "estrategia" | "criacao") || "estrategia",
      name: agent.name, description: agent.description || "",
      personaDescription: agent.personaDescription || "",
      referencePersonas: agent.referencePersonas || "",
      toneCharacteristics: (agent.toneCharacteristics as string[]) || [],
      voiceRegister: agent.voiceRegister || "",
      deliveryDepth: agent.deliveryDepth || "intermediário",
      contentObjectives: (agent.contentObjectives as string[]) || [],
      contentPillars: (agent.contentPillars as string[]) || [],
      preferredFrameworks: (agent.preferredFrameworks as string[]) || [],
      targetAudience: agent.targetAudience || "",
      audiencePains: agent.audiencePains || "",
      audienceDreams: agent.audienceDreams || "",
      restrictions: (agent.restrictions as string[]) || [],
      forbiddenWords: (agent.forbiddenWords as string[]) || [],
      hookStyle: agent.hookStyle || "",
      ctaStyle: agent.ctaStyle || "",
      visualMood: agent.visualMood || "",
      colorApproach: agent.colorApproach || "",
      typographyStyle: agent.typographyStyle || "",
      layoutPreferences: agent.layoutPreferences || "",
      graphicElements: agent.graphicElements || "",
      referenceImages: (agent.referenceImages as string[]) || [],
      extractedVisualStyle: agent.extractedVisualStyle || "",
      isGlobal: agent.isGlobal ?? true,
      projectId: agent.projectId ?? null,
    });
    setDialogOpen(true);
  };

  const setField = <K extends keyof AgentForm>(key: K, value: AgentForm[K]) => setForm(prev => ({ ...prev, [key]: value }));

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => {
        const b64 = ev.target?.result as string;
        setField("referenceImages", [...form.referenceImages, b64]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const extractStyleFromImage = async (imageB64: string, idx: number) => {
    setExtractingStyle(idx);
    try {
      const res = await fetch("/api/ai/analyze-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: imageB64 }),
      });
      const data = await res.json();
      const style = data.style || {};
      const extracted = [
        data.description ? `Descrição: ${data.description}` : "",
        style.mood ? `Mood visual: ${style.mood}` : "",
        style.composition ? `Composição: ${style.composition}` : "",
        style.typography ? `Tipografia: ${style.typography}` : "",
        style.graphicElements ? `Elementos gráficos: ${style.graphicElements}` : "",
        style.colors?.length ? `Cores: ${style.colors.join(", ")}` : "",
        data.imagePromptToReplicate ? `Prompt de replicação: ${data.imagePromptToReplicate}` : "",
      ].filter(Boolean).join("\n");

      setField("extractedVisualStyle", form.extractedVisualStyle ? `${form.extractedVisualStyle}\n\n---\n${extracted}` : extracted);
      if (style.mood && !form.visualMood) setField("visualMood", style.mood);
      if (style.typography && !form.typographyStyle) setField("typographyStyle", style.typography);
      if (style.composition && !form.layoutPreferences) setField("layoutPreferences", style.composition);
      if (style.graphicElements && !form.graphicElements) setField("graphicElements", style.graphicElements);

      toast({ title: "Estilo extraído da imagem!" });
    } catch {
      toast({ title: "Erro ao analisar imagem", variant: "destructive" });
    } finally {
      setExtractingStyle(null);
    }
  };

  const strategyAgents = agents.filter(a => !a.agentType || a.agentType === "estrategia");
  const designAgents = agents.filter(a => a.agentType === "criacao");

  const AgentCard = ({ agent }: { agent: AgentProfile }) => {
    const isDesign = agent.agentType === "criacao";
    return (
      <Card className="hover-elevate" data-testid={`card-agent-${agent.id}`}>
        <CardHeader className="p-4 pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isDesign ? "bg-amber-100 dark:bg-amber-900/30" : "bg-primary/10"}`}>
                {isDesign ? <Palette className="w-4 h-4 text-amber-600 dark:text-amber-400" /> : <Bot className="w-4 h-4 text-primary" />}
              </div>
              <div>
                <CardTitle className="text-sm font-semibold">{agent.name}</CardTitle>
                {agent.description && <p className="text-xs text-muted-foreground">{agent.description}</p>}
              </div>
            </div>
            <div className="flex gap-1 shrink-0">
              <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => openEdit(agent)} data-testid={`button-edit-agent-${agent.id}`}>
                <Pencil className="w-3 h-3" />
              </Button>
              <Button variant="ghost" size="icon" className="w-7 h-7 text-destructive hover:text-destructive" onClick={() => setDeleteId(agent.id)} data-testid={`button-delete-agent-${agent.id}`}>
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0 space-y-2">
          {isDesign ? (
            <>
              {agent.visualMood && <p className="text-xs text-muted-foreground flex items-center gap-1"><Eye className="w-3 h-3 shrink-0" />{agent.visualMood}</p>}
              {(agent.referenceImages as string[])?.length > 0 && (
                <div className="flex gap-1 overflow-hidden">
                  {(agent.referenceImages as string[]).slice(0, 4).map((img, i) => (
                    <img key={i} src={img} alt="" className="w-10 h-10 object-cover rounded-sm border border-border" />
                  ))}
                  {(agent.referenceImages as string[]).length > 4 && (
                    <div className="w-10 h-10 rounded-sm bg-muted border border-border flex items-center justify-center text-xs text-muted-foreground">
                      +{(agent.referenceImages as string[]).length - 4}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <>
              {agent.referencePersonas && <p className="text-xs text-muted-foreground flex items-center gap-1"><Sparkles className="w-3 h-3 text-primary shrink-0" />Ref: {agent.referencePersonas}</p>}
              {(agent.toneCharacteristics as string[])?.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {(agent.toneCharacteristics as string[]).slice(0, 4).map(t => <Badge key={t} variant="outline" className="text-xs">{t}</Badge>)}
                  {(agent.toneCharacteristics as string[]).length > 4 && <Badge variant="outline" className="text-xs">+{(agent.toneCharacteristics as string[]).length - 4}</Badge>}
                </div>
              )}
            </>
          )}
          <div className="flex flex-wrap gap-2 pt-0.5">
            {isDesign ? (
              <>
                {agent.typographyStyle && <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">tipografia definida</span>}
                {agent.extractedVisualStyle && <span className="text-xs text-muted-foreground bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full">estilo extraído</span>}
              </>
            ) : (
              <>
                {agent.deliveryDepth && <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{agent.deliveryDepth}</span>}
                {(agent.preferredFrameworks as string[])?.length > 0 && <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{(agent.preferredFrameworks as string[]).length} frameworks</span>}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Agentes</h1>
          <p className="text-sm text-muted-foreground">Perfis de IA para estratégia de conteúdo e criação visual</p>
        </div>
        <Button size="sm" onClick={openCreate} data-testid="button-create-agent">
          <Plus className="w-4 h-4 mr-1" /> Novo Agente
        </Button>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => <Card key={i}><CardContent className="p-4 h-28 animate-pulse bg-muted/40 rounded-md" /></Card>)}
        </div>
      ) : agents.length === 0 ? (
        <Card>
          <CardContent className="py-16 flex flex-col items-center gap-3 text-center">
            <div className="flex gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center"><Bot className="w-6 h-6 text-primary" /></div>
              <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center"><Palette className="w-6 h-6 text-amber-600" /></div>
            </div>
            <div>
              <p className="font-medium text-foreground">Nenhum agente configurado</p>
              <p className="text-sm text-muted-foreground mt-1">Crie agentes de estratégia (copy e calendário) e de criação (estilo visual)</p>
            </div>
            <Button size="sm" onClick={openCreate}><Plus className="w-4 h-4 mr-1" /> Criar primeiro agente</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {strategyAgents.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-semibold text-foreground">Estratégia — Social Media</h2>
                <Badge variant="secondary" className="text-xs">{strategyAgents.length}</Badge>
              </div>
              <p className="text-xs text-muted-foreground -mt-1">Usados para gerar o calendário editorial, copy e briefing para o designer</p>
              <div className="grid md:grid-cols-2 gap-4">
                {strategyAgents.map(agent => <AgentCard key={agent.id} agent={agent} />)}
              </div>
            </div>
          )}

          {designAgents.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <h2 className="text-sm font-semibold text-foreground">Criação — Designer</h2>
                <Badge variant="secondary" className="text-xs">{designAgents.length}</Badge>
              </div>
              <p className="text-xs text-muted-foreground -mt-1">Usados para geração de artes e imagens, com estilo visual definido a partir de referências reais</p>
              <div className="grid md:grid-cols-2 gap-4">
                {designAgents.map(agent => <AgentCard key={agent.id} agent={agent} />)}
              </div>
            </div>
          )}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={v => { setDialogOpen(v); if (!v) { setEditingId(null); setForm(emptyForm); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Agente" : "Novo Agente"}</DialogTitle>
            <DialogDescription>Configure o perfil do agente que vai atuar na geração de conteúdo.</DialogDescription>
          </DialogHeader>

          <div className="mt-2 space-y-4">
            <div className="space-y-1.5">
              <Label>Tipo de Agente</Label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: "estrategia", label: "Estratégia — Social Media", icon: Bot, desc: "Copy, calendário, briefing" },
                  { value: "criacao", label: "Criação — Designer", icon: Palette, desc: "Estilo visual, artes, imagens" },
                ].map(opt => {
                  const Icon = opt.icon;
                  const active = form.agentType === opt.value;
                  return (
                    <button key={opt.value} type="button"
                      onClick={() => setField("agentType", opt.value as "estrategia" | "criacao")}
                      className={`flex items-start gap-3 p-3 rounded-lg border text-left transition-colors ${active ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground"}`}
                      data-testid={`select-agent-type-${opt.value}`}>
                      <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${active ? "text-primary" : "text-muted-foreground"}`} />
                      <div>
                        <p className={`text-xs font-semibold ${active ? "text-primary" : "text-foreground"}`}>{opt.label}</p>
                        <p className="text-xs text-muted-foreground">{opt.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {form.agentType === "estrategia" ? (
              <Tabs defaultValue="identidade">
                <TabsList className="grid grid-cols-5 h-8">
                  <TabsTrigger value="identidade" className="text-xs"><Bot className="w-3 h-3 mr-1 hidden sm:inline" />Identidade</TabsTrigger>
                  <TabsTrigger value="tom" className="text-xs"><Mic className="w-3 h-3 mr-1 hidden sm:inline" />Tom</TabsTrigger>
                  <TabsTrigger value="estrategia" className="text-xs"><Target className="w-3 h-3 mr-1 hidden sm:inline" />Estratégia</TabsTrigger>
                  <TabsTrigger value="publico" className="text-xs"><Users className="w-3 h-3 mr-1 hidden sm:inline" />Público</TabsTrigger>
                  <TabsTrigger value="restricoes" className="text-xs"><ShieldAlert className="w-3 h-3 mr-1 hidden sm:inline" />Regras</TabsTrigger>
                </TabsList>

                <TabsContent value="identidade" className="space-y-4 mt-4">
                  <div className="space-y-1.5">
                    <Label>Nome do Agente *</Label>
                    <Input value={form.name} onChange={e => setField("name", e.target.value)}
                      placeholder="Ex: Social Media Thay Dantas, Estrategista de Autoridade..." data-testid="input-agent-name" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Descrição curta</Label>
                    <Input value={form.description} onChange={e => setField("description", e.target.value)}
                      placeholder="Ex: Especialista em branding e conteúdo educativo" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Quem é esse profissional de social media?</Label>
                    <p className="text-xs text-muted-foreground">Descreva o perfil, experiência e especialidade do estrategista</p>
                    <Textarea value={form.personaDescription} onChange={e => setField("personaDescription", e.target.value)}
                      placeholder="Ex: Social media com 8 anos de experiência em marcas de lifestyle. Especialista em branding pessoal com foco em storytelling autêntico. Pensa estrategicamente antes de criar — sempre conecta conteúdo ao funil de vendas..."
                      rows={4} className="resize-none" data-testid="textarea-agent-persona" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Referências / Inspirações de estilo</Label>
                    <Input value={form.referencePersonas} onChange={e => setField("referencePersonas", e.target.value)}
                      placeholder="Ex: Thay Dantas (branding cozy), Hanah Franklin (Reels), Isabela Matte (autoridade autêntica)..."
                      data-testid="input-agent-references" />
                  </div>
                </TabsContent>

                <TabsContent value="tom" className="space-y-4 mt-4">
                  <div className="space-y-1.5">
                    <Label>Características do tom de voz</Label>
                    <TagInput value={form.toneCharacteristics} onChange={v => setField("toneCharacteristics", v)} options={TONE_OPTIONS} placeholder="Adicionar tom personalizado..." />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Registro de voz detalhado</Label>
                    <Textarea value={form.voiceRegister} onChange={e => setField("voiceRegister", e.target.value)}
                      placeholder="Ex: Fala como amiga que já trilhou o caminho. Mistura reflexão filosófica com linguagem coloquial. Usa gírias naturais sem exagero. Vulnerável nas histórias, sempre com aprendizado concreto..."
                      rows={4} className="resize-none" data-testid="textarea-agent-voice" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Nível de profundidade</Label>
                    <Select value={form.deliveryDepth} onValueChange={v => setField("deliveryDepth", v)}>
                      <SelectTrigger data-testid="select-agent-depth"><SelectValue /></SelectTrigger>
                      <SelectContent>{DEPTH_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Estilo de gancho (hook)</Label>
                      <Input value={form.hookStyle} onChange={e => setField("hookStyle", e.target.value)}
                        placeholder="Ex: perguntas provocadoras, números + promessa..." data-testid="input-agent-hook" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Estilo de CTA</Label>
                      <Input value={form.ctaStyle} onChange={e => setField("ctaStyle", e.target.value)}
                        placeholder="Ex: convite íntimo, salvar para depois..." data-testid="input-agent-cta" />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="estrategia" className="space-y-4 mt-4">
                  <div className="space-y-1.5">
                    <Label>Objetivos de conteúdo prioritários</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {OBJECTIVE_OPTIONS.map(o => {
                        const active = form.contentObjectives.includes(o.value);
                        return (
                          <button key={o.value} type="button"
                            onClick={() => setField("contentObjectives", active ? form.contentObjectives.filter(v => v !== o.value) : [...form.contentObjectives, o.value])}
                            className={`text-left text-xs px-3 py-2 rounded-md border transition-colors ${active ? "bg-primary/10 border-primary text-primary font-medium" : "border-border text-muted-foreground hover:border-muted-foreground"}`}
                            data-testid={`toggle-objective-${o.value}`}>{o.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Pilares de conteúdo</Label>
                    <TagInput value={form.contentPillars} onChange={v => setField("contentPillars", v)}
                      options={["autoridade", "educação", "humanização", "produto/serviço", "prova social", "bastidores", "inspiração", "engajamento", "comunidade", "case de sucesso"]}
                      placeholder="Adicionar pilar personalizado..." />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Frameworks de copy</Label>
                    <div className="space-y-1.5">
                      {FRAMEWORK_OPTIONS.map(fw => {
                        const active = form.preferredFrameworks.includes(fw);
                        return (
                          <button key={fw} type="button"
                            onClick={() => setField("preferredFrameworks", active ? form.preferredFrameworks.filter(v => v !== fw) : [...form.preferredFrameworks, fw])}
                            className={`w-full text-left text-xs px-3 py-2 rounded-md border transition-colors ${active ? "bg-primary/10 border-primary text-primary font-medium" : "border-border text-muted-foreground hover:border-muted-foreground"}`}>
                            {active ? "✓ " : ""}{fw}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="publico" className="space-y-4 mt-4">
                  <div className="space-y-1.5">
                    <Label>Descrição do público-alvo</Label>
                    <Textarea value={form.targetAudience} onChange={e => setField("targetAudience", e.target.value)}
                      placeholder="Ex: Empreendedoras 28-40 anos, donas de negócios de moda ou lifestyle, autodidatas, valorizam autenticidade..."
                      rows={3} className="resize-none" data-testid="textarea-agent-audience" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Principais dores do público</Label>
                    <Textarea value={form.audiencePains} onChange={e => setField("audiencePains", e.target.value)}
                      placeholder="Ex: não sabe o que postar, produz sem consistência, algoritmo não ajuda..."
                      rows={3} className="resize-none" data-testid="textarea-agent-pains" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Sonhos e desejos do público</Label>
                    <Textarea value={form.audienceDreams} onChange={e => setField("audienceDreams", e.target.value)}
                      placeholder="Ex: presença digital forte, vender pelo Instagram organicamente, comunidade fiel..."
                      rows={3} className="resize-none" data-testid="textarea-agent-dreams" />
                  </div>
                </TabsContent>

                <TabsContent value="restricoes" className="space-y-4 mt-4">
                  <div className="space-y-1.5">
                    <Label>Restrições — o que NUNCA fazer</Label>
                    <TagInput value={form.restrictions} onChange={v => setField("restrictions", v)}
                      placeholder="Ex: não prometer resultados garantidos, não citar concorrentes..." />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Palavras proibidas</Label>
                    <TagInput value={form.forbiddenWords} onChange={v => setField("forbiddenWords", v)}
                      placeholder="Ex: segredo, fórmula mágica, hack, guru..." />
                  </div>
                  <div className="bg-muted/40 border border-border rounded-md p-3">
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1"><BookOpen className="w-3 h-3" /><span className="font-medium">Como as restrições funcionam</span></p>
                    <p className="text-xs text-muted-foreground">Tudo aqui é enviado diretamente ao AI como instrução de comportamento. O agente vai evitar ativamente esses padrões ao gerar o calendário.</p>
                  </div>
                </TabsContent>
              </Tabs>
            ) : (
              <Tabs defaultValue="identidade">
                <TabsList className="grid grid-cols-4 h-8">
                  <TabsTrigger value="identidade" className="text-xs">Identidade</TabsTrigger>
                  <TabsTrigger value="visual" className="text-xs">Estilo Visual</TabsTrigger>
                  <TabsTrigger value="referencias" className="text-xs">Referências</TabsTrigger>
                  <TabsTrigger value="restricoes" className="text-xs">Restrições</TabsTrigger>
                </TabsList>

                <TabsContent value="identidade" className="space-y-4 mt-4">
                  <div className="space-y-1.5">
                    <Label>Nome do Agente de Criação *</Label>
                    <Input value={form.name} onChange={e => setField("name", e.target.value)}
                      placeholder="Ex: Designer Minimalista, Agente Contrast, Criador Premium..." data-testid="input-agent-name" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Descrição curta</Label>
                    <Input value={form.description} onChange={e => setField("description", e.target.value)}
                      placeholder="Ex: Arte editorial com foco em alto contraste e tipografia bold" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Perfil e filosofia de design</Label>
                    <Textarea value={form.personaDescription} onChange={e => setField("personaDescription", e.target.value)}
                      placeholder="Ex: Designer com estética premium e minimalista. Prioriza legibilidade e hierarquia visual. Cria artes que comunicam antes mesmo de serem lidas. Entende que o design é a primeira impressão da marca..."
                      rows={4} className="resize-none" data-testid="textarea-agent-persona" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Referências de estilo (designers, marcas, agências)</Label>
                    <Input value={form.referencePersonas} onChange={e => setField("referencePersonas", e.target.value)}
                      placeholder="Ex: Contrast Agency, Apple design, Teenage Engineering, Notion estilo..." data-testid="input-agent-references" />
                  </div>
                </TabsContent>

                <TabsContent value="visual" className="space-y-4 mt-4">
                  <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-md p-3 text-xs text-amber-800 dark:text-amber-300 mb-2">
                    Estes campos alimentam diretamente o prompt de geração de imagem quando este agente for selecionado no Criador de Conteúdo.
                  </div>
                  <div className="space-y-1.5">
                    <Label>Mood / Estética visual</Label>
                    <Textarea value={form.visualMood} onChange={e => setField("visualMood", e.target.value)}
                      placeholder="Ex: profissional, sofisticado, com sensação de exclusividade e seriedade, levemente futurista. Fundo escuro com acentos em laranja queimado..."
                      rows={3} className="resize-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Abordagem de cores</Label>
                      <Textarea value={form.colorApproach} onChange={e => setField("colorApproach", e.target.value)}
                        placeholder="Ex: paleta triádica com dominância do preto (#000), branco para textos e laranja (#FF5A1F) como acento em 10%. Regra 60-30-10."
                        rows={3} className="resize-none" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Tipografia</Label>
                      <Textarea value={form.typographyStyle} onChange={e => setField("typographyStyle", e.target.value)}
                        placeholder="Ex: Sans-serif bold para headlines, hierarquia forte, fonte accent em laranja para ênfase, all-caps nos CTA buttons..."
                        rows={3} className="resize-none" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Layout e composição</Label>
                      <Textarea value={form.layoutPreferences} onChange={e => setField("layoutPreferences", e.target.value)}
                        placeholder="Ex: card centralizado com borda de destaque, uso de espaço negativo, paginação no canto superior direito..."
                        rows={3} className="resize-none" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Elementos gráficos</Label>
                      <Textarea value={form.graphicElements} onChange={e => setField("graphicElements", e.target.value)}
                        placeholder="Ex: grid técnico de fundo, manchas de luz desfocadas nas bordas, bordas arredondadas, botão pill com ícone de seta..."
                        rows={3} className="resize-none" />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="referencias" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Imagens de referência</Label>
                        <p className="text-xs text-muted-foreground mt-0.5">Faça upload de posts prontos (estáticos ou carrosseis). A IA vai analisar e extrair o estilo visual automaticamente.</p>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => imageInputRef.current?.click()} className="h-8 shrink-0">
                        <Upload className="w-3 h-3 mr-1" /> Upload
                      </Button>
                      <input ref={imageInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
                    </div>

                    {form.referenceImages.length > 0 ? (
                      <div className="grid grid-cols-3 gap-2">
                        {form.referenceImages.map((img, i) => (
                          <div key={i} className="relative group">
                            <img src={img} alt={`Ref ${i + 1}`} className="w-full aspect-square object-cover rounded-md border border-border" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-md flex flex-col items-center justify-center gap-1">
                              <Button size="sm" variant="secondary" className="h-7 text-xs w-full max-w-[90%]"
                                onClick={() => extractStyleFromImage(img, i)} disabled={extractingStyle !== null}>
                                {extractingStyle === i ? <><Loader2 className="w-3 h-3 mr-1 animate-spin" />Extraindo...</> : <><Sparkles className="w-3 h-3 mr-1" />Extrair estilo</>}
                              </Button>
                              <Button size="sm" variant="destructive" className="h-7 text-xs w-full max-w-[90%]"
                                onClick={() => setField("referenceImages", form.referenceImages.filter((_, j) => j !== i))}>
                                <Trash2 className="w-3 h-3 mr-1" />Remover
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-border rounded-md p-8 flex flex-col items-center gap-2 cursor-pointer hover:border-primary/50 transition-colors"
                        onClick={() => imageInputRef.current?.click()}>
                        <ImageIcon className="w-8 h-8 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground text-center">Clique para fazer upload ou arraste posts de referência aqui</p>
                        <p className="text-xs text-muted-foreground text-center">Suporte: PNG, JPG, WEBP</p>
                      </div>
                    )}
                  </div>

                  {form.extractedVisualStyle && (
                    <div className="space-y-1.5">
                      <Label className="flex items-center gap-1.5"><Sparkles className="w-3 h-3 text-primary" />Estilo extraído pela IA</Label>
                      <Textarea value={form.extractedVisualStyle} onChange={e => setField("extractedVisualStyle", e.target.value)}
                        rows={6} className="resize-none text-xs" />
                      <p className="text-xs text-muted-foreground">Você pode editar o texto acima para refinar o estilo extraído.</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="restricoes" className="space-y-4 mt-4">
                  <div className="space-y-1.5">
                    <Label>O que NUNCA fazer visualmente</Label>
                    <TagInput value={form.restrictions} onChange={v => setField("restrictions", v)}
                      placeholder="Ex: sem gradientes coloridos, sem fotos de banco de imagem genéricas..." />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Elementos visuais proibidos</Label>
                    <TagInput value={form.forbiddenWords} onChange={v => setField("forbiddenWords", v)}
                      placeholder="Ex: neon, clip art, bordas decorativas excessivas..." />
                  </div>
                </TabsContent>
              </Tabs>
            )}

            <div className="flex gap-2 justify-end pt-2 border-t border-border">
              <Button variant="outline" size="sm" onClick={() => { setDialogOpen(false); setEditingId(null); setForm(emptyForm); }}>Cancelar</Button>
              <Button size="sm" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !form.name.trim()} data-testid="button-save-agent">
                {saveMutation.isPending ? "Salvando..." : editingId ? "Salvar Alterações" : "Criar Agente"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteId !== null} onOpenChange={v => !v && setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Excluir agente?</DialogTitle>
            <DialogDescription>Esta ação não pode ser desfeita.</DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => setDeleteId(null)}>Cancelar</Button>
            <Button variant="destructive" size="sm" onClick={() => deleteId && deleteMutation.mutate(deleteId)} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? "Excluindo..." : "Excluir"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
