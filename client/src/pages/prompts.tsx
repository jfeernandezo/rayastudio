import { useState } from "react";
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
import { Plus, Zap, Trash2, Edit, Copy } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import type { Prompt } from "@shared/schema";

const platformLabels: Record<string, string> = { instagram: "Instagram", linkedin: "LinkedIn" };
const formatLabels: Record<string, string> = { post: "Post", story: "Story", carrossel: "Carrossel", reels: "Reels" };

const categoryOptions = ["Engajamento", "Venda", "Educativo", "Storytelling", "Inspiracional", "Produto", "Serviço", "Nicho", "Outro"];

export default function Prompts() {
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState<Prompt | null>(null);
  const { toast } = useToast();

  const { data: prompts = [], isLoading } = useQuery<Prompt[]>({ queryKey: ["/api/prompts"] });

  const form = useForm({ defaultValues: { name: "", content: "", category: "Engajamento", platform: "any", format: "any" } });

  const openCreate = () => { setEditItem(null); form.reset({ name: "", content: "", category: "Engajamento", platform: "any", format: "any" }); setOpen(true); };
  const openEdit = (p: Prompt) => { setEditItem(p); form.reset({ name: p.name, content: p.content, category: p.category || "Engajamento", platform: p.platform || "any", format: p.format || "any" }); setOpen(true); };

  const saveMutation = useMutation({
    mutationFn: (data: any) => {
      const cleaned = { ...data, platform: data.platform === "any" ? null : data.platform, format: data.format === "any" ? null : data.format };
      return editItem ? apiRequest("PATCH", `/api/prompts/${editItem.id}`, cleaned) : apiRequest("POST", "/api/prompts", cleaned);
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/prompts"] }); setOpen(false); toast({ title: editItem ? "Prompt atualizado!" : "Prompt criado!" }); },
    onError: () => toast({ title: "Erro ao salvar prompt", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/prompts/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/prompts"] }); toast({ title: "Prompt removido" }); },
  });

  const copyPrompt = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({ title: "Prompt copiado!" });
  };

  const grouped = prompts.reduce((acc, p) => {
    const cat = p.category || "Geral";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(p);
    return acc;
  }, {} as Record<string, Prompt[]>);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Prompts</h1>
          <p className="text-sm text-muted-foreground">Prompts pré-configurados para produção de conteúdo</p>
        </div>
        <Button size="sm" onClick={openCreate} data-testid="button-create-prompt">
          <Plus className="w-4 h-4 mr-1" /> Novo Prompt
        </Button>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-3">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-28 rounded-md" />)}
        </div>
      ) : prompts.length === 0 ? (
        <Card>
          <CardContent className="p-12 flex flex-col items-center gap-3">
            <Zap className="w-12 h-12 text-muted-foreground" />
            <p className="text-sm text-muted-foreground text-center">
              Nenhum prompt criado.<br />Adicione prompts para agilizar a geração de conteúdo.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([category, items]) => (
            <div key={category} className="space-y-2">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{category}</h2>
              <div className="grid md:grid-cols-2 gap-3">
                {items.map((p) => (
                  <Card key={p.id} className="group" data-testid={`prompt-${p.id}`}>
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <Zap className="w-4 h-4 text-primary shrink-0" />
                          <p className="text-sm font-medium text-foreground">{p.name}</p>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => copyPrompt(p.content)}>
                            <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                          </Button>
                          <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => openEdit(p)}>
                            <Edit className="w-3.5 h-3.5 text-muted-foreground" />
                          </Button>
                          <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => deleteMutation.mutate(p.id)}>
                            <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-3 bg-muted rounded-sm p-2">{p.content}</p>
                      <div className="flex flex-wrap gap-1">
                        {p.platform && <Badge variant="outline" className="text-xs">{platformLabels[p.platform] || p.platform}</Badge>}
                        {p.format && <Badge variant="outline" className="text-xs">{formatLabels[p.format] || p.format}</Badge>}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editItem ? "Editar Prompt" : "Criar Prompt"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit((d) => saveMutation.mutate(d))} className="space-y-3">
            <div className="space-y-1">
              <Label>Nome *</Label>
              <Input placeholder="Ex: Hook de Engajamento" data-testid="input-prompt-name" {...form.register("name", { required: true })} />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label>Categoria</Label>
                <Controller name="category" control={form.control} render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="h-8"><SelectValue placeholder="Qualquer" /></SelectTrigger>
                    <SelectContent>
                      {categoryOptions.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )} />
              </div>
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
              <Label>Conteúdo do Prompt *</Label>
              <Textarea
                placeholder="Ex: Crie um hook poderoso para este post que faça o leitor parar o scroll. Comece com uma pergunta provocativa ou dado surpreendente..."
                rows={6}
                className="resize-none"
                data-testid="input-prompt-content"
                {...form.register("content", { required: true })}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" size="sm" disabled={saveMutation.isPending} data-testid="button-submit-prompt">
                {saveMutation.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
