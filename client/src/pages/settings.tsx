import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, XCircle, Eye, EyeOff, Save, Trash2, ExternalLink, AlertCircle } from "lucide-react";

type SettingsData = {
  settings: Record<string, string>;
  connected: Record<string, boolean>;
};

type SectionKey = "clickup" | "meta";

const KEYS = {
  clickupToken: "clickup_api_token",
  metaSystemToken: "meta_system_user_token",
  metaPortfolioId: "meta_business_portfolio_id",
};

function ConnectionBadge({ connected }: { connected: boolean }) {
  return connected ? (
    <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-medium">
      <CheckCircle2 className="w-3.5 h-3.5" /> Conectado
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
      <XCircle className="w-3.5 h-3.5" /> Não conectado
    </span>
  );
}

export default function Settings() {
  const { toast } = useToast();
  const [showTokens, setShowTokens] = useState<Record<string, boolean>>({});
  const [editing, setEditing] = useState<Record<string, boolean>>({});
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const { data, isLoading } = useQuery<SettingsData>({
    queryKey: ["/api/settings"],
  });

  const saveMutation = useMutation({
    mutationFn: (updates: Record<string, string | null>) =>
      apiRequest("PATCH", "/api/settings", updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({ title: "Configurações salvas" });
    },
    onError: () => toast({ title: "Erro ao salvar", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (key: string) => apiRequest("DELETE", `/api/settings/${key}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({ title: "Credencial removida" });
    },
    onError: () => toast({ title: "Erro ao remover", variant: "destructive" }),
  });

  const startEdit = (key: string) => {
    setEditing(prev => ({ ...prev, [key]: true }));
    setDrafts(prev => ({ ...prev, [key]: "" }));
  };

  const cancelEdit = (key: string) => {
    setEditing(prev => ({ ...prev, [key]: false }));
    setDrafts(prev => ({ ...prev, [key]: "" }));
  };

  const saveField = (key: string) => {
    const val = drafts[key]?.trim();
    if (!val) return;
    saveMutation.mutate({ [key]: val }, {
      onSuccess: () => {
        setEditing(prev => ({ ...prev, [key]: false }));
        setDrafts(prev => ({ ...prev, [key]: "" }));
      },
    });
  };

  const saveMultiple = (updates: Record<string, string>) => {
    const filtered = Object.fromEntries(Object.entries(updates).filter(([, v]) => v.trim()));
    if (Object.keys(filtered).length === 0) return;
    saveMutation.mutate(filtered);
    setDrafts({});
    setEditing({});
  };

  if (isLoading) {
    return (
      <div className="p-6 max-w-2xl mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const c = data?.connected ?? {};
  const s = data?.settings ?? {};

  const isClickupConnected = c[KEYS.clickupToken];
  const isMetaConnected = c[KEYS.metaSystemToken];

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Configurações Gerais</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Credenciais globais da agência. Configure uma vez e use em todos os projetos.
        </p>
      </div>

      {/* ClickUp */}
      <div className="rounded-lg border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-[#7B68EE]/10 flex items-center justify-center shrink-0">
              <div className="w-4 h-4 rounded-sm bg-[#7B68EE]" />
            </div>
            <div>
              <p className="font-semibold text-sm">ClickUp</p>
              <ConnectionBadge connected={!!isClickupConnected} />
            </div>
          </div>
          <a
            href="https://app.clickup.com/settings/apps"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors"
          >
            Obter token <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        <div className="space-y-1">
          <Label className="text-xs">API Token pessoal</Label>
          {isClickupConnected && !editing[KEYS.clickupToken] ? (
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center gap-2 px-3 h-9 rounded-md border bg-muted/30 font-mono text-xs text-muted-foreground">
                {showTokens[KEYS.clickupToken] ? s[KEYS.clickupToken] : s[KEYS.clickupToken]}
                <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
              </div>
              <Button size="icon" variant="ghost" className="h-9 w-9 shrink-0" onClick={() => startEdit(KEYS.clickupToken)} data-testid="button-edit-clickup-token">
                <Eye className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="ghost" className="h-9 w-9 shrink-0 text-destructive hover:text-destructive" onClick={() => deleteMutation.mutate(KEYS.clickupToken)} data-testid="button-remove-clickup-token">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Input
                  type={showTokens[KEYS.clickupToken] ? "text" : "password"}
                  placeholder="pk_xxxxxxxxxxxxxxxxxxxxxxxxxx"
                  value={drafts[KEYS.clickupToken] ?? ""}
                  onChange={e => setDrafts(prev => ({ ...prev, [KEYS.clickupToken]: e.target.value }))}
                  className="font-mono text-xs pr-9"
                  data-testid="input-clickup-token"
                  onKeyDown={e => { if (e.key === "Enter") saveField(KEYS.clickupToken); }}
                />
                <button
                  type="button"
                  onClick={() => setShowTokens(prev => ({ ...prev, [KEYS.clickupToken]: !prev[KEYS.clickupToken] }))}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showTokens[KEYS.clickupToken] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              <Button size="sm" onClick={() => saveField(KEYS.clickupToken)} disabled={saveMutation.isPending || !drafts[KEYS.clickupToken]?.trim()} data-testid="button-save-clickup-token">
                <Save className="w-3.5 h-3.5 mr-1" /> Salvar
              </Button>
              {isClickupConnected && (
                <Button size="sm" variant="ghost" onClick={() => cancelEdit(KEYS.clickupToken)}>Cancelar</Button>
              )}
            </div>
          )}
          <p className="text-[11px] text-muted-foreground">
            Encontrado em ClickUp → Configurações → Apps → API Token
          </p>
        </div>
      </div>

      {/* Meta Business Portfolio */}
      <div className="rounded-lg border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-blue-500/10 flex items-center justify-center shrink-0">
              <div className="w-4 h-4 rounded bg-blue-500" />
            </div>
            <div>
              <p className="font-semibold text-sm">Meta Business Portfolio</p>
              <ConnectionBadge connected={!!isMetaConnected} />
            </div>
          </div>
          <a
            href="https://business.facebook.com/settings/system-users"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors"
          >
            Gerenciar usuários do sistema <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        <div className="rounded-md border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 px-3 py-2 flex gap-2 items-start">
          <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <p className="text-[11px] text-amber-700 dark:text-amber-400">
            Use um <strong>System User Token</strong> (usuário do sistema) em vez do token pessoal. Tokens de sistema são permanentes e não expiram, ao contrário dos tokens de usuário (60 dias).
          </p>
        </div>

        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">System User Token</Label>
            {isMetaConnected && !editing[KEYS.metaSystemToken] ? (
              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center gap-2 px-3 h-9 rounded-md border bg-muted/30 font-mono text-xs text-muted-foreground">
                  {s[KEYS.metaSystemToken]}
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
                </div>
                <Button size="icon" variant="ghost" className="h-9 w-9 text-destructive hover:text-destructive" onClick={() => deleteMutation.mutate(KEYS.metaSystemToken)} data-testid="button-remove-meta-token">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Input
                    type={showTokens[KEYS.metaSystemToken] ? "text" : "password"}
                    placeholder="EAAxxxxxxxxxxxxxxxxxx..."
                    value={drafts[KEYS.metaSystemToken] ?? ""}
                    onChange={e => setDrafts(prev => ({ ...prev, [KEYS.metaSystemToken]: e.target.value }))}
                    className="font-mono text-xs pr-9"
                    data-testid="input-meta-system-token"
                  />
                  <button
                    type="button"
                    onClick={() => setShowTokens(prev => ({ ...prev, [KEYS.metaSystemToken]: !prev[KEYS.metaSystemToken] }))}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showTokens[KEYS.metaSystemToken] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                {isMetaConnected && (
                  <Button size="sm" variant="ghost" onClick={() => cancelEdit(KEYS.metaSystemToken)}>Cancelar</Button>
                )}
              </div>
            )}
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Business Portfolio ID</Label>
            {c[KEYS.metaPortfolioId] && !editing[KEYS.metaPortfolioId] ? (
              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center gap-2 px-3 h-9 rounded-md border bg-muted/30 font-mono text-xs text-muted-foreground">
                  {s[KEYS.metaPortfolioId]}
                </div>
                <Button size="icon" variant="ghost" className="h-9 w-9 text-destructive hover:text-destructive" onClick={() => deleteMutation.mutate(KEYS.metaPortfolioId)} data-testid="button-remove-meta-portfolio">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <Input
                placeholder="Ex: 123456789012345"
                value={drafts[KEYS.metaPortfolioId] ?? ""}
                onChange={e => setDrafts(prev => ({ ...prev, [KEYS.metaPortfolioId]: e.target.value }))}
                className="font-mono text-xs"
                data-testid="input-meta-portfolio-id"
              />
            )}
            <p className="text-[11px] text-muted-foreground">
              Meta Business Suite → Configurações do negócio → Informações do negócio
            </p>
          </div>

          {(!isMetaConnected || editing[KEYS.metaSystemToken] || editing[KEYS.metaPortfolioId]) && (
            <Button
              size="sm"
              className="w-full"
              onClick={() => saveMultiple({
                [KEYS.metaSystemToken]: drafts[KEYS.metaSystemToken] ?? "",
                [KEYS.metaPortfolioId]: drafts[KEYS.metaPortfolioId] ?? "",
              })}
              disabled={saveMutation.isPending || (!drafts[KEYS.metaSystemToken]?.trim() && !drafts[KEYS.metaPortfolioId]?.trim())}
              data-testid="button-save-meta"
            >
              <Save className="w-3.5 h-3.5 mr-1.5" />
              {saveMutation.isPending ? "Salvando..." : "Salvar credenciais Meta"}
            </Button>
          )}
        </div>
      </div>

      {/* Info box */}
      <div className="rounded-md border bg-muted/30 px-4 py-3 space-y-1">
        <p className="text-xs font-medium">Como as credenciais são usadas?</p>
        <ul className="text-[11px] text-muted-foreground space-y-0.5 list-disc list-inside">
          <li>O token do ClickUp é usado para criar e mover tarefas automaticamente nas listas vinculadas a cada projeto</li>
          <li>O token do Meta é usado para publicar conteúdo aprovado direto no Instagram e Facebook dos clientes</li>
          <li>As credenciais ficam armazenadas no banco de dados da aplicação, nunca expostas no frontend</li>
        </ul>
      </div>
    </div>
  );
}
