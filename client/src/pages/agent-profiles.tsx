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
  Plus, Pencil, Trash2, X, Target, Mic, Users, ShieldAlert,
  Sparkles, BookOpen, Palette, ImageIcon, Loader2, Upload, Eye, Bot
} from "lucide-react";
import type { AgentProfile } from "@shared/schema";

function StrategyCharacter() {
  return (
    <svg viewBox="0 0 260 200" className="w-full h-full" style={{ overflow: "visible" }}>
      <style>{`
        @keyframes writeArm {
          0%, 100% { transform: rotate(-8deg); transform-origin: 72px 92px; }
          50% { transform: rotate(5deg); transform-origin: 72px 92px; }
        }
        @keyframes blinkStrategy {
          0%, 90%, 100% { transform: scaleY(1); }
          95% { transform: scaleY(0.1); }
        }
        @keyframes floatBubble {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-4px); }
        }
        @keyframes fadeChart {
          0%, 40% { opacity: 0; }
          60%, 100% { opacity: 1; }
        }
        @keyframes writeText {
          0% { stroke-dashoffset: 80; }
          100% { stroke-dashoffset: 0; }
        }
        @keyframes pulseRing {
          0%, 100% { opacity: 0.3; transform: scale(1); transform-origin: 55px 52px; }
          50% { opacity: 0; transform: scale(1.4); transform-origin: 55px 52px; }
        }
        .strategy-arm { animation: writeArm 1.4s ease-in-out infinite; }
        .strategy-blink { animation: blinkStrategy 4s ease-in-out infinite; }
        .float-bubble { animation: floatBubble 3s ease-in-out infinite; }
        .fade-chart { animation: fadeChart 3s ease-in-out infinite; }
        .pulse-ring { animation: pulseRing 2.5s ease-in-out infinite; }
      `}</style>

      <circle cx="55" cy="52" r="22" fill="none" stroke="#6366f1" strokeWidth="1.5" opacity="0.3" className="pulse-ring" />

      <g className="float-bubble">
        <rect x="108" y="22" width="130" height="105" rx="10" fill="white" stroke="#e2e8f0" strokeWidth="1.5" />
        <line x1="130" y1="127" x2="118" y2="152" stroke="#94a3b8" strokeWidth="2" />
        <line x1="216" y1="127" x2="228" y2="152" stroke="#94a3b8" strokeWidth="2" />
        <line x1="115" y1="152" x2="231" y2="152" stroke="#94a3b8" strokeWidth="2" />

        <text x="127" y="46" fontFamily="system-ui,sans-serif" fontSize="11" fontWeight="700" fill="#6366f1" letterSpacing="3">AIDA</text>
        <line x1="127" y1="50" x2="227" y2="50" stroke="#e2e8f0" strokeWidth="1" />

        <text x="119" y="64" fontFamily="system-ui,sans-serif" fontSize="8" fill="#94a3b8">Atenção</text>
        <rect x="119" y="67" width="28" height="6" rx="2" fill="#6366f1" opacity="0.8" />
        <text x="119" y="82" fontFamily="system-ui,sans-serif" fontSize="8" fill="#94a3b8">Interesse</text>
        <rect x="119" y="85" width="22" height="6" rx="2" fill="#818cf8" opacity="0.7" />
        <text x="119" y="100" fontFamily="system-ui,sans-serif" fontSize="8" fill="#94a3b8">Desejo</text>
        <rect x="119" y="103" width="16" height="6" rx="2" fill="#a5b4fc" opacity="0.6" />
        <text x="119" y="118" fontFamily="system-ui,sans-serif" fontSize="8" fill="#94a3b8">Ação</text>
        <rect x="119" y="121" width="10" height="6" rx="2" fill="#c7d2fe" opacity="0.5" />

        <line x1="170" y1="58" x2="228" y2="58" stroke="#e2e8f0" strokeWidth="1" />
        <text x="172" y="68" fontFamily="system-ui,sans-serif" fontSize="7.5" fill="#475569">Engajar → Converter</text>
        <text x="172" y="79" fontFamily="system-ui,sans-serif" fontSize="7.5" fill="#475569">Hook + Storytelling</text>
        <text x="172" y="90" fontFamily="system-ui,sans-serif" fontSize="7.5" fill="#475569">CTA emocional</text>
        <circle cx="169" cy="66" r="1.5" fill="#6366f1" />
        <circle cx="169" cy="77" r="1.5" fill="#6366f1" />
        <circle cx="169" cy="88" r="1.5" fill="#6366f1" />

        <path d="M175,110 L185,102 L196,108 L210,96 L222,100" stroke="#10b981" strokeWidth="2" fill="none" strokeLinecap="round" />
        <circle cx="222" cy="100" r="3" fill="#10b981" />
      </g>

      <circle cx="55" cy="52" r="26" fill="#f8d7c4" />
      <path d="M29,42 Q55,14 81,42" fill="#2d2040" />
      <path d="M29,42 Q29,42 31,48 Q31,38 55,36 Q79,38 79,48 L81,42 Q55,14 29,42Z" fill="#1e1530" />
      <ellipse cx="46" cy="49" rx="3" ry="3.5" fill="white" className="strategy-blink" style={{ transformOrigin: "46px 49px" }} />
      <ellipse cx="64" cy="49" rx="3" ry="3.5" fill="white" className="strategy-blink" style={{ transformOrigin: "64px 49px" }} />
      <circle cx="46" cy="50" r="1.8" fill="#1e1530" />
      <circle cx="64" cy="50" r="1.8" fill="#1e1530" />
      <circle cx="47" cy="49" r="0.8" fill="white" />
      <circle cx="65" cy="49" r="0.8" fill="white" />
      <path d="M47,62 Q55,68 63,62" stroke="#d97070" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <ellipse cx="44" cy="59" rx="4" ry="2.5" fill="#f4a0a0" opacity="0.5" />
      <ellipse cx="66" cy="59" rx="4" ry="2.5" fill="#f4a0a0" opacity="0.5" />

      <rect x="39" y="78" width="32" height="48" rx="8" fill="#6366f1" />
      <rect x="39" y="78" width="32" height="18" rx="8" fill="#818cf8" />
      <path d="M39,90 L71,90 L71,96 Q55,102 39,96Z" fill="#6366f1" />

      <line x1="55" y1="78" x2="55" y2="68" stroke="#f8d7c4" strokeWidth="8" strokeLinecap="round" />

      <g className="strategy-arm" style={{ transformOrigin: "72px 92px" }}>
        <path d="M71,88 Q90,78 107,65" stroke="#f8d7c4" strokeWidth="8" strokeLinecap="round" fill="none" />
        <circle cx="107" cy="65" r="5" fill="#f8d7c4" />
        <rect x="104" y="58" width="3" height="14" rx="1.5" fill="#2d2040" transform="rotate(-20, 107, 65)" />
        <rect x="106" y="56" width="2" height="5" rx="1" fill="#ef4444" transform="rotate(-20, 107, 65)" />
      </g>

      <rect x="40" y="126" width="12" height="28" rx="4" fill="#818cf8" />
      <rect x="58" y="126" width="12" height="28" rx="4" fill="#818cf8" />
    </svg>
  );
}

