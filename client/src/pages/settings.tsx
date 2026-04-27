import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, XCircle, Eye, EyeOff, Save, Trash2, ExternalLink, AlertCircle, KeyRound, RefreshCw, Cpu, ChevronDown, ChevronUp } from "lucide-react";
import { PlatformIcon } from "@/components/platform-icon";

type SettingsData = {
  settings: Record<string, string>;
  connected: Record<string, boolean>;
};

type AccountData = {
  name: string;
  email: string;
  hasPassword: boolean;
};

type AIModels = Record<string, { id: string; name: string }[]>;

const KEYS = {
  clickupToken: "clickup_api_token",
  metaSystemToken: "meta_system_user_token",
  metaPortfolioId: "meta_business_portfolio_id",
  openaiKey: "ai_openai_key",
  anthropicKey: "ai_anthropic_key",
  geminiKey: "ai_gemini_key",
};

const PROVIDERS = [
  {
    key: KEYS.openaiKey,
    id: "openai",
    name: "OpenAI",
    description: "GPT-4.1, GPT-4o, o3, o4-mini e outros",
    placeholder: "sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    docsUrl: "https://platform.openai.com/api-keys",
    docsLabel: "Obter chave",
    bgColor: "bg-[#10a37f]/10",
    borderColor: "border-[#10a37f]/30",
    textColor: "text-[#10a37f]",
    note: "Se não configurada, usa a integração padrão do sistema.",
  },
  {
    key: KEYS.anthropicKey,
    id: "anthropic",
    name: "Anthropic",
    description: "Claude Opus, Sonnet, Haiku e outros",
    placeholder: "sk-ant-api03-xxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    docsUrl: "https://console.anthropic.com/settings/keys",
    docsLabel: "Obter chave",
    bgColor: "bg-orange-50 dark:bg-orange-950/20",
    borderColor: "border-orange-200 dark:border-orange-800/50",
    textColor: "text-orange-700 dark:text-orange-400",
    note: null,
  },
  {
    key: KEYS.geminiKey,
    id: "gemini",
    name: "Google Gemini",
    description: "Gemini 2.0 Flash, 1.5 Pro e outros",
    placeholder: "AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    docsUrl: "https://aistudio.google.com/app/apikey",
    docsLabel: "Obter chave",
    bgColor: "bg-blue-50 dark:bg-blue-950/20",
    borderColor: "border-blue-200 dark:border-blue-800/50",
    textColor: "text-blue-700 dark:text-blue-400",
    note: null,
  },
];

type Tab = "geral" | "ia" | "integracoes" | "seguranca";

function ConnectionBadge({ connected }: { connected: boolean }) {
  return connected ? (
    <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-medium">
      <CheckCircle2 className="w-3.5 h-3.5" /> Conectado
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
      <XCircle className="w-3.5 h-3.5" /> Não configurado
    </span>
  );
}

function ProviderModels({ providerId, models }: { providerId: string; models: { id: string; name: string }[] | undefined }) {
  const [expanded, setExpanded] = useState(false);
  if (!models || models.length === 0) return null;
  const shown = expanded ? models : models.slice(0, 4);
  return (
    <div className="mt-2">
      <p className="text-[11px] text-muted-foreground mb-1.5 flex items-center gap-1">
        <Cpu className="w-3 h-3" /> {models.length} modelo{models.length !== 1 ? "s" : ""} disponível{models.length !== 1 ? "is" : ""}
      </p>
      <div className="flex flex-wrap gap-1">
        {shown.map(m => (
          <span key={m.id} className="text-[10px] px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground font-mono border border-border">
            {m.id}
          </span>
        ))}
        {models.length > 4 && (
          <button
            onClick={() => setExpanded(e => !e)}
            className="text-[10px] px-1.5 py-0.5 rounded-md bg-muted text-primary font-medium border border-border flex items-center gap-0.5"
          >
            {expanded ? <><ChevronUp className="w-2.5 h-2.5" /> menos</> : <><ChevronDown className="w-2.5 h-2.5" /> +{models.length - 4} mais</>}
          </button>
        )}
      </div>
    </div>
  );
}

