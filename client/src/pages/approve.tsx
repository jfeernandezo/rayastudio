import { useState } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, MessageSquare, Loader2, Image, AlertCircle } from "lucide-react";
import type { ContentPiece, Project } from "@shared/schema";

const platformLabels: Record<string, string> = { instagram: "Instagram", linkedin: "LinkedIn" };
const formatLabels: Record<string, string> = { post: "Post", story: "Story", carrossel: "Carrossel", reels: "Reels" };

export default function ApprovePage() {
  const { token } = useParams<{ token: string }>();
  const [revisionComment, setRevisionComment] = useState("");
  const [showRevisionForm, setShowRevisionForm] = useState(false);
  const [done, setDone] = useState<"approved" | "revision" | null>(null);

  const { data, isLoading, error } = useQuery<{ content: ContentPiece; project: Project }>({
    queryKey: ["/api/approve", token],
    queryFn: async () => {
      const res = await fetch(`/api/approve/${token}`);
      if (!res.ok) throw new Error("Link inválido");
      return res.json();
    },
    retry: false,
  });

  const actionMutation = useMutation({
    mutationFn: async ({ action, comment }: { action: string; comment?: string }) => {
      const res = await fetch(`/api/approve/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, comment }),
      });
      if (!res.ok) throw new Error("Erro ao processar");
      return res.json();
    },
    onSuccess: (_, vars) => {
      setDone(vars.action as "approved" | "revision");
    },
  });

  const getBrandColor = (project: Project) => {
    const c = project.brandColors as any;
    if (c?.dominant) return c.dominant;
    if (Array.isArray(c) && c[0]) return c[0];
    return "#6B46C1";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <AlertCircle className="w-12 h-12 text-gray-300 mx-auto" />
          <p className="text-lg font-medium text-gray-700">Link inválido ou expirado</p>
          <p className="text-sm text-gray-500">Este link de aprovação não existe ou já foi removido.</p>
        </div>
      </div>
    );
  }

  const { content, project } = data;
  const brandColor = getBrandColor(project);

  if (done === "approved") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center space-y-4 max-w-sm">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <p className="text-xl font-semibold text-gray-800">Conteúdo aprovado!</p>
          <p className="text-sm text-gray-500">Obrigado pela aprovação. O conteúdo foi marcado como aprovado e a equipe foi notificada.</p>
        </div>
      </div>
    );
  }

  if (done === "revision") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center space-y-4 max-w-sm">
          <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto">
            <MessageSquare className="w-8 h-8 text-amber-600" />
          </div>
          <p className="text-xl font-semibold text-gray-800">Solicitação enviada!</p>
          <p className="text-sm text-gray-500">O seu pedido de alteração foi registrado. A equipe irá revisar e entrar em contato.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div
        className="h-1.5 w-full"
        style={{ backgroundColor: brandColor }}
      />

      <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
        <div className="text-center space-y-1">
          <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Aprovação de Conteúdo</p>
          <p className="text-sm font-semibold text-gray-700">{project.clientName || project.name}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {content.imageUrl ? (
            <div className="w-full bg-gray-100">
              <img
                src={content.imageUrl}
                alt={content.title}
                className="w-full object-contain max-h-80"
              />
            </div>
          ) : (
            <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
              <div className="text-center space-y-2">
                <Image className="w-10 h-10 text-gray-300 mx-auto" />
                <p className="text-xs text-gray-400">Sem imagem</p>
              </div>
            </div>
          )}

          <div className="p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-semibold text-gray-900 leading-snug">{content.title}</h2>
              <div className="flex gap-1.5 shrink-0">
                <Badge variant="outline" className="text-xs">{platformLabels[content.platform] || content.platform}</Badge>
                <Badge variant="outline" className="text-xs">{formatLabels[content.format] || content.format}</Badge>
              </div>
            </div>

            {content.caption && (
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Legenda</p>
                <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{content.caption}</p>
              </div>
            )}

            {content.hashtags && (
              <p className="text-sm text-blue-500 leading-relaxed">{content.hashtags}</p>
            )}

            {content.scheduledDate && (
              <p className="text-xs text-gray-400">
                Publicação prevista: <span className="font-medium">{content.scheduledDate}</span>
              </p>
            )}
          </div>
        </div>

        {content.status === "approved" ? (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
            <CheckCircle2 className="w-5 h-5 text-green-600 mx-auto mb-1" />
            <p className="text-sm font-medium text-green-800">Este conteúdo já foi aprovado</p>
          </div>
        ) : (
          <div className="space-y-3">
            {!showRevisionForm ? (
              <div className="flex gap-3">
                <Button
                  className="flex-1 h-12 text-base font-semibold"
                  style={{ backgroundColor: brandColor, borderColor: brandColor }}
                  onClick={() => actionMutation.mutate({ action: "approve" })}
                  disabled={actionMutation.isPending}
                  data-testid="button-approve"
                >
                  {actionMutation.isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <><CheckCircle2 className="w-5 h-5 mr-2" /> Aprovar</>
                  )}
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 h-12 text-base"
                  onClick={() => setShowRevisionForm(true)}
                  disabled={actionMutation.isPending}
                  data-testid="button-request-revision"
                >
                  <MessageSquare className="w-5 h-5 mr-2" /> Pedir Alteração
                </Button>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
                <p className="text-sm font-medium text-gray-800">O que precisa ser alterado?</p>
                <Textarea
                  value={revisionComment}
                  onChange={(e) => setRevisionComment(e.target.value)}
                  placeholder="Descreva o que precisa mudar na legenda, imagem, tom de voz..."
                  rows={4}
                  className="resize-none"
                  data-testid="input-revision-comment"
                />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowRevisionForm(false)}
                    className="flex-1"
                  >
                    Voltar
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => actionMutation.mutate({ action: "revision", comment: revisionComment })}
                    disabled={actionMutation.isPending || !revisionComment.trim()}
                    data-testid="button-send-revision"
                  >
                    {actionMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Enviar Solicitação"}
                  </Button>
                </div>
              </div>
            )}
            <p className="text-xs text-center text-gray-400">
              Ao aprovar, você confirma que o conteúdo está pronto para publicação.
            </p>
          </div>
        )}

        <p className="text-center text-xs text-gray-300">Produzido por Raya Studio</p>
      </div>
    </div>
  );
}
