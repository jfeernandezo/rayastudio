import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, XCircle, Eye, EyeOff, Save, Trash2, ExternalLink, AlertCircle, User, Lock, KeyRound } from "lucide-react";

type SettingsData = {
  settings: Record<string, string>;
  connected: Record<string, boolean>;
};

type AccountData = {
  name: string;
  email: string;
  hasPassword: boolean;
};

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
      <XCircle className="w-3.5 h-3.5" /> Não configurado
    </span>
  );
}

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-card shadow-sm p-5 space-y-4">
      {children}
    </div>
  );
}

function SectionHeader({ icon, title, subtitle, badge }: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 bg-muted/30">
          {icon}
        </div>
        <div>
          <p className="font-semibold text-sm text-foreground">{title}</p>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {badge && <div className="pt-0.5">{badge}</div>}
    </div>
  );
}

export default function Settings() {
  const { toast } = useToast();
  const [showTokens, setShowTokens] = useState<Record<string, boolean>>({});
  const [editing, setEditing] = useState<Record<string, boolean>>({});
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [accountDrafts, setAccountDrafts] = useState({ name: "", email: "" });
  const [passwordForm, setPasswordForm] = useState({ current: "", new: "", confirm: "" });
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });

  const { data, isLoading } = useQuery<SettingsData>({
    queryKey: ["/api/settings"],
  });

  const { data: account, isLoading: loadingAccount } = useQuery<AccountData>({
    queryKey: ["/api/account"],
  });

  const saveSettingsMutation = useMutation({
    mutationFn: (updates: Record<string, string | null>) =>
      apiRequest("PATCH", "/api/settings", updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({ title: "Configurações salvas" });
    },
    onError: () => toast({ title: "Erro ao salvar", variant: "destructive" }),
  });

  const saveAccountMutation = useMutation({
    mutationFn: (updates: { name?: string; email?: string }) =>
      apiRequest("PATCH", "/api/account", updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/account"] });
      toast({ title: "Conta atualizada" });
      setAccountDrafts({ name: "", email: "" });
    },
    onError: () => toast({ title: "Erro ao atualizar conta", variant: "destructive" }),
  });

  const changePasswordMutation = useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      apiRequest("POST", "/api/account/change-password", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/account"] });
      toast({ title: "Senha alterada com sucesso" });
      setPasswordForm({ current: "", new: "", confirm: "" });
    },
    onError: async (err: any) => {
      const body = err?.response ? await err.response.json().catch(() => ({})) : {};
      toast({ title: body.error || "Erro ao alterar senha", variant: "destructive" });
    },
  });

  const deleteSettingMutation = useMutation({
    mutationFn: (key: string) => apiRequest("DELETE", `/api/settings/${key}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({ title: "Credencial removida" });
    },
  });

  const startEdit = (key: string) => {
    setEditing(prev => ({ ...prev, [key]: true }));
    setDrafts(prev => ({ ...prev, [key]: "" }));
  };

  const cancelEdit = (key: string) => {
    setEditing(prev => ({ ...prev, [key]: false }));
  };

  const saveField = (key: string) => {
    const val = drafts[key]?.trim();
    if (!val) return;
    saveSettingsMutation.mutate({ [key]: val }, {
      onSuccess: () => {
        setEditing(prev => ({ ...prev, [key]: false }));
        setDrafts(prev => ({ ...prev, [key]: "" }));
      },
    });
  };

  const handlePasswordChange = () => {
    if (!passwordForm.new || passwordForm.new.length < 6) {
      toast({ title: "A nova senha deve ter pelo menos 6 caracteres", variant: "destructive" });
      return;
    }
    if (passwordForm.new !== passwordForm.confirm) {
      toast({ title: "As senhas não coincidem", variant: "destructive" });
      return;
    }
    changePasswordMutation.mutate({
      currentPassword: passwordForm.current,
      newPassword: passwordForm.new,
    });
  };

  if (isLoading || loadingAccount) {
    return (
      <div className="p-6 max-w-2xl mx-auto space-y-4">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-36 w-full rounded-xl" />
      </div>
    );
  }

  const c = data?.connected ?? {};
  const s = data?.settings ?? {};
  const isClickupConnected = c[KEYS.clickupToken];
  const isMetaConnected = c[KEYS.metaSystemToken];

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Configurações</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Gerencie sua conta e as integrações da agência.
        </p>
      </div>

      {/* === CONTA === */}
      <SectionCard>
        <SectionHeader
          icon={<User className="w-4 h-4 text-muted-foreground" />}
          title="Conta"
          subtitle="Informações do dono da agência"
        />

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Nome</Label>
            <Input
              placeholder={account?.name || "Seu nome"}
              value={accountDrafts.name}
              onChange={e => setAccountDrafts(prev => ({ ...prev, name: e.target.value }))}
              className="h-9 text-sm"
              data-testid="input-account-name"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Email</Label>
            <Input
              type="email"
              placeholder={account?.email || "seu@email.com"}
              value={accountDrafts.email}
              onChange={e => setAccountDrafts(prev => ({ ...prev, email: e.target.value }))}
              className="h-9 text-sm"
              data-testid="input-account-email"
            />
          </div>
        </div>

        {(account?.name || account?.email) && (
          <div className="flex gap-2 text-xs text-muted-foreground pt-0.5">
            {account.name && <span className="font-medium text-foreground">{account.name}</span>}
            {account.name && account.email && <span>·</span>}
            {account.email && <span>{account.email}</span>}
          </div>
        )}

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
      </SectionCard>

      {/* === SENHA === */}
      <SectionCard>
        <SectionHeader
          icon={<Lock className="w-4 h-4 text-muted-foreground" />}
          title="Senha"
          subtitle={account?.hasPassword ? "Senha configurada" : "Nenhuma senha definida ainda"}
          badge={account?.hasPassword
            ? <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400"><CheckCircle2 className="w-3.5 h-3.5" /> Definida</span>
            : undefined
          }
        />

        <div className="space-y-3">
          {account?.hasPassword && (
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Senha atual</Label>
              <div className="relative">
                <Input
                  type={showPasswords.current ? "text" : "password"}
                  placeholder="••••••••"
                  value={passwordForm.current}
                  onChange={e => setPasswordForm(prev => ({ ...prev, current: e.target.value }))}
                  className="h-9 text-sm pr-9"
                  data-testid="input-current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPasswords.current ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">{account?.hasPassword ? "Nova senha" : "Definir senha"}</Label>
              <div className="relative">
                <Input
                  type={showPasswords.new ? "text" : "password"}
                  placeholder="Mínimo 6 caracteres"
                  value={passwordForm.new}
                  onChange={e => setPasswordForm(prev => ({ ...prev, new: e.target.value }))}
                  className="h-9 text-sm pr-9"
                  data-testid="input-new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPasswords.new ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Confirmar senha</Label>
              <div className="relative">
                <Input
                  type={showPasswords.confirm ? "text" : "password"}
                  placeholder="Repita a senha"
                  value={passwordForm.confirm}
                  onChange={e => setPasswordForm(prev => ({ ...prev, confirm: e.target.value }))}
                  className="h-9 text-sm pr-9"
                  data-testid="input-confirm-password"
                  onKeyDown={e => { if (e.key === "Enter") handlePasswordChange(); }}
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPasswords.confirm ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
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
              onClick={handlePasswordChange}
              disabled={changePasswordMutation.isPending || !passwordForm.new || !passwordForm.confirm}
              data-testid="button-change-password"
            >
              <KeyRound className="w-3.5 h-3.5 mr-1.5" />
              {changePasswordMutation.isPending ? "Alterando..." : account?.hasPassword ? "Alterar senha" : "Definir senha"}
            </Button>
          </div>
        </div>
      </SectionCard>

      {/* === CLICKUP === */}
      <SectionCard>
        <SectionHeader
          icon={<div className="w-4 h-4 rounded-sm bg-[#7B68EE]" />}
          title="ClickUp"
          subtitle="Token de API para criar e mover tarefas"
          badge={<ConnectionBadge connected={!!isClickupConnected} />}
        />

        <a
          href="https://app.clickup.com/settings/apps"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-primary hover:underline inline-flex items-center gap-1"
        >
          Obter token em ClickUp → Configurações → Apps <ExternalLink className="w-3 h-3" />
        </a>

        <div className="space-y-1.5">
          <Label className="text-xs font-medium">API Token pessoal</Label>
          {isClickupConnected && !editing[KEYS.clickupToken] ? (
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center justify-between px-3 h-9 rounded-lg border bg-muted/30 font-mono text-xs text-muted-foreground">
                <span>{s[KEYS.clickupToken]}</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
              </div>
              <Button size="sm" variant="outline" onClick={() => startEdit(KEYS.clickupToken)} data-testid="button-edit-clickup-token">
                Editar
              </Button>
              <Button size="icon" variant="ghost" className="h-9 w-9 text-destructive hover:text-destructive" onClick={() => deleteSettingMutation.mutate(KEYS.clickupToken)} data-testid="button-remove-clickup-token">
                <Trash2 className="w-3.5 h-3.5" />
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
                  className="font-mono text-xs h-9 pr-9"
                  data-testid="input-clickup-token"
                  onKeyDown={e => { if (e.key === "Enter") saveField(KEYS.clickupToken); }}
                />
                <button type="button" onClick={() => setShowTokens(prev => ({ ...prev, [KEYS.clickupToken]: !prev[KEYS.clickupToken] }))} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showTokens[KEYS.clickupToken] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              <Button size="sm" onClick={() => saveField(KEYS.clickupToken)} disabled={saveSettingsMutation.isPending || !drafts[KEYS.clickupToken]?.trim()} data-testid="button-save-clickup-token">
                <Save className="w-3.5 h-3.5 mr-1" /> Salvar
              </Button>
              {isClickupConnected && (
                <Button size="sm" variant="ghost" onClick={() => cancelEdit(KEYS.clickupToken)}>Cancelar</Button>
              )}
            </div>
          )}
        </div>
      </SectionCard>

      {/* === META === */}
      <SectionCard>
        <SectionHeader
          icon={<div className="w-4 h-4 rounded bg-gradient-to-br from-blue-500 to-blue-600" />}
          title="Meta Business Portfolio"
          subtitle="System User Token para publicação no Instagram e Facebook"
          badge={<ConnectionBadge connected={!!isMetaConnected} />}
        />

        <a
          href="https://business.facebook.com/settings/system-users"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-primary hover:underline inline-flex items-center gap-1"
        >
          Gerenciar usuários do sistema no Meta Business Suite <ExternalLink className="w-3 h-3" />
        </a>

        <div className="rounded-lg border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-950/20 px-3 py-2.5 flex gap-2 items-start">
          <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-relaxed">
            Use um <strong>System User Token</strong> em vez do token pessoal. Tokens de sistema são permanentes e não expiram (tokens de usuário expiram em 60 dias).
          </p>
        </div>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">System User Token</Label>
            {isMetaConnected && !editing[KEYS.metaSystemToken] ? (
              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center justify-between px-3 h-9 rounded-lg border bg-muted/30 font-mono text-xs text-muted-foreground">
                  <span>{s[KEYS.metaSystemToken]}</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
                </div>
                <Button size="sm" variant="outline" onClick={() => startEdit(KEYS.metaSystemToken)}>Editar</Button>
                <Button size="icon" variant="ghost" className="h-9 w-9 text-destructive hover:text-destructive" onClick={() => deleteSettingMutation.mutate(KEYS.metaSystemToken)} data-testid="button-remove-meta-token">
                  <Trash2 className="w-3.5 h-3.5" />
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
                    className="font-mono text-xs h-9 pr-9"
                    data-testid="input-meta-system-token"
                  />
                  <button type="button" onClick={() => setShowTokens(prev => ({ ...prev, [KEYS.metaSystemToken]: !prev[KEYS.metaSystemToken] }))} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showTokens[KEYS.metaSystemToken] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                {isMetaConnected && (
                  <Button size="sm" variant="ghost" onClick={() => cancelEdit(KEYS.metaSystemToken)}>Cancelar</Button>
                )}
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Business Portfolio ID</Label>
            {c[KEYS.metaPortfolioId] && !editing[KEYS.metaPortfolioId] ? (
              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center px-3 h-9 rounded-lg border bg-muted/30 font-mono text-xs text-muted-foreground">
                  {s[KEYS.metaPortfolioId]}
                </div>
                <Button size="sm" variant="outline" onClick={() => startEdit(KEYS.metaPortfolioId)}>Editar</Button>
                <Button size="icon" variant="ghost" className="h-9 w-9 text-destructive hover:text-destructive" onClick={() => deleteSettingMutation.mutate(KEYS.metaPortfolioId)} data-testid="button-remove-meta-portfolio">
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Ex: 123456789012345"
                  value={drafts[KEYS.metaPortfolioId] ?? ""}
                  onChange={e => setDrafts(prev => ({ ...prev, [KEYS.metaPortfolioId]: e.target.value }))}
                  className="font-mono text-xs h-9 flex-1"
                  data-testid="input-meta-portfolio-id"
                />
                {c[KEYS.metaPortfolioId] && (
                  <Button size="sm" variant="ghost" onClick={() => cancelEdit(KEYS.metaPortfolioId)}>Cancelar</Button>
                )}
              </div>
            )}
            <p className="text-[11px] text-muted-foreground">Meta Business Suite → Configurações → Informações do negócio</p>
          </div>

          {(!isMetaConnected || editing[KEYS.metaSystemToken] || editing[KEYS.metaPortfolioId]) && (
            <div className="flex justify-end pt-1">
              <Button
                size="sm"
                onClick={() => {
                  const updates: Record<string, string> = {};
                  if (drafts[KEYS.metaSystemToken]?.trim()) updates[KEYS.metaSystemToken] = drafts[KEYS.metaSystemToken];
                  if (drafts[KEYS.metaPortfolioId]?.trim()) updates[KEYS.metaPortfolioId] = drafts[KEYS.metaPortfolioId];
                  if (Object.keys(updates).length === 0) return;
                  saveSettingsMutation.mutate(updates, {
                    onSuccess: () => {
                      setEditing({});
                      setDrafts({});
                    },
                  });
                }}
                disabled={saveSettingsMutation.isPending || (!drafts[KEYS.metaSystemToken]?.trim() && !drafts[KEYS.metaPortfolioId]?.trim())}
                data-testid="button-save-meta"
              >
                <Save className="w-3.5 h-3.5 mr-1.5" />
                {saveSettingsMutation.isPending ? "Salvando..." : "Salvar credenciais Meta"}
              </Button>
            </div>
          )}
        </div>
      </SectionCard>

      {/* Info */}
      <div className="rounded-xl border bg-muted/30 px-4 py-3.5 space-y-2">
        <p className="text-xs font-semibold">Como as credenciais são usadas?</p>
        <ul className="text-[11px] text-muted-foreground space-y-1 list-disc list-inside leading-relaxed">
          <li>O token do ClickUp cria e move tarefas automaticamente nas listas vinculadas a cada projeto</li>
          <li>O token do Meta publica conteúdo aprovado direto no Instagram e Facebook dos clientes</li>
          <li>Credenciais ficam armazenadas no servidor — nunca são expostas no frontend</li>
        </ul>
      </div>
    </div>
  );
}
