import { useState } from "react";
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
import { Bot, Plus, Pencil, Trash2, X, Target, Mic, Users, ShieldAlert, Sparkles, BookOpen } from "lucide-react";
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

function TagInput({
  value, onChange, placeholder, options,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
  options?: string[];
}) {
  const [input, setInput] = useState("");

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }
    setInput("");
  };

  return (
    <div className="space-y-2">
      {options && (
        <div className="flex flex-wrap gap-1.5">
          {options.map(opt => {
            const active = value.includes(opt);
            return (
              <button
                key={opt}
                type="button"
                onClick={() => active ? onChange(value.filter(v => v !== opt)) : addTag(opt)}
                className={`text-xs px-2 py-1 rounded-full border transition-colors ${active ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary hover:text-primary"}`}
              >
                {opt}
              </button>
            );
          })}
        </div>
      )}
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addTag(input); } }}
          placeholder={placeholder || "Adicionar item e pressionar Enter..."}
          className="h-8 text-xs"
        />
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

  const { data: agents = [], isLoading } = useQuery<AgentProfile[]>({ queryKey: ["/api/agent-profiles"] });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editingId) {
        return apiRequest("PATCH", `/api/agent-profiles/${editingId}`, form);
      }
      return apiRequest("POST", "/api/agent-profiles", form);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agent-profiles"] });
      setDialogOpen(false);
      setEditingId(null);
      setForm(emptyForm);
      toast({ title: editingId ? "Agente atualizado!" : "Agente criado!" });
    },
    onError: () => toast({ title: "Erro ao salvar agente", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/agent-profiles/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agent-profiles"] });
      setDeleteId(null);
      toast({ title: "Agente excluído" });
    },
    onError: () => toast({ title: "Erro ao excluir", variant: "destructive" }),
  });

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (agent: AgentProfile) => {
    setEditingId(agent.id);
    setForm({
      name: agent.name,
      description: agent.description || "",
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
      isGlobal: agent.isGlobal ?? true,
      projectId: agent.projectId ?? null,
    });
    setDialogOpen(true);
  };

  const setField = <K extends keyof AgentForm>(key: K, value: AgentForm[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Agentes de Social Media</h1>
          <p className="text-sm text-muted-foreground">Configure perfis de agentes para geração de calendário com estilo, tom e estratégia definidos</p>
        </div>
        <Button size="sm" onClick={openCreate} data-testid="button-create-agent">
          <Plus className="w-4 h-4 mr-1" /> Novo Agente
        </Button>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {[1, 2].map(i => <Card key={i}><CardContent className="p-4 h-32 animate-pulse bg-muted/40 rounded-md" /></Card>)}
        </div>
      ) : agents.length === 0 ? (
        <Card>
          <CardContent className="py-16 flex flex-col items-center gap-3 text-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Bot className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground">Nenhum agente configurado</p>
              <p className="text-sm text-muted-foreground mt-1">Crie um agente para definir o estilo e estratégia de geração de conteúdo</p>
            </div>
            <Button size="sm" onClick={openCreate}>
              <Plus className="w-4 h-4 mr-1" /> Criar primeiro agente
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {agents.map(agent => (
            <Card key={agent.id} className="hover-elevate" data-testid={`card-agent-${agent.id}`}>
              <CardHeader className="p-4 pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4 text-primary" />
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
                {agent.referencePersonas && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-primary shrink-0" />
                    Referência: {agent.referencePersonas}
                  </p>
                )}
                {(agent.toneCharacteristics as string[])?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {(agent.toneCharacteristics as string[]).slice(0, 4).map(t => (
                      <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
                    ))}
                    {(agent.toneCharacteristics as string[]).length > 4 && (
                      <Badge variant="outline" className="text-xs">+{(agent.toneCharacteristics as string[]).length - 4}</Badge>
                    )}
                  </div>
                )}
                <div className="flex flex-wrap gap-2 pt-1">
                  {agent.deliveryDepth && (
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                      {agent.deliveryDepth}
                    </span>
                  )}
                  {(agent.preferredFrameworks as string[])?.length > 0 && (
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                      {(agent.preferredFrameworks as string[]).length} frameworks
                    </span>
                  )}
                  {(agent.contentPillars as string[])?.length > 0 && (
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                      {(agent.contentPillars as string[]).length} pilares
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={v => { setDialogOpen(v); if (!v) { setEditingId(null); setForm(emptyForm); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Agente" : "Novo Agente de Social Media"}</DialogTitle>
            <DialogDescription>
              Configure o perfil do profissional de social media que vai gerar seu calendário de conteúdo.
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="identidade" className="mt-2">
            <TabsList className="grid grid-cols-5 h-8 text-xs">
              <TabsTrigger value="identidade" className="text-xs"><Bot className="w-3 h-3 mr-1" />Identidade</TabsTrigger>
              <TabsTrigger value="tom" className="text-xs"><Mic className="w-3 h-3 mr-1" />Tom</TabsTrigger>
              <TabsTrigger value="estrategia" className="text-xs"><Target className="w-3 h-3 mr-1" />Estratégia</TabsTrigger>
              <TabsTrigger value="publico" className="text-xs"><Users className="w-3 h-3 mr-1" />Público</TabsTrigger>
              <TabsTrigger value="restricoes" className="text-xs"><ShieldAlert className="w-3 h-3 mr-1" />Regras</TabsTrigger>
            </TabsList>

            <TabsContent value="identidade" className="space-y-4 mt-4">
              <div className="space-y-1.5">
                <Label>Nome do Agente *</Label>
                <Input
                  value={form.name}
                  onChange={e => setField("name", e.target.value)}
                  placeholder="Ex: Social Media Premium, Agente Educativo, Agente de Vendas..."
                  data-testid="input-agent-name"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Descrição curta</Label>
                <Input
                  value={form.description}
                  onChange={e => setField("description", e.target.value)}
                  placeholder="Ex: Agente especialista em conteúdo educativo para creators"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Quem é esse profissional?</Label>
                <p className="text-xs text-muted-foreground">Descreva o perfil, experiência e especialidade do social media que você quer simular</p>
                <Textarea
                  value={form.personaDescription}
                  onChange={e => setField("personaDescription", e.target.value)}
                  placeholder="Ex: Social media com 8 anos de experiência em marcas de moda e lifestyle. Especialista em branding pessoal para empreendedoras, com foco em storytelling autêntico e conteúdo que converte sem parecer venda..."
                  rows={4}
                  className="resize-none"
                  data-testid="textarea-agent-persona"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Referências / Inspirações de estilo</Label>
                <p className="text-xs text-muted-foreground">Criadores, profissionais ou marcas cujo estilo de comunicação serve como referência</p>
                <Input
                  value={form.referencePersonas}
                  onChange={e => setField("referencePersonas", e.target.value)}
                  placeholder="Ex: Thay Dantas (branding cozy-intelectual), Hanah Franklin (Reels estratégicos), Isabela Matte (autoridade autêntica)..."
                  data-testid="input-agent-references"
                />
              </div>
            </TabsContent>

            <TabsContent value="tom" className="space-y-4 mt-4">
              <div className="space-y-1.5">
                <Label>Características do tom de voz</Label>
                <p className="text-xs text-muted-foreground">Selecione ou adicione características que definem como o agente se comunica</p>
                <TagInput
                  value={form.toneCharacteristics}
                  onChange={v => setField("toneCharacteristics", v)}
                  options={TONE_OPTIONS}
                  placeholder="Adicionar tom personalizado..."
                />
              </div>
              <div className="space-y-1.5">
                <Label>Registro de voz (descreva em detalhes)</Label>
                <p className="text-xs text-muted-foreground">Como o agente soa, suas expressões, linguagem, gírias e forma de se relacionar com o público</p>
                <Textarea
                  value={form.voiceRegister}
                  onChange={e => setField("voiceRegister", e.target.value)}
                  placeholder="Ex: Fala como uma amiga que já trilhou o caminho. Mistura reflexão filosófica com linguagem coloquial. Usa gírias naturais sem exagero. Vulnerável nas histórias, mas sempre com aprendizado concreto. Nunca soará professoral ou distante..."
                  rows={4}
                  className="resize-none"
                  data-testid="textarea-agent-voice"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Nível de profundidade das entregas</Label>
                <Select value={form.deliveryDepth} onValueChange={v => setField("deliveryDepth", v)}>
                  <SelectTrigger data-testid="select-agent-depth">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPTH_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Estilo de gancho (hook)</Label>
                <Input
                  value={form.hookStyle}
                  onChange={e => setField("hookStyle", e.target.value)}
                  placeholder="Ex: Perguntas provocadoras, afirmações contraintuitivas, números + promessa, storytelling pessoal..."
                  data-testid="input-agent-hook"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Estilo de CTA</Label>
                <Input
                  value={form.ctaStyle}
                  onChange={e => setField("ctaStyle", e.target.value)}
                  placeholder="Ex: Convite íntimo ('me conta nos comentários...'), CTA de engajamento, redirecionamento para bio, salvar para depois..."
                  data-testid="input-agent-cta"
                />
              </div>
            </TabsContent>

            <TabsContent value="estrategia" className="space-y-4 mt-4">
              <div className="space-y-1.5">
                <Label>Objetivos de conteúdo prioritários</Label>
                <p className="text-xs text-muted-foreground">Selecione os objetivos que este agente prioriza</p>
                <div className="grid grid-cols-2 gap-2">
                  {OBJECTIVE_OPTIONS.map(o => {
                    const active = form.contentObjectives.includes(o.value);
                    return (
                      <button
                        key={o.value}
                        type="button"
                        onClick={() => setField("contentObjectives", active ? form.contentObjectives.filter(v => v !== o.value) : [...form.contentObjectives, o.value])}
                        className={`text-left text-xs px-3 py-2 rounded-md border transition-colors ${active ? "bg-primary/10 border-primary text-primary font-medium" : "border-border text-muted-foreground hover:border-muted-foreground"}`}
                        data-testid={`toggle-objective-${o.value}`}
                      >
                        {o.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Pilares de conteúdo</Label>
                <p className="text-xs text-muted-foreground">Os pilares estruturais que organizam os temas do agente</p>
                <TagInput
                  value={form.contentPillars}
                  onChange={v => setField("contentPillars", v)}
                  options={["autoridade", "educação", "humanização", "produto/serviço", "prova social", "bastidores", "inspiração", "engajamento", "comunidade", "case de sucesso"]}
                  placeholder="Adicionar pilar personalizado..."
                />
              </div>
              <div className="space-y-1.5">
                <Label>Frameworks e estruturas de copy</Label>
                <p className="text-xs text-muted-foreground">Selecione os frameworks que o agente deve aplicar ao criar os títulos e ideias de conteúdo</p>
                <div className="space-y-1.5">
                  {FRAMEWORK_OPTIONS.map(fw => {
                    const active = form.preferredFrameworks.includes(fw);
                    return (
                      <button
                        key={fw}
                        type="button"
                        onClick={() => setField("preferredFrameworks", active ? form.preferredFrameworks.filter(v => v !== fw) : [...form.preferredFrameworks, fw])}
                        className={`w-full text-left text-xs px-3 py-2 rounded-md border transition-colors ${active ? "bg-primary/10 border-primary text-primary font-medium" : "border-border text-muted-foreground hover:border-muted-foreground"}`}
                      >
                        {active ? "✓ " : ""}{fw}
                      </button>
                    );
                  })}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="publico" className="space-y-4 mt-4">
              <div className="space-y-1.5">
                <Label>Descrição do público-alvo (avatar)</Label>
                <p className="text-xs text-muted-foreground">Quem é a pessoa que este agente fala? Seja específico — quanto mais detalhado, melhor a geração</p>
                <Textarea
                  value={form.targetAudience}
                  onChange={e => setField("targetAudience", e.target.value)}
                  placeholder="Ex: Empreendedoras entre 28-40 anos, donas de pequenos negócios de moda, beleza ou lifestyle. Já tentaram escalar mas travam no marketing. Consomem Instagram com frequência, são autodidatas e valorizam autenticidade acima de tudo..."
                  rows={3}
                  className="resize-none"
                  data-testid="textarea-agent-audience"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Principais dores do público</Label>
                <Textarea
                  value={form.audiencePains}
                  onChange={e => setField("audiencePains", e.target.value)}
                  placeholder="Ex: Não sabe o que postar, produz conteúdo sem consistência, sente que o algoritmo não ajuda, faz tudo sozinha e está sobrecarregada..."
                  rows={3}
                  className="resize-none"
                  data-testid="textarea-agent-pains"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Sonhos e desejos do público</Label>
                <Textarea
                  value={form.audienceDreams}
                  onChange={e => setField("audienceDreams", e.target.value)}
                  placeholder="Ex: Ter uma presença digital forte sem depender de agência, vender pelo Instagram de forma orgânica, construir uma comunidade fiel que defende a marca..."
                  rows={3}
                  className="resize-none"
                  data-testid="textarea-agent-dreams"
                />
              </div>
            </TabsContent>

            <TabsContent value="restricoes" className="space-y-4 mt-4">
              <div className="space-y-1.5">
                <Label>Restrições e regras — o que NUNCA fazer</Label>
                <p className="text-xs text-muted-foreground">Comportamentos, abordagens ou tipos de conteúdo que o agente deve evitar completamente</p>
                <TagInput
                  value={form.restrictions}
                  onChange={v => setField("restrictions", v)}
                  placeholder="Ex: não prometer resultados garantidos, não citar concorrentes pelo nome..."
                />
              </div>
              <div className="space-y-1.5">
                <Label>Palavras e expressões proibidas</Label>
                <p className="text-xs text-muted-foreground">Termos específicos que nunca devem aparecer nos títulos ou ideias geradas</p>
                <TagInput
                  value={form.forbiddenWords}
                  onChange={v => setField("forbiddenWords", v)}
                  placeholder="Ex: segredo, fórmula mágica, hack, guru..."
                />
              </div>
              <div className="bg-muted/40 border border-border rounded-md p-3 space-y-1.5">
                <p className="text-xs font-medium flex items-center gap-1">
                  <BookOpen className="w-3 h-3" /> Como as restrições são usadas
                </p>
                <p className="text-xs text-muted-foreground">
                  Tudo que você definir aqui é enviado diretamente ao sistema de IA como instruções de comportamento. O agente vai evitar ativamente qualquer padrão listado nas restrições e nas palavras proibidas ao gerar o calendário.
                </p>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex gap-2 justify-end pt-2 border-t border-border mt-4">
            <Button variant="outline" size="sm" onClick={() => { setDialogOpen(false); setEditingId(null); setForm(emptyForm); }}>
              Cancelar
            </Button>
            <Button size="sm" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !form.name.trim()} data-testid="button-save-agent">
              {saveMutation.isPending ? "Salvando..." : editingId ? "Salvar Alterações" : "Criar Agente"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteId !== null} onOpenChange={v => !v && setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Excluir agente?</DialogTitle>
            <DialogDescription>
              Esta ação não pode ser desfeita. O agente será removido permanentemente.
            </DialogDescription>
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