export default function Settings() {
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>("geral");

  const [accountDrafts, setAccountDrafts] = useState({ name: "", email: "" });
  const [passwordForm, setPasswordForm] = useState({ current: "", new: "", confirm: "" });
  const [showPass, setShowPass] = useState({ current: false, new: false, confirm: false });

  const [showTokens, setShowTokens] = useState<Record<string, boolean>>({});
  const [editing, setEditing] = useState<Record<string, boolean>>({});
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [metaAccounts, setMetaAccounts] = useState<any[]>([]);

  const { data: settings, isLoading: loadingSettings } = useQuery<SettingsData>({
    queryKey: ["/api/settings"],
  });
  const { data: account, isLoading: loadingAccount } = useQuery<AccountData>({
    queryKey: ["/api/account"],
  });
  const { data: aiModels, isLoading: loadingModels, refetch: refetchModels } = useQuery<AIModels>({
    queryKey: ["/api/ai/models"],
    staleTime: 5 * 60 * 1000,
    enabled: tab === "ia",
  });

  const saveAccountMutation = useMutation({
    mutationFn: (u: { name?: string; email?: string }) => apiRequest("PATCH", "/api/account", u),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/account"] });
      setAccountDrafts({ name: "", email: "" });
      toast({ title: "Conta atualizada" });
    },
    onError: () => toast({ title: "Erro ao atualizar conta", variant: "destructive" }),
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (d: { currentPassword: string; newPassword: string }) => {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(d),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || "Erro ao alterar senha");
      }
      return res.json();
    },
    onSuccess: () => {
      setPasswordForm({ current: "", new: "", confirm: "" });
      toast({ title: "Senha alterada com sucesso!" });
    },
    onError: (e: Error) => {
      toast({ title: e.message || "Erro ao alterar senha", variant: "destructive" });
    },
  });

  const saveSettingsMutation = useMutation({
    mutationFn: (u: Record<string, string | null>) => apiRequest("PATCH", "/api/settings", u),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ai/models"] });
      toast({ title: "Salvo" });
    },
    onError: () => toast({ title: "Erro ao salvar", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (key: string) => apiRequest("DELETE", `/api/settings/${key}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ai/models"] });
      toast({ title: "Removido" });
    },
  });

  const testMetaMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/meta/accounts", { credentials: "include" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Falha ao validar Meta");
      return body as { accounts: any[] };
    },
    onSuccess: (body) => {
      setMetaAccounts(body.accounts || []);
      toast({ title: `${body.accounts?.length || 0} conta(s) Meta encontrada(s)` });
    },
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });

  const saveField = (key: string, onDone?: () => void) => {
    const val = drafts[key]?.trim();
    if (!val) return;
    saveSettingsMutation.mutate({ [key]: val }, {
      onSuccess: () => {
        setEditing(p => ({ ...p, [key]: false }));
        setDrafts(p => ({ ...p, [key]: "" }));
        onDone?.();
      },
    });
  };

  const handlePasswordSubmit = () => {
    if (passwordForm.new.length < 6) {
      toast({ title: "A senha deve ter pelo menos 6 caracteres", variant: "destructive" });
      return;
    }
    if (passwordForm.new !== passwordForm.confirm) {
      toast({ title: "As senhas não coincidem", variant: "destructive" });
      return;
    }
    changePasswordMutation.mutate({ currentPassword: passwordForm.current, newPassword: passwordForm.new });
  };

  const isLoading = loadingSettings || loadingAccount;
  const c = settings?.connected ?? {};
  const s = settings?.settings ?? {};

  const tabs: { key: Tab; label: string }[] = [
    { key: "geral", label: "Geral" },
    { key: "ia", label: "Inteligência Artificial" },
    { key: "integracoes", label: "Integrações" },
    { key: "seguranca", label: "Segurança" },
  ];

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-5">
        <h1 className="text-xl font-semibold tracking-tight">Configurações</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Gerencie sua conta, provedores de IA e integrações.</p>
      </div>

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        {/* Tab bar */}
        <div className="flex border-b border-border bg-muted/20 overflow-x-auto">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              data-testid={`tab-${t.key}`}
              className={`px-5 py-3 text-sm font-medium transition-all relative whitespace-nowrap shrink-0 ${
                tab === t.key
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
              {tab === t.key && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6">
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-3/4" />
            </div>
          ) : tab === "geral" ? (
            <div className="space-y-7">
              {/* Nome e Email */}
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold text-foreground mb-3">Informações da conta</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-muted-foreground">Nome</Label>
                      <Input
                        placeholder={account?.name || "Seu nome"}
                        value={accountDrafts.name}
                        onChange={e => setAccountDrafts(p => ({ ...p, name: e.target.value }))}
                        className="h-9"
                        data-testid="input-account-name"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-muted-foreground">Email</Label>
                      <Input
                        type="email"
                        placeholder={account?.email || "seu@email.com"}
                        value={accountDrafts.email}
                        onChange={e => setAccountDrafts(p => ({ ...p, email: e.target.value }))}
                        className="h-9"
                        data-testid="input-account-email"
                      />
                    </div>
                  </div>
                  {(account?.name || account?.email) && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Atual: <span className="text-foreground font-medium">{[account.name, account.email].filter(Boolean).join(" · ")}</span>
                    </p>
                  )}
                </div>
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    onClick={() => saveAccountMutation.mutate({
                      name: accountDrafts.name || undefined,
                      email: accountDrafts.email || undefined,
                    })}
                    disabled={saveAccountMutation.isPending || (!accountDrafts.name.trim() && !accountDrafts.email.trim())}
                    data-testid="button-save-account"
                  >
                    <Save className="w-3.5 h-3.5 mr-1.5" />
                    {saveAccountMutation.isPending ? "Salvando..." : "Salvar"}
                  </Button>
                </div>
              </div>

            </div>

          ) : tab === "ia" ? (
            <div className="space-y-6">
              {/* Header */}
              <div className="rounded-xl border border-border bg-muted/20 px-4 py-3 flex items-start gap-3">
                <Cpu className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">Provedores de IA</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Configure suas chaves de API para usar diferentes modelos na geração de legenda e calendário. Sem chave configurada, o sistema usa a integração padrão OpenAI.
                  </p>
                </div>
              </div>

              {/* Providers */}
              {PROVIDERS.map((provider, idx) => {
                const isConfigured = !!c[provider.key];
                const isEditing = !!editing[provider.key];
                const models = aiModels?.[provider.id];

                return (
                  <div key={provider.id}>
                    {idx > 0 && <div className="border-t border-border mb-6" />}
                    <div className="space-y-3">
                      {/* Provider header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className={`px-2.5 py-1 rounded-lg text-xs font-bold tracking-tight ${provider.bgColor} ${provider.textColor} border ${provider.borderColor}`}>
                            {provider.name}
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">{provider.description}</p>
                            <ConnectionBadge connected={isConfigured} />
                          </div>
                        </div>
                        <a
                          href={provider.docsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-muted-foreground hover:text-primary inline-flex items-center gap-1 transition-colors"
                        >
                          {provider.docsLabel} <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>

                      {/* Note */}
                      {provider.note && (
                        <p className="text-[11px] text-muted-foreground bg-muted/50 rounded-md px-2 py-1.5 border border-border">
                          {provider.note}
                        </p>
                      )}

                      {/* Key input */}
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-muted-foreground">Chave de API</Label>
                        {isConfigured && !isEditing ? (
                          <div className="flex items-center gap-2">
                            <div className="flex-1 flex items-center justify-between px-3 h-9 rounded-lg border bg-muted/30 font-mono text-xs text-muted-foreground">
                              <span>{s[provider.key]}</span>
                              <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0 ml-2" />
                            </div>
                            <Button
                              size="sm" variant="outline" className="h-9 shrink-0"
                              onClick={() => setEditing(p => ({ ...p, [provider.key]: true }))}
                              data-testid={`button-edit-${provider.id}`}
                            >
                              Editar
                            </Button>
                            <Button
                              size="icon" variant="ghost" className="h-9 w-9 text-muted-foreground hover:text-destructive shrink-0"
                              onClick={() => deleteMutation.mutate(provider.key)}
                              data-testid={`button-remove-${provider.id}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="relative flex-1">
                              <Input
                                type={showTokens[provider.key] ? "text" : "password"}
                                placeholder={provider.placeholder}
                                value={drafts[provider.key] ?? ""}
                                onChange={e => setDrafts(p => ({ ...p, [provider.key]: e.target.value }))}
                                className="font-mono text-xs h-9 pr-9"
                                data-testid={`input-${provider.id}-key`}
                                onKeyDown={e => {
                                  if (e.key === "Enter") saveField(provider.key, () => refetchModels());
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => setShowTokens(p => ({ ...p, [provider.key]: !p[provider.key] }))}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                              >
                                {showTokens[provider.key] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                            <Button
                              size="sm" className="h-9 shrink-0"
                              onClick={() => saveField(provider.key, () => refetchModels())}
                              disabled={saveSettingsMutation.isPending || !drafts[provider.key]?.trim()}
                              data-testid={`button-save-${provider.id}`}
                            >
                              <Save className="w-3.5 h-3.5 mr-1" /> Salvar
                            </Button>
                            {isConfigured && (
                              <Button
                                size="sm" variant="ghost" className="h-9 shrink-0"
                                onClick={() => setEditing(p => ({ ...p, [provider.key]: false }))}
                              >
                                Cancelar
                              </Button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Available models */}
                      {isConfigured && (
                        <div>
                          {loadingModels ? (
                            <div className="flex items-center gap-1.5 mt-1">
                              <RefreshCw className="w-3 h-3 text-muted-foreground animate-spin" />
                              <span className="text-[11px] text-muted-foreground">Carregando modelos...</span>
                            </div>
                          ) : models && models.length > 0 ? (
                            <ProviderModels providerId={provider.id} models={models} />
                          ) : (
                            <div className="flex items-center gap-2 mt-1">
                              <p className="text-[11px] text-muted-foreground">Nenhum modelo encontrado. Verifique a chave.</p>
                              <button
                                onClick={() => refetchModels()}
                                className="text-[11px] text-primary underline"
                                data-testid={`button-retry-models-${provider.id}`}
                              >
                                Tentar novamente
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Reload models */}
              <div className="flex justify-end pt-2 border-t border-border">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => refetchModels()}
                  disabled={loadingModels}
                  data-testid="button-reload-models"
                >
                  <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loadingModels ? "animate-spin" : ""}`} />
                  Atualizar lista de modelos
                </Button>
              </div>
            </div>

          ) : tab === "integracoes" ? (
            /* Integrações tab */
            <div className="space-y-6">
              <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
                <p className="text-sm font-semibold text-foreground">Prioridade do MVP: Meta</p>
                <p className="text-xs text-muted-foreground mt-1">
                  O Raya deve ser autossuficiente na gestão de conteúdo. ClickUp/CRM fica como integração futura; a conexão operacional agora é com contas Instagram/Facebook via Meta.
                </p>
              </div>

              {/* ClickUp */}
              <div className="space-y-3 opacity-70">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg border bg-white flex items-center justify-center shrink-0">
                      <PlatformIcon domain="clickup.com" size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">ClickUp</p>
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">Futuro</span>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">Fora do MVP</span>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">API Token pessoal</Label>
                  {c[KEYS.clickupToken] && !editing[KEYS.clickupToken] ? (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 flex items-center justify-between px-3 h-9 rounded-lg border bg-muted/30 font-mono text-xs text-muted-foreground">
                        <span>{s[KEYS.clickupToken]}</span>
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0 ml-2" />
                      </div>
                      <Button size="sm" variant="outline" className="h-9" onClick={() => setEditing(p => ({ ...p, [KEYS.clickupToken]: true }))} data-testid="button-edit-clickup">Editar</Button>
                      <Button size="icon" variant="ghost" className="h-9 w-9 text-muted-foreground hover:text-destructive" onClick={() => deleteMutation.mutate(KEYS.clickupToken)} data-testid="button-remove-clickup"><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <Input
                          type={showTokens[KEYS.clickupToken] ? "text" : "password"}
                          placeholder="pk_xxxxxxxxxxxxxxxxxxxxxxxxxx"
                          value={drafts[KEYS.clickupToken] ?? ""}
                          onChange={e => setDrafts(p => ({ ...p, [KEYS.clickupToken]: e.target.value }))}
                          className="font-mono text-xs h-9 pr-9"
                          data-testid="input-clickup-token"
                          onKeyDown={e => { if (e.key === "Enter") saveField(KEYS.clickupToken); }}
                        />
                        <button type="button" onClick={() => setShowTokens(p => ({ ...p, [KEYS.clickupToken]: !p[KEYS.clickupToken] }))} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                          {showTokens[KEYS.clickupToken] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      <Button size="sm" className="h-9" onClick={() => saveField(KEYS.clickupToken)} disabled={saveSettingsMutation.isPending || !drafts[KEYS.clickupToken]?.trim()} data-testid="button-save-clickup">
                        <Save className="w-3.5 h-3.5 mr-1" /> Salvar
                      </Button>
                      {c[KEYS.clickupToken] && (
                        <Button size="sm" variant="ghost" className="h-9" onClick={() => setEditing(p => ({ ...p, [KEYS.clickupToken]: false }))}>Cancelar</Button>
                      )}
                    </div>
                  )}
                  <p className="text-[11px] text-muted-foreground">ClickUp → Configurações → Apps → API Token</p>
                </div>
              </div>

              <div className="border-t border-border" />

              {/* Meta */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg border bg-white flex items-center justify-center shrink-0">
                      <PlatformIcon domain="business.facebook.com" size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Meta Business Portfolio</p>
                      <ConnectionBadge connected={!!c[KEYS.metaSystemToken]} />
                    </div>
                  </div>
                  <a href="https://business.facebook.com/settings/system-users" target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-primary inline-flex items-center gap-1 transition-colors">
                    Gerenciar <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="rounded-lg border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-950/20 px-3 py-2 flex gap-2 items-start">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-relaxed">
                    Use um <strong>System User Token</strong> (permanente, não expira). Tokens pessoais expiram em 60 dias.
                  </p>
                </div>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">System User Token</Label>
                    {c[KEYS.metaSystemToken] && !editing[KEYS.metaSystemToken] ? (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 flex items-center justify-between px-3 h-9 rounded-lg border bg-muted/30 font-mono text-xs text-muted-foreground">
                          <span>{s[KEYS.metaSystemToken]}</span>
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0 ml-2" />
                        </div>
                        <Button size="sm" variant="outline" className="h-9" onClick={() => setEditing(p => ({ ...p, [KEYS.metaSystemToken]: true }))}>Editar</Button>
                        <Button size="icon" variant="ghost" className="h-9 w-9 text-muted-foreground hover:text-destructive" onClick={() => deleteMutation.mutate(KEYS.metaSystemToken)} data-testid="button-remove-meta-token"><Trash2 className="w-3.5 h-3.5" /></Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <Input
                            type={showTokens[KEYS.metaSystemToken] ? "text" : "password"}
                            placeholder="EAAxxxxxxxxxxxxxxxxxx..."
                            value={drafts[KEYS.metaSystemToken] ?? ""}
                            onChange={e => setDrafts(p => ({ ...p, [KEYS.metaSystemToken]: e.target.value }))}
                            className="font-mono text-xs h-9 pr-9"
                            data-testid="input-meta-token"
                          />
                          <button type="button" onClick={() => setShowTokens(p => ({ ...p, [KEYS.metaSystemToken]: !p[KEYS.metaSystemToken] }))} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                            {showTokens[KEYS.metaSystemToken] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                        {c[KEYS.metaSystemToken] && (
                          <Button size="sm" variant="ghost" className="h-9" onClick={() => setEditing(p => ({ ...p, [KEYS.metaSystemToken]: false }))}>Cancelar</Button>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">Business Portfolio ID</Label>
                    {c[KEYS.metaPortfolioId] && !editing[KEYS.metaPortfolioId] ? (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 flex items-center px-3 h-9 rounded-lg border bg-muted/30 font-mono text-xs text-muted-foreground">{s[KEYS.metaPortfolioId]}</div>
                        <Button size="sm" variant="outline" className="h-9" onClick={() => setEditing(p => ({ ...p, [KEYS.metaPortfolioId]: true }))}>Editar</Button>
                        <Button size="icon" variant="ghost" className="h-9 w-9 text-muted-foreground hover:text-destructive" onClick={() => deleteMutation.mutate(KEYS.metaPortfolioId)} data-testid="button-remove-meta-portfolio"><Trash2 className="w-3.5 h-3.5" /></Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Input
                          placeholder="Ex: 123456789012345"
                          value={drafts[KEYS.metaPortfolioId] ?? ""}
                          onChange={e => setDrafts(p => ({ ...p, [KEYS.metaPortfolioId]: e.target.value }))}
                          className="font-mono text-xs h-9 flex-1"
                          data-testid="input-meta-portfolio-id"
                        />
                        {c[KEYS.metaPortfolioId] && (
                          <Button size="sm" variant="ghost" className="h-9" onClick={() => setEditing(p => ({ ...p, [KEYS.metaPortfolioId]: false }))}>Cancelar</Button>
                        )}
                      </div>
                    )}
                    <p className="text-[11px] text-muted-foreground">Meta Business Suite → Configurações → Informações do negócio</p>
                  </div>
                  {(!c[KEYS.metaSystemToken] || editing[KEYS.metaSystemToken] || editing[KEYS.metaPortfolioId]) && (
                    <div className="flex justify-end pt-1">
                      <Button
                        size="sm"
                        onClick={() => {
                          const u: Record<string, string> = {};
                          if (drafts[KEYS.metaSystemToken]?.trim()) u[KEYS.metaSystemToken] = drafts[KEYS.metaSystemToken];
                          if (drafts[KEYS.metaPortfolioId]?.trim()) u[KEYS.metaPortfolioId] = drafts[KEYS.metaPortfolioId];
                          if (!Object.keys(u).length) return;
                          saveSettingsMutation.mutate(u, { onSuccess: () => { setEditing({}); setDrafts({}); } });
                        }}
                        disabled={saveSettingsMutation.isPending || (!drafts[KEYS.metaSystemToken]?.trim() && !drafts[KEYS.metaPortfolioId]?.trim())}
                        data-testid="button-save-meta"
                      >
                        <Save className="w-3.5 h-3.5 mr-1.5" />
                        {saveSettingsMutation.isPending ? "Salvando..." : "Salvar credenciais Meta"}
                      </Button>
                    </div>
                  )}
                  {c[KEYS.metaSystemToken] && (
                    <div className="space-y-2 pt-1">
                      <div className="flex justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => testMetaMutation.mutate()}
                          disabled={testMetaMutation.isPending}
                          data-testid="button-test-meta"
                        >
                          {testMetaMutation.isPending && <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                          Testar conexão Meta
                        </Button>
                      </div>
                      {metaAccounts.length > 0 && (
                        <div className="rounded-lg border bg-muted/30 p-3 space-y-1">
                          <p className="text-xs font-semibold">Contas encontradas</p>
                          {metaAccounts.map((account) => (
                            <p key={account.id} className="text-xs text-muted-foreground font-mono">
                              {account.username || account.name || account.id}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : tab === "seguranca" ? (
            <div className="space-y-7">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-foreground">{account?.hasPassword ? "Alterar senha" : "Definir senha"}</p>
                  {account?.hasPassword && (
                    <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Definida
                    </span>
                  )}
                </div>
                <div className="space-y-3">
                  {account?.hasPassword && (
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-muted-foreground">Senha atual</Label>
                      <div className="relative">
                        <Input
                          type={showPass.current ? "text" : "password"}
                          placeholder="••••••••"
                          value={passwordForm.current}
                          onChange={e => setPasswordForm(p => ({ ...p, current: e.target.value }))}
                          className="h-9 pr-9"
                          data-testid="input-current-password"
                        />
                        <button type="button" onClick={() => setShowPass(p => ({ ...p, current: !p.current }))} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                          {showPass.current ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-muted-foreground">{account?.hasPassword ? "Nova senha" : "Definir senha"}</Label>
                      <div className="relative">
                        <Input
                          type={showPass.new ? "text" : "password"}
                          placeholder="Mínimo 6 caracteres"
                          value={passwordForm.new}
                          onChange={e => setPasswordForm(p => ({ ...p, new: e.target.value }))}
                          className="h-9 pr-9"
                          data-testid="input-new-password"
                        />
                        <button type="button" onClick={() => setShowPass(p => ({ ...p, new: !p.new }))} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                          {showPass.new ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-muted-foreground">Confirmar senha</Label>
                      <div className="relative">
                        <Input
                          type={showPass.confirm ? "text" : "password"}
                          placeholder="Repita a senha"
                          value={passwordForm.confirm}
                          onChange={e => setPasswordForm(p => ({ ...p, confirm: e.target.value }))}
                          className="h-9 pr-9"
                          data-testid="input-confirm-password"
                          onKeyDown={e => { if (e.key === "Enter") handlePasswordSubmit(); }}
                        />
                        <button type="button" onClick={() => setShowPass(p => ({ ...p, confirm: !p.confirm }))} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                          {showPass.confirm ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>
                  {passwordForm.new && passwordForm.confirm && passwordForm.new !== passwordForm.confirm && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> As senhas não coincidem
                    </p>
                  )}
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      onClick={handlePasswordSubmit}
                      disabled={changePasswordMutation.isPending || !passwordForm.new || !passwordForm.confirm}
                      data-testid="button-change-password"
                    >
                      <KeyRound className="w-3.5 h-3.5 mr-1.5" />
                      {changePasswordMutation.isPending ? "Salvando..." : account?.hasPassword ? "Alterar senha" : "Definir senha"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