function DesignCharacter() {
  return (
    <svg viewBox="0 0 260 200" className="w-full h-full" style={{ overflow: "visible" }}>
      <style>{`
        @keyframes paintArm {
          0% { transform: rotate(-15deg); transform-origin: 72px 92px; }
          30% { transform: rotate(12deg); transform-origin: 72px 92px; }
          60% { transform: rotate(-5deg); transform-origin: 72px 92px; }
          100% { transform: rotate(-15deg); transform-origin: 72px 92px; }
        }
        @keyframes blinkDesign {
          0%, 88%, 100% { transform: scaleY(1); }
          93% { transform: scaleY(0.1); }
        }
        @keyframes strokeAppear1 { 0%,20%{opacity:0;} 40%,100%{opacity:1;} }
        @keyframes strokeAppear2 { 0%,40%{opacity:0;} 60%,100%{opacity:1;} }
        @keyframes strokeAppear3 { 0%,60%{opacity:0;} 80%,100%{opacity:1;} }
        @keyframes canvasFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        @keyframes sparkle {
          0%, 100% { opacity:0; transform: scale(0.5); }
          50% { opacity:1; transform: scale(1); }
        }
        .design-arm { animation: paintArm 2s ease-in-out infinite; }
        .design-blink { animation: blinkDesign 3.5s ease-in-out infinite; }
        .stroke1 { animation: strokeAppear1 3s ease-in-out infinite; }
        .stroke2 { animation: strokeAppear2 3s ease-in-out infinite; }
        .stroke3 { animation: strokeAppear3 3s ease-in-out infinite; }
        .canvas-float { animation: canvasFloat 3.5s ease-in-out infinite; }
        .sparkle1 { animation: sparkle 2s ease-in-out infinite 0s; }
        .sparkle2 { animation: sparkle 2s ease-in-out infinite 0.7s; }
        .sparkle3 { animation: sparkle 2s ease-in-out infinite 1.4s; }
      `}</style>

      <g className="canvas-float">
        <line x1="173" y1="155" x2="160" y2="178" stroke="#94a3b8" strokeWidth="2" />
        <line x1="215" y1="155" x2="228" y2="178" stroke="#94a3b8" strokeWidth="2" />
        <line x1="157" y1="178" x2="231" y2="178" stroke="#94a3b8" strokeWidth="2" />

        <rect x="108" y="18" width="130" height="137" rx="4" fill="#f8f4f0" stroke="#d6c9b8" strokeWidth="1.5" />
        <rect x="108" y="18" width="130" height="10" rx="4" fill="#d6c9b8" />

        <path d="M120,55 Q138,48 155,57 Q172,66 188,52 Q204,38 218,50" stroke="#f97316" strokeWidth="7" fill="none" strokeLinecap="round" opacity="0.85" className="stroke1" />
        <path d="M120,75 Q140,68 160,78 Q180,88 200,72 Q215,62 228,70" stroke="#8b5cf6" strokeWidth="7" fill="none" strokeLinecap="round" opacity="0.85" className="stroke2" />
        <path d="M120,95 Q142,88 158,100 Q174,112 195,98 Q210,88 228,96" stroke="#06b6d4" strokeWidth="7" fill="none" strokeLinecap="round" opacity="0.85" className="stroke3" />
        <path d="M120,115 Q145,108 165,120 Q185,132 210,118 Q220,112 228,118" stroke="#10b981" strokeWidth="5" fill="none" strokeLinecap="round" opacity="0.7" className="stroke1" />
        <path d="M120,132 Q148,126 168,136 Q188,146 218,132" stroke="#f43f5e" strokeWidth="5" fill="none" strokeLinecap="round" opacity="0.65" className="stroke2" />

        <circle cx="228" cy="36" r="5" fill="#f97316" opacity="0.8" />
        <circle cx="218" cy="32" r="3.5" fill="#8b5cf6" opacity="0.8" />
        <circle cx="208" cy="36" r="4" fill="#06b6d4" opacity="0.8" />
        <circle cx="218" cy="42" r="3" fill="#10b981" opacity="0.8" />
      </g>

      <text className="sparkle1" x="95" y="35" fontSize="14" style={{ transformOrigin: "95px 35px" }}>✦</text>
      <text className="sparkle2" x="101" y="55" fontSize="10" style={{ transformOrigin: "101px 55px" }}>✦</text>
      <text className="sparkle3" x="90" y="70" fontSize="8" style={{ transformOrigin: "90px 70px" }}>✦</text>

      <circle cx="55" cy="52" r="26" fill="#fcd9c4" />
      <path d="M29,44 Q36,20 55,22 Q74,20 81,44" fill="#8b4513" />
      <ellipse cx="55" cy="20" rx="14" ry="8" fill="#a0522d" />
      <circle cx="55" cy="16" r="9" fill="#a0522d" />
      <circle cx="62" cy="12" r="7" fill="#8b4513" />

      <ellipse cx="46" cy="50" rx="3" ry="3.5" fill="white" className="design-blink" style={{ transformOrigin: "46px 50px" }} />
      <ellipse cx="64" cy="50" rx="3" ry="3.5" fill="white" className="design-blink" style={{ transformOrigin: "64px 50px" }} />
      <circle cx="46" cy="51" r="1.8" fill="#1e1530" />
      <circle cx="64" cy="51" r="1.8" fill="#1e1530" />
      <circle cx="47" cy="50" r="0.8" fill="white" />
      <circle cx="65" cy="50" r="0.8" fill="white" />
      <path d="M47,63 Q55,70 63,63" stroke="#e07080" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <ellipse cx="44" cy="60" rx="4" ry="2.5" fill="#f9a8d4" opacity="0.55" />
      <ellipse cx="66" cy="60" rx="4" ry="2.5" fill="#f9a8d4" opacity="0.55" />

      <rect x="38" y="78" width="34" height="50" rx="8" fill="#f97316" />
      <rect x="38" y="78" width="34" height="20" rx="8" fill="#fb923c" />
      <path d="M38,90 L72,90 L72,98 Q55,106 38,98Z" fill="#f97316" />

      <path d="M60,58 L60,68" stroke="#fcd9c4" strokeWidth="9" strokeLinecap="round" />
      <path d="M50,68 L60,68 L60,78" stroke="#fcd9c4" strokeWidth="9" strokeLinecap="round" />

      <g className="design-arm" style={{ transformOrigin: "72px 92px" }}>
        <path d="M71,88 Q90,75 108,62" stroke="#fcd9c4" strokeWidth="8" strokeLinecap="round" fill="none" />
        <circle cx="108" cy="62" r="5" fill="#fcd9c4" />
        <rect x="105" y="46" width="4" height="20" rx="2" fill="#6b4226" transform="rotate(-15, 108, 62)" />
        <path d="M103,46 L109,46 L107,40 Z" fill="#f97316" transform="rotate(-15, 108, 62)" />
        <ellipse cx="106" cy="39" rx="2.5" ry="3.5" fill="#f97316" opacity="0.7" transform="rotate(-15, 108, 62)" />
      </g>

      <rect x="39" y="128" width="13" height="30" rx="4" fill="#fb923c" />
      <rect x="58" y="128" width="13" height="30" rx="4" fill="#fb923c" />
    </svg>
  );
}

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

  const openCreateStrategy = () => {
    setEditingId(null);
    setForm({ ...emptyForm, agentType: "estrategia" });
    setDialogOpen(true);
  };
  const openCreateDesign = () => {
    setEditingId(null);
    setForm({ ...emptyForm, agentType: "criacao" });
    setDialogOpen(true);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Agentes de IA</h1>
        <p className="text-sm text-muted-foreground">Personagens de IA especializados em estratégia editorial e criação visual</p>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => <Card key={i}><CardContent className="p-4 h-28 animate-pulse bg-muted/40 rounded-md" /></Card>)}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-5">

          {/* ── ESTRATÉGIA ──────────────────────────────── */}
          <div className="flex flex-col gap-4">
            <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-indigo-50 via-violet-50 to-purple-50 dark:from-indigo-950/40 dark:via-violet-950/30 dark:to-purple-950/20 border border-indigo-100 dark:border-indigo-900/40 p-5">
              <div className="absolute top-3 right-3">
                <Badge className="text-xs bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 border-0 font-medium">
                  Estratégia
                </Badge>
              </div>
              <div className="h-44 w-full">
                <StrategyCharacter />
              </div>
              <div className="mt-2 space-y-1">
                <h2 className="text-sm font-bold text-indigo-900 dark:text-indigo-200">Social Media Strategist</h2>
                <p className="text-xs text-indigo-700/70 dark:text-indigo-400 leading-relaxed">Gera o calendário editorial, define copy com frameworks AIDA/PAS/FOREST, adapta tom de voz e passa briefing ao designer.</p>
              </div>
              <Button size="sm" className="mt-3 w-full bg-indigo-600 hover:bg-indigo-700 text-white border-0" onClick={openCreateStrategy} data-testid="button-create-agent-strategy">
                <Plus className="w-3.5 h-3.5 mr-1.5" /> Criar Agente de Estratégia
              </Button>
            </div>

            {strategyAgents.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-400 inline-block" />
                  {strategyAgents.length} agente{strategyAgents.length > 1 ? "s" : ""} configurado{strategyAgents.length > 1 ? "s" : ""}
                </p>
                <div className="space-y-2">
                  {strategyAgents.map(agent => <AgentCard key={agent.id} agent={agent} />)}
                </div>
              </div>
            )}
          </div>

          {/* ── DESIGN ──────────────────────────────────── */}
          <div className="flex flex-col gap-4">
            <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 dark:from-orange-950/40 dark:via-amber-950/30 dark:to-yellow-950/20 border border-orange-100 dark:border-orange-900/40 p-5">
              <div className="absolute top-3 right-3">
                <Badge className="text-xs bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300 border-0 font-medium">
                  Criação
                </Badge>
              </div>
              <div className="h-44 w-full">
                <DesignCharacter />
              </div>
              <div className="mt-2 space-y-1">
                <h2 className="text-sm font-bold text-orange-900 dark:text-orange-200">Visual Designer</h2>
                <p className="text-xs text-orange-700/70 dark:text-orange-400 leading-relaxed">Define estilo visual, paleta, tipografia e composição. Aprende com imagens de referência reais e aplica esse estilo na geração de artes com IA.</p>
              </div>
              <Button size="sm" className="mt-3 w-full bg-orange-500 hover:bg-orange-600 text-white border-0" onClick={openCreateDesign} data-testid="button-create-agent-design">
                <Plus className="w-3.5 h-3.5 mr-1.5" /> Criar Agente de Design
              </Button>
            </div>

            {designAgents.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-orange-400 inline-block" />
                  {designAgents.length} agente{designAgents.length > 1 ? "s" : ""} configurado{designAgents.length > 1 ? "s" : ""}
                </p>
                <div className="space-y-2">
                  {designAgents.map(agent => <AgentCard key={agent.id} agent={agent} />)}
                </div>
              </div>
            )}
          </div>

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
