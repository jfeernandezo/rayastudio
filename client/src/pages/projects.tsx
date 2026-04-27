import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, FolderKanban, ArrowRight, Trash2, Palette, MessageSquareText } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertProjectSchema, type Project } from "@shared/schema";
import { z } from "zod";

const formSchema = insertProjectSchema.extend({
  name: z.string().min(1, "Nome obrigatório"),
});

type FormData = z.infer<typeof formSchema>;

export default function Projects() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const { data: projects = [], isLoading } = useQuery<Project[]>({ queryKey: ["/api/projects"] });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", description: "", clientName: "", brandColors: null, niche: [], formats: [], rules: "", instructions: "" },
  });

  const createMutation = useMutation({
    mutationFn: (data: FormData) => apiRequest("POST", "/api/projects", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      setOpen(false);
      form.reset();
      toast({ title: "Projeto criado!" });
    },
    onError: () => toast({ title: "Erro ao criar projeto", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/projects/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({ title: "Projeto removido" });
    },
    onError: () => toast({ title: "Erro ao remover projeto", variant: "destructive" }),
  });

  return (
    <div className="page-shell space-y-6">
      <div className="page-heading">
        <div>
          <p className="text-xs font-semibold uppercase text-primary">Clientes</p>
          <h1 className="page-title">Projetos</h1>
          <p className="page-subtitle">Cada projeto guarda contexto, marca, briefing e produção de conteúdo.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" data-testid="button-create-project">
              <Plus className="w-4 h-4 mr-1" />
              Novo Projeto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Criar Projeto</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-3 gap-2 rounded-xl bg-muted/40 p-2 text-center">
              {["Cliente", "Marca", "Esteira"].map((step, index) => (
                <div key={step} className="rounded-lg bg-background/80 px-2 py-2 border">
                  <p className="text-[10px] text-primary font-bold">{index + 1}</p>
                  <p className="text-xs font-medium">{step}</p>
                </div>
              ))}
            </div>
            <form onSubmit={form.handleSubmit((d) => createMutation.mutate(d))} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="name">Nome do Projeto *</Label>
                <Input id="name" placeholder="Ex: Marca XYZ" data-testid="input-project-name" {...form.register("name")} />
                {form.formState.errors.name && <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>}
              </div>
              <div className="space-y-1">
                <Label htmlFor="clientName">Cliente</Label>
                <Input id="clientName" placeholder="Nome do cliente" data-testid="input-client-name" {...form.register("clientName")} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="description">Descrição</Label>
                <Textarea id="description" placeholder="Sobre este projeto..." rows={3} data-testid="input-description" {...form.register("description")} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="instructions">Instruções de Tom e Voz</Label>
                <Textarea id="instructions" placeholder="Como deve ser o tom de comunicação..." rows={2} data-testid="input-instructions" {...form.register("instructions")} />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button type="submit" size="sm" disabled={createMutation.isPending} data-testid="button-submit-project">
                  {createMutation.isPending ? "Criando..." : "Criar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
      ) : projects.length === 0 ? (
        <Card>
          <CardContent className="p-12 flex flex-col items-center gap-3">
            <FolderKanban className="w-12 h-12 text-muted-foreground" />
            <p className="text-sm text-muted-foreground text-center">Nenhum projeto criado ainda.<br />Clique em "Novo Projeto" para começar.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
          {projects.map((project) => (
            <Card key={project.id} className="group overflow-hidden border-border/80" data-testid={`project-${project.id}`}>
              <div className="h-1.5 bg-primary/70" style={{ backgroundColor: ((project as any).brandColors?.accent || (project as any).brandColors?.dominant || undefined) }} />
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <FolderKanban className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-sm text-foreground">{project.name}</p>
                        {project.clientName && (
                          <p className="text-xs text-muted-foreground">{project.clientName}</p>
                        )}
                        {project.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{project.description}</p>
                        )}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button
                          variant="ghost" size="icon"
                          className="w-7 h-7 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => deleteMutation.mutate(project.id)}
                          data-testid={`button-delete-project-${project.id}`}
                        >
                          <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-4">
                      <div className="rounded-lg bg-muted/45 border p-2">
                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                          <Palette className="w-3 h-3" /> Marca
                        </div>
                        <p className="text-xs font-medium mt-1 truncate">{(project as any).brandColors ? "Paleta definida" : "A definir"}</p>
                      </div>
                      <div className="rounded-lg bg-muted/45 border p-2">
                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                          <MessageSquareText className="w-3 h-3" /> Tom
                        </div>
                        <p className="text-xs font-medium mt-1 truncate">{project.instructions ? "Orientado" : "A definir"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                      <Button size="sm" asChild className="h-8 text-xs">
                        <Link href={`/projects/${project.id}`}>
                          Abrir projeto <ArrowRight className="w-3 h-3 ml-1" />
                        </Link>
                      </Button>
                      {(project as any).clickupListId && (
                        <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-[#7B68EE]/10 text-[#7B68EE] font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#7B68EE]" /> ClickUp
                        </span>
                      )}
                      {(project as any).metaInstagramAccountId && (
                        <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Meta
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
