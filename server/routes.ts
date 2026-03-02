import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertProjectSchema, insertContentPieceSchema, insertTemplateSchema, insertKnowledgeBaseSchema, insertPromptSchema } from "@shared/schema";
import OpenAI from "openai";
import multer from "multer";
import { z } from "zod";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {

  // --- PROJECTS ---
  app.get("/api/projects", async (req, res) => {
    try {
      const result = await storage.getProjects();
      res.json(result);
    } catch (e) { res.status(500).json({ error: "Failed to fetch projects" }); }
  });

  app.get("/api/projects/:id", async (req, res) => {
    try {
      const p = await storage.getProject(Number(req.params.id));
      if (!p) return res.status(404).json({ error: "Project not found" });
      res.json(p);
    } catch (e) { res.status(500).json({ error: "Failed to fetch project" }); }
  });

  app.post("/api/projects", async (req, res) => {
    try {
      const data = insertProjectSchema.parse(req.body);
      const p = await storage.createProject(data);
      res.status(201).json(p);
    } catch (e) { res.status(400).json({ error: String(e) }); }
  });

  app.patch("/api/projects/:id", async (req, res) => {
    try {
      const p = await storage.updateProject(Number(req.params.id), req.body);
      res.json(p);
    } catch (e) { res.status(500).json({ error: "Failed to update project" }); }
  });

  app.delete("/api/projects/:id", async (req, res) => {
    try {
      await storage.deleteProject(Number(req.params.id));
      res.status(204).send();
    } catch (e) { res.status(500).json({ error: "Failed to delete project" }); }
  });

  // --- CONTENT PIECES ---
  app.get("/api/content", async (req, res) => {
    try {
      const projectId = req.query.projectId ? Number(req.query.projectId) : undefined;
      const result = await storage.getContentPieces(projectId);
      res.json(result);
    } catch (e) { res.status(500).json({ error: "Failed to fetch content" }); }
  });

  app.get("/api/content/:id", async (req, res) => {
    try {
      const p = await storage.getContentPiece(Number(req.params.id));
      if (!p) return res.status(404).json({ error: "Content not found" });
      res.json(p);
    } catch (e) { res.status(500).json({ error: "Failed to fetch content" }); }
  });

  app.post("/api/content", async (req, res) => {
    try {
      const data = insertContentPieceSchema.parse(req.body);
      const p = await storage.createContentPiece(data);
      res.status(201).json(p);
    } catch (e) { res.status(400).json({ error: String(e) }); }
  });

  app.patch("/api/content/:id", async (req, res) => {
    try {
      const p = await storage.updateContentPiece(Number(req.params.id), req.body);
      res.json(p);
    } catch (e) { res.status(500).json({ error: "Failed to update content" }); }
  });

  app.delete("/api/content/:id", async (req, res) => {
    try {
      await storage.deleteContentPiece(Number(req.params.id));
      res.status(204).send();
    } catch (e) { res.status(500).json({ error: "Failed to delete content" }); }
  });

  // Generate approval share link for a content piece
  app.post("/api/content/:id/share", async (req, res) => {
    try {
      const piece = await storage.getContentPiece(Number(req.params.id));
      if (!piece) return res.status(404).json({ error: "Content not found" });
      const updated = piece.approvalToken ? piece : await storage.generateApprovalToken(Number(req.params.id));
      res.json({ token: updated.approvalToken });
    } catch (e) { res.status(500).json({ error: "Failed to generate link" }); }
  });

  // Public approval routes (no auth required)
  app.get("/api/approve/:token", async (req, res) => {
    try {
      const piece = await storage.getContentByApprovalToken(req.params.token);
      if (!piece) return res.status(404).json({ error: "Link inválido ou expirado" });
      const project = await storage.getProject(piece.projectId);
      res.json({ content: piece, project });
    } catch (e) { res.status(500).json({ error: "Failed to fetch content" }); }
  });

  app.post("/api/approve/:token", async (req, res) => {
    try {
      const { action, comment } = req.body;
      const piece = await storage.getContentByApprovalToken(req.params.token);
      if (!piece) return res.status(404).json({ error: "Link inválido" });
      if (action === "approve") {
        const updated = await storage.updateContentPiece(piece.id, { status: "approved", approvalComment: null });
        res.json(updated);
      } else if (action === "revision") {
        const updated = await storage.updateContentPiece(piece.id, { status: "review", approvalComment: comment || "" });
        res.json(updated);
      } else {
        res.status(400).json({ error: "Ação inválida" });
      }
    } catch (e) { res.status(500).json({ error: "Failed to process action" }); }
  });

  // --- TEMPLATES ---
  app.get("/api/templates", async (req, res) => {
    try {
      const projectId = req.query.projectId ? Number(req.query.projectId) : undefined;
      const result = await storage.getTemplates(projectId);
      res.json(result);
    } catch (e) { res.status(500).json({ error: "Failed to fetch templates" }); }
  });

  app.post("/api/templates", async (req, res) => {
    try {
      const data = insertTemplateSchema.parse(req.body);
      const t = await storage.createTemplate(data);
      res.status(201).json(t);
    } catch (e) { res.status(400).json({ error: String(e) }); }
  });

  app.patch("/api/templates/:id", async (req, res) => {
    try {
      const t = await storage.updateTemplate(Number(req.params.id), req.body);
      res.json(t);
    } catch (e) { res.status(500).json({ error: "Failed to update template" }); }
  });

  app.delete("/api/templates/:id", async (req, res) => {
    try {
      await storage.deleteTemplate(Number(req.params.id));
      res.status(204).send();
    } catch (e) { res.status(500).json({ error: "Failed to delete template" }); }
  });

  // --- KNOWLEDGE BASE ---
  app.get("/api/knowledge", async (req, res) => {
    try {
      const projectId = req.query.projectId ? Number(req.query.projectId) : undefined;
      const result = await storage.getKnowledgeBase(projectId);
      res.json(result);
    } catch (e) { res.status(500).json({ error: "Failed to fetch knowledge base" }); }
  });

  app.post("/api/knowledge", async (req, res) => {
    try {
      const data = insertKnowledgeBaseSchema.parse(req.body);
      const k = await storage.createKnowledgeBaseItem(data);
      res.status(201).json(k);
    } catch (e) { res.status(400).json({ error: String(e) }); }
  });

  app.patch("/api/knowledge/:id", async (req, res) => {
    try {
      const k = await storage.updateKnowledgeBaseItem(Number(req.params.id), req.body);
      res.json(k);
    } catch (e) { res.status(500).json({ error: "Failed to update knowledge item" }); }
  });

  app.delete("/api/knowledge/:id", async (req, res) => {
    try {
      await storage.deleteKnowledgeBaseItem(Number(req.params.id));
      res.status(204).send();
    } catch (e) { res.status(500).json({ error: "Failed to delete knowledge item" }); }
  });

  // --- PROMPTS ---
  app.get("/api/prompts", async (req, res) => {
    try {
      const result = await storage.getPrompts();
      res.json(result);
    } catch (e) { res.status(500).json({ error: "Failed to fetch prompts" }); }
  });

  app.post("/api/prompts", async (req, res) => {
    try {
      const data = insertPromptSchema.parse(req.body);
      const p = await storage.createPrompt(data);
      res.status(201).json(p);
    } catch (e) { res.status(400).json({ error: String(e) }); }
  });

  app.patch("/api/prompts/:id", async (req, res) => {
    try {
      const p = await storage.updatePrompt(Number(req.params.id), req.body);
      res.json(p);
    } catch (e) { res.status(500).json({ error: "Failed to update prompt" }); }
  });

  app.delete("/api/prompts/:id", async (req, res) => {
    try {
      await storage.deletePrompt(Number(req.params.id));
      res.status(204).send();
    } catch (e) { res.status(500).json({ error: "Failed to delete prompt" }); }
  });

  // --- AI: GENERATE CAPTION ---
  app.post("/api/ai/caption", async (req, res) => {
    try {
      const { projectContext, platform, format, template, topic, tone, knowledgeContext } = req.body;

      const systemPrompt = `Você é um especialista em marketing digital e criação de conteúdo para redes sociais. 
      Crie conteúdo em português brasileiro, direto, autêntico e envolvente.
      ${projectContext ? `Contexto do projeto: ${projectContext}` : ""}
      ${knowledgeContext ? `Base de conhecimento: ${knowledgeContext}` : ""}`;

      const userPrompt = `Crie uma legenda para ${platform === "instagram" ? "Instagram" : "LinkedIn"} 
      Formato: ${format}
      Tópico: ${topic}
      Tom: ${tone || "profissional e engajante"}
      ${template ? `Use este template como base: ${template}` : ""}
      
      Retorne um JSON com:
      - caption: a legenda completa
      - hashtags: string com hashtags relevantes
      - imagePrompt: descrição em inglês para gerar uma imagem complementar`;

      const response = await openai.chat.completions.create({
        model: "gpt-5.1",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 2000,
      });

      const result = JSON.parse(response.choices[0]?.message?.content || "{}");
      res.json(result);
    } catch (e) { res.status(500).json({ error: "Failed to generate caption" }); }
  });

  // --- AI: GENERATE IMAGE ---
  app.post("/api/ai/image", async (req, res) => {
    try {
      const { prompt, platform, format, brandColors, style } = req.body;

      const enhancedPrompt = `${prompt}. 
      ${platform === "instagram" ? "Square or portrait format, highly visual, Instagram-worthy" : "Professional, LinkedIn appropriate, clean and modern"}.
      ${style ? `Style: ${style}` : ""}
      ${brandColors?.length ? `Use these brand colors: ${brandColors.join(", ")}` : ""}
      High quality, professional marketing image.`;

      const size = platform === "instagram" && format === "story" ? "1024x1024" : "1024x1024";

      const response = await openai.images.generate({
        model: "gpt-image-1",
        prompt: enhancedPrompt,
        n: 1,
        size,
      });

      const imageData = response.data[0];
      res.json({ b64_json: imageData.b64_json, url: imageData.url });
    } catch (e) {
      console.error("Image generation error:", e);
      res.status(500).json({ error: "Failed to generate image" });
    }
  });

  // --- AI: ANALYZE IMAGE ---
  app.post("/api/ai/analyze-image", upload.single("image"), async (req, res) => {
    try {
      let imageContent: any;

      if (req.file) {
        const base64 = req.file.buffer.toString("base64");
        const mimeType = req.file.mimetype;
        imageContent = {
          type: "image_url",
          image_url: { url: `data:${mimeType};base64,${base64}` }
        };
      } else if (req.body.imageUrl) {
        imageContent = { type: "image_url", image_url: { url: req.body.imageUrl } };
      } else {
        return res.status(400).json({ error: "Image required" });
      }

      const response = await openai.chat.completions.create({
        model: "gpt-5.1",
        messages: [{
          role: "user",
          content: [
            imageContent,
            {
              type: "text",
              text: `Analise esta imagem em detalhes para replicar o estilo de conteúdo. Retorne um JSON com:
              - description: descrição detalhada da imagem
              - style: estilo visual (cores, composição, mood)
              - contentType: tipo de conteúdo (produto, lifestyle, corporativo, etc)
              - copyElements: elementos de texto visíveis
              - targetAudience: público-alvo provável
              - suggestedCaption: sugestão de legenda em português
              - imagePromptToReplicate: prompt em inglês para replicar este estilo de imagem`
            }
          ]
        }],
        response_format: { type: "json_object" },
        max_completion_tokens: 2000,
      });

      const result = JSON.parse(response.choices[0]?.message?.content || "{}");
      res.json(result);
    } catch (e) {
      console.error("Image analysis error:", e);
      res.status(500).json({ error: "Failed to analyze image" });
    }
  });

  // --- AI: CALENDAR GENERATOR ---
  app.post("/api/ai/calendar", async (req, res) => {
    try {
      const { projectContext, period, platforms, formats, topics, instructions } = req.body;

      const response = await openai.chat.completions.create({
        model: "gpt-5.1",
        messages: [{
          role: "system",
          content: `Você é um especialista em estratégia de conteúdo para redes sociais. 
          Crie calendários de conteúdo quinzenais, relevantes e variados.`
        }, {
          role: "user",
          content: `Crie um calendário de conteúdo quinzenal para o período ${period}.
          Projeto: ${projectContext}
          Plataformas: ${platforms?.join(", ")}
          Formatos: ${formats?.join(", ")}
          Tópicos sugeridos: ${topics || "variado"}
          Instruções: ${instructions || ""}
          
          Retorne um JSON com array "posts" onde cada post tem:
          - date: data no formato YYYY-MM-DD
          - title: título do conteúdo
          - platform: instagram ou linkedin
          - format: post, story, carrossel ou reels
          - topic: tópico/tema
          - objective: objetivo do post (engajamento, vendas, educação, etc)`
        }],
        response_format: { type: "json_object" },
        max_completion_tokens: 3000,
      });

      const result = JSON.parse(response.choices[0]?.message?.content || "{}");
      res.json(result);
    } catch (e) { res.status(500).json({ error: "Failed to generate calendar" }); }
  });

  return httpServer;
}
