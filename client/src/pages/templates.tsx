import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, FileText, Trash2, Edit, Globe, FolderKanban } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import type { Template, Project } from "@shared/schema";
import { insertTemplateSchema } from "@shared/schema";
import { zodResolver } from "@hookform/resolvers/zod";

export default function Templates() {
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState<Template | null>(null);
  const { toast } = useToast();

  const { data: templates = [], isLoading } = useQuery<Template[]>({ queryKey: ["/api/templates"] });
  const { data: projects = [] } = useQuery<Project[]>({ queryKey: ["/api/projects"] });

  const form = useForm({
    defaultValues: { name: "", description: "", platform: "any", format: "any", captionTemplate: "", promptTemplate: "", category: "", isGlobal: true, projectId: null as number | null },
  });

  const openCreate = () => { setEditItem(null); form.reset({ name: "", description: "", platform: "any", format: "any", captionTemplate: "", promptTemplate: "", category: "", isGlobal: true, projectId: null }); setOpen(true); };
  const openEdit = (t: Template) => { setEditItem(t); form.reset({ name: t.name, description: t.description || "", platform: t.platform || "any", format: t.format || "any", captionTemplate: t.captionTemplate || "", promptTemplate: t.promptTemplate || "", category: t.category || "", isGlobal: t.isGlobal ?? true, projectId: t.projectId || null }); setOpen(true); };

  const saveMutation = useMutation({
    mutationFn: (data: any) => {
      const cleaned = { ...data, platform: data.platform === "any" ? null : data.platform, format: data.format === "any" ? null : data.format };
      return editItem ? apiRequest("PATCH", `/api/templates/${editItem.id}`, cleaned) : apiRequest("POST", "/api/templates", cleaned);
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/templates"] }); setOpen(false); toast({ title: editItem ? "Template atualizado!" : "Template criado!" }); },
    onError: () => toast({ title: "Erro ao salvar template", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/templates/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/templates"] }); toast({ title: "Template removido" }); },
  });

  const platformLabels: Record<string, string> = { instagram: "Instagram", linkedin: "LinkedIn" };
  const formatLabels: Record<string, string> = { post: "Post", story: "Story", carrossel: "Carrossel", reels: "Reels" };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Templates</h1>
          <p className="text-sm text-muted-foreground">Modelos de conteúdo reutilizáveis</p>
        </div>
        <Button size="sm" onClick={openCreate} data-testid="button-create-template">
          <Plus className="w-4 h-4 mr-1" /> Novo Template
        </Button>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-3">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-32 rounded-md" />)}
        </div>
      ) : templates.length === 0 ? (
        <Card>
          <CardContent className="p-12 flex flex-col items-center gap-3">
            <FileText className="w-12 h-12 text-muted-foreground" />
            <p className="text-sm text-muted-foreground text-center">Nenhum template ainda.<br />Crie templates para agilizar a produção.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          {templates.map((t) => (
            <Card key={t.id} className="group" data-testid={`template-${t.id}`}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-foreground">{t.name}</p>
                    {t.isGlobal && <Badge variant="secondary" className="text-xs"><Globe className="w-3 h-3 mr-1" />Global</Badge>}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => openEdit(t)}>
                      <Edit className="w-3.5 h-3.5 text-muted-foreground" />
                    </Button>
                    <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => deleteMutation.mutate(t.id)}>
                      <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
                {t.description && <p className="text-xs text-muted-foreground">{t.description}</p>}
                <div className="flex flex-wrap gap-1">
                  {t.platform && <Badge variant="outline" className="text-xs">{platformLabels[t.platform] || t.platform}</Badge>}
                  {t.format && <Badge variant="outline" className="text-xs">{formatLabels[t.format] || t.format}</Badge>}
                  {t.category && <Badge variant="outline" className="text-xs">{t.category}</Badge>}
                </div>
                {t.captionTemplate && (
                  <p className="text-xs text-muted-foreground bg-muted rounded-sm p-2 line-clamp-2">{t.captionTemplate}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editItem ? "Editar Template" : "Criar Template"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit((d) => saveMutation.mutate(d))} className="space-y-3">
            <div className="space-y-1">
              <Label>Nome *</Label>
              <Input placeholder="Ex: Post de Lançamento" data-testid="input-template-name" {...form.register("name", { required: true })} />
            </div>
            <div className="grid grid-cols-2 gap-2">
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
              <Label>Categoria</Label>
              <Input placeholder="Ex: Lançamento, Engajamento, Educativo..." {...form.register("category")} />
            </div>
            <div className="space-y-1">
              <Label>Template de Legenda</Label>
              <Textarea placeholder="Ex: [HEADLINE]\n\n[CORPO DO POST]\n\nO que você achou? Conta nos comentários!" rows={4} className="resize-none" {...form.register("captionTemplate")} />
            </div>
            <div className="space-y-1">
              <Label>Template de Prompt para IA</Label>
              <Textarea placeholder="Ex: Crie um post sobre [TÓPICO] para [PÚBLICO], com tom [TOM]..." rows={3} className="resize-none" {...form.register("promptTemplate")} />
            </div>
            <div className="space-y-1">
              <Label>Descrição</Label>
              <Input placeholder="Para que serve este template?" {...form.register("description")} />
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" size="sm" disabled={saveMutation.isPending} data-testid="button-submit-template">
                {saveMutation.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
