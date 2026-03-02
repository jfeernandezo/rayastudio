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
import { Plus, BookOpen, Trash2, Edit, Search } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import type { KnowledgeBase, Project } from "@shared/schema";

const categories = ["Marca", "Produto/Serviço", "Público-Alvo", "Concorrência", "Tom de Voz", "Referências", "Outro"];

export default function KnowledgeBasePage() {
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState<KnowledgeBase | null>(null);
  const [search, setSearch] = useState("");
  const [filterProject, setFilterProject] = useState<string>("all");
  const { toast } = useToast();

  const { data: items = [], isLoading } = useQuery<KnowledgeBase[]>({ queryKey: ["/api/knowledge"] });
  const { data: projects = [] } = useQuery<Project[]>({ queryKey: ["/api/projects"] });

  const form = useForm({ defaultValues: { title: "", content: "", category: "", tags: [] as string[], projectId: null as number | null } });

  const openCreate = () => { setEditItem(null); form.reset({ title: "", content: "", category: "", tags: [], projectId: null }); setOpen(true); };
  const openEdit = (item: KnowledgeBase) => { setEditItem(item); form.reset({ title: item.title, content: item.content, category: item.category || "", tags: item.tags || [], projectId: item.projectId || null }); setOpen(true); };

  const saveMutation = useMutation({
    mutationFn: (data: any) => editItem ? apiRequest("PATCH", `/api/knowledge/${editItem.id}`, data) : apiRequest("POST", "/api/knowledge", data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/knowledge"] }); setOpen(false); toast({ title: editItem ? "Item atualizado!" : "Item criado!" }); },
    onError: () => toast({ title: "Erro ao salvar", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/knowledge/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/knowledge"] }); toast({ title: "Item removido" }); },
  });

  const filtered = items.filter(item => {
    const matchSearch = !search || item.title.toLowerCase().includes(search.toLowerCase()) || item.content.toLowerCase().includes(search.toLowerCase());
    const matchProject = filterProject === "all" || String(item.projectId) === filterProject;
    return matchSearch && matchProject;
  });

  const grouped = filtered.reduce((acc, item) => {
    const cat = item.category || "Outro";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {} as Record<string, KnowledgeBase[]>);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Base de Conhecimento</h1>
          <p className="text-sm text-muted-foreground">Contextos, referências e informações da marca</p>
        </div>
        <Button size="sm" onClick={openCreate} data-testid="button-create-knowledge">
          <Plus className="w-4 h-4 mr-1" /> Adicionar
        </Button>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input placeholder="Buscar..." className="pl-8 h-8" value={search} onChange={(e) => setSearch(e.target.value)} data-testid="input-search-knowledge" />
        </div>
        <Select value={filterProject} onValueChange={setFilterProject}>
          <SelectTrigger className="w-40 h-8"><SelectValue placeholder="Todos projetos" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {projects.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1,2].map(i => <Skeleton key={i} className="h-40 rounded-md" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="p-12 flex flex-col items-center gap-3">
            <BookOpen className="w-12 h-12 text-muted-foreground" />
            <p className="text-sm text-muted-foreground text-center">
              {search ? "Nenhum resultado encontrado." : "Nenhum item na base de conhecimento.\nAdicione contextos e referências sobre seus clientes."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([category, categoryItems]) => (
            <div key={category} className="space-y-2">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{category}</h2>
              <div className="grid md:grid-cols-2 gap-3">
                {categoryItems.map((item) => (
                  <Card key={item.id} className="group" data-testid={`knowledge-item-${item.id}`}>
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-foreground">{item.title}</p>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => openEdit(item)}>
                            <Edit className="w-3.5 h-3.5 text-muted-foreground" />
                          </Button>
                          <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => deleteMutation.mutate(item.id)}>
                            <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-3">{item.content}</p>
                      <div className="flex flex-wrap gap-1">
                        {item.projectId && (
                          <Badge variant="secondary" className="text-xs">
                            {projects.find(p => p.id === item.projectId)?.name || "Projeto"}
                          </Badge>
                        )}
                        {item.tags?.map((tag, i) => (
                          <Badge key={i} variant="outline" className="text-xs">{tag}</Badge>
                        ))}
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
            <DialogTitle>{editItem ? "Editar Item" : "Adicionar à Base de Conhecimento"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit((d) => saveMutation.mutate(d))} className="space-y-3">
            <div className="space-y-1">
              <Label>Título *</Label>
              <Input placeholder="Ex: Público-Alvo Principal" data-testid="input-knowledge-title" {...form.register("title", { required: true })} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>Categoria</Label>
                <Controller name="category" control={form.control} render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="h-8"><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                    <SelectContent>
                      {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )} />
              </div>
              <div className="space-y-1">
                <Label>Projeto</Label>
                <Controller name="projectId" control={form.control} render={({ field }) => (
                  <Select value={field.value ? String(field.value) : "general"} onValueChange={(v) => field.onChange(v === "general" ? null : Number(v))}>
                    <SelectTrigger className="h-8"><SelectValue placeholder="Geral" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">Geral</SelectItem>
                      {projects.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Conteúdo *</Label>
              <Textarea placeholder="Descreva em detalhes este contexto..." rows={6} className="resize-none" data-testid="input-knowledge-content" {...form.register("content", { required: true })} />
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" size="sm" disabled={saveMutation.isPending} data-testid="button-submit-knowledge">
                {saveMutation.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
