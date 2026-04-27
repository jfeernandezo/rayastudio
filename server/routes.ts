import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertProjectSchema, insertContentPieceSchema, insertTemplateSchema, insertKnowledgeBaseSchema, insertPromptSchema, insertAgentProfileSchema } from "@shared/schema";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import multer from "multer";
import { z } from "zod";
import path from "path";
import fs from "fs";
import express from "express";
import passport from "passport";
import { requireAuth, hashPassword, comparePasswords } from "./auth";
import { LOCAL_ASSETS_DIR, storeGeneratedImage } from "./asset-storage";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

const FONTS_DIR = path.join(process.cwd(), "uploads", "fonts");
fs.mkdirSync(FONTS_DIR, { recursive: true });

const fontStorage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const dir = path.join(FONTS_DIR, String(req.params.id));
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});

const fontUpload = multer({
  storage: fontStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [".ttf", ".otf", ".woff", ".woff2"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error("Formato inválido. Use TTF, OTF, WOFF ou WOFF2."));
  },
});

// ── Helper: get OpenAI client (custom key > Replit integration) ──
async function getOpenAIClient() {
  const customKey = await storage.getSetting("ai_openai_key");
  if (customKey) return new OpenAI({ apiKey: customKey });
  return new OpenAI({
    apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
    baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  });
}

// ── Helper: generate text with any provider ──
async function generateTextContent({
  provider,
  model,
  systemPrompt,
  userPrompt,
  jsonMode = true,
  maxTokens = 2000,
}: {
  provider: string;
  model: string;
  systemPrompt: string;
  userPrompt: string;
  jsonMode?: boolean;
  maxTokens?: number;
}): Promise<string> {
  if (provider === "anthropic") {
    const key = await storage.getSetting("ai_anthropic_key");
    if (!key) throw new Error("Chave da API Anthropic não configurada em Configurações → IA.");
    const client = new Anthropic({ apiKey: key });
    const finalPrompt = jsonMode
      ? `${userPrompt}\n\nIMPORTANTE: Retorne SOMENTE JSON válido, sem markdown, sem explicações, apenas o objeto JSON.`
      : userPrompt;
    const res = await client.messages.create({
      model,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: "user", content: finalPrompt }],
    });
    return (res.content[0] as any)?.text || "{}";
  }

  if (provider === "gemini") {
    const key = await storage.getSetting("ai_gemini_key");
    if (!key) throw new Error("Chave da API Gemini não configurada em Configurações → IA.");
    const genAI = new GoogleGenerativeAI(key);
    const geminiModel = genAI.getGenerativeModel({
      model,
      generationConfig: jsonMode ? { responseMimeType: "application/json" } : {},
    });
    const combinedPrompt = `${systemPrompt}\n\n${userPrompt}`;
    const result = await geminiModel.generateContent(combinedPrompt);
    return result.response.text();
  }

  // Default: OpenAI (custom key or Replit integration)
  const client = await getOpenAIClient();
  const res = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    response_format: jsonMode ? { type: "json_object" } : undefined,
    max_completion_tokens: maxTokens,
  });
  return res.choices[0]?.message?.content || "{}";
}

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {

  app.use("/uploads/fonts", express.static(FONTS_DIR));
  app.use("/uploads/generated", express.static(LOCAL_ASSETS_DIR, {
    maxAge: "1y",
    immutable: true,
  }));

  // ── AUTH ROUTES (public) ──────────────────────────────────────────────────

  app.get("/api/me", (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Não autenticado" });
    const user = req.user as any;
    res.json({ id: user.id, username: user.username });
  });

  app.post("/api/auth/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: info?.message || "Credenciais inválidas" });
      req.logIn(user, (loginErr) => {
        if (loginErr) return next(loginErr);
        res.json({ id: user.id, username: user.username });
      });
    })(req, res, next);
  });

  app.post("/api/auth/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.json({ ok: true });
    });
  });

  app.post("/api/auth/change-password", requireAuth, async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const user = req.user as any;
      const dbUser = await storage.getUser(user.id);
      if (!dbUser) return res.status(404).json({ message: "Usuário não encontrado" });
      const valid = await comparePasswords(currentPassword, dbUser.password);
      if (!valid) return res.status(400).json({ message: "Senha atual incorreta" });
      const hashed = await hashPassword(newPassword);
      await storage.updateUser(user.id, { password: hashed });
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ message: "Erro ao alterar senha" });
    }
  });

  // ── PROTECT all /api routes (except public approval) ─────────────────────
  // NOTE: req.path here is relative to "/api" — e.g. "/api/approve/token" → req.path = "/approve/token"
  app.use("/api", (req, res, next) => {
    if (req.isAuthenticated()) return next();
    // Allow public approval endpoints
    if (req.path.startsWith("/approve")) return next();
    res.status(401).json({ message: "Não autenticado" });
  });

  // --- PROJECT FONTS ---
  app.get("/api/projects/:id/fonts", async (req, res) => {
    try {
      const fonts = await storage.getProjectFonts(Number(req.params.id));
      res.json(fonts);
    } catch (e) { res.status(500).json({ error: "Failed to fetch fonts" }); }
  });

  app.post("/api/projects/:id/fonts", fontUpload.single("font"), async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: "Nenhum arquivo enviado" });
      const projectId = Number(req.params.id);
      const ext = path.extname(req.file.originalname).toLowerCase().replace(".", "");
      const url = `/uploads/fonts/${projectId}/${req.file.filename}`;
      const name = req.body.name || path.basename(req.file.originalname, path.extname(req.file.originalname));
      const font = await storage.createProjectFont({
        projectId,
        name,
        fileName: req.file.filename,
        format: ext,
        url,
        role: req.body.role || null,
      });
      res.status(201).json(font);
    } catch (e: any) { res.status(400).json({ error: e.message || "Failed to upload font" }); }
  });

  app.patch("/api/projects/:id/fonts/:fontId", async (req, res) => {
    try {
      const font = await storage.updateProjectFont(Number(req.params.fontId), req.body);
      res.json(font);
    } catch (e) { res.status(500).json({ error: "Failed to update font" }); }
  });

  app.delete("/api/projects/:id/fonts/:fontId", async (req, res) => {
    try {
      const fonts = await storage.getProjectFonts(Number(req.params.id));
      const font = fonts.find(f => f.id === Number(req.params.fontId));
      if (font) {
        const filePath = path.join(FONTS_DIR, req.params.id, font.fileName);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }
      await storage.deleteProjectFont(Number(req.params.fontId));
      res.status(204).send();
    } catch (e) { res.status(500).json({ error: "Failed to delete font" }); }
  });

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

  // --- AGENT PROFILES ---
  app.get("/api/agent-profiles", async (req, res) => {
    try {
      const projectId = req.query.projectId ? Number(req.query.projectId) : undefined;
      const result = await storage.getAgentProfiles(projectId);
      res.json(result);
    } catch (e) { res.status(500).json({ error: "Failed to fetch agent profiles" }); }
  });

  app.post("/api/agent-profiles", async (req, res) => {
    try {
      const data = insertAgentProfileSchema.parse(req.body);
      const a = await storage.createAgentProfile(data);
      res.status(201).json(a);
    } catch (e) { res.status(400).json({ error: String(e) }); }
  });

  app.patch("/api/agent-profiles/:id", async (req, res) => {
    try {
      const a = await storage.updateAgentProfile(Number(req.params.id), req.body);
      res.json(a);
    } catch (e) { res.status(500).json({ error: "Failed to update agent profile" }); }
  });

  app.delete("/api/agent-profiles/:id", async (req, res) => {
    try {
      await storage.deleteAgentProfile(Number(req.params.id));
      res.status(204).send();
    } catch (e) { res.status(500).json({ error: "Failed to delete agent profile" }); }
  });

  // --- AI PROVIDERS: List available models per configured provider ---
  app.get("/api/ai/models", async (_req, res) => {
    const result: Record<string, { id: string; name: string }[]> = {};

    // OpenAI (custom key takes priority, fallback to Replit integration)
    try {
      const client = await getOpenAIClient();
      const models = await client.models.list();
      const textModels = models.data
        .filter(m =>
          (m.id.startsWith("gpt-") || m.id.startsWith("o1") || m.id.startsWith("o3") || m.id.startsWith("o4")) &&
          !m.id.includes("realtime") && !m.id.includes("audio") &&
          !m.id.includes("tts") && !m.id.includes("whisper") &&
          !m.id.includes("instruct") && !m.id.includes("embedding")
        )
        .map(m => ({ id: m.id, name: m.id }))
        .sort((a, b) => b.id.localeCompare(a.id));
      if (textModels.length > 0) result.openai = textModels;
    } catch (e) {
      console.error("OpenAI models fetch error:", e);
    }

    // Anthropic
    const anthropicKey = await storage.getSetting("ai_anthropic_key");
    if (anthropicKey) {
      try {
        const response = await fetch("https://api.anthropic.com/v1/models?limit=50", {
          headers: {
            "x-api-key": anthropicKey,
            "anthropic-version": "2023-06-01",
          },
        });
        if (response.ok) {
          const data = await response.json() as any;
          result.anthropic = (data.data || []).map((m: any) => ({
            id: m.id,
            name: m.display_name || m.id,
          }));
        }
      } catch (e) {
        console.error("Anthropic models fetch error:", e);
      }
    }

    // Gemini — split into text models and image models
    const geminiKey = await storage.getSetting("ai_gemini_key");
    if (geminiKey) {
      try {
        const gResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models?key=${geminiKey}&pageSize=100`
        );
        if (gResponse.ok) {
          const data = await gResponse.json() as any;
          const allModels = data.models || [];

          // Text models: must have generateContent, must NOT have "image" in name
          const textModels = allModels
            .filter((m: any) =>
              m.supportedGenerationMethods?.includes("generateContent") &&
              m.name.includes("gemini") &&
              !m.name.toLowerCase().includes("image") &&
              !m.name.includes("embedding")
            )
            .map((m: any) => ({
              id: m.name.replace("models/", ""),
              name: m.displayName || m.name.replace("models/", ""),
            }));
          if (textModels.length > 0) result.gemini = textModels;

          // Image models: must have generateContent AND have "image" in name
          const imageModels = allModels
            .filter((m: any) =>
              m.supportedGenerationMethods?.includes("generateContent") &&
              m.name.toLowerCase().includes("image") &&
              !m.name.includes("embedding")
            )
            .map((m: any) => ({
              id: m.name.replace("models/", ""),
              name: m.displayName || m.name.replace("models/", ""),
            }));
          if (imageModels.length > 0) result.gemini_image = imageModels;
        }
      } catch (e) {
        console.error("Gemini models fetch error:", e);
      }
    }

    res.json(result);
  });

  // --- AI: GENERATE STRUCTURED CONTENT PACKAGE ---
  app.post("/api/ai/content-package", async (req, res) => {
    try {
      const {
        projectContext, platform, format, template, topic, tone,
        knowledgeContext, carouselSlides, briefing, designBrief, agentProfile, designAgent,
        provider = "openai", model = "gpt-4.1",
      } = req.body;

      const isCarousel = format === "carrossel" || (carouselSlides && carouselSlides > 1);
      const slideCount = Number(carouselSlides || (isCarousel ? 5 : 1));

      const systemPrompt = `Você é uma dupla sênior de Social Media e Designer dentro de uma esteira operacional de produção de conteúdo.
Seu trabalho é substituir o processo manual: interpretar briefing, definir estratégia, estruturar carrossel/post, escrever copy, orientar direção visual e preparar checklist de revisão.
Crie conteúdo em português brasileiro, direto, autêntico, vendável sem soar genérico e coerente com a marca.
${projectContext ? `Contexto do projeto: ${projectContext}` : ""}
${knowledgeContext ? `Base de conhecimento: ${knowledgeContext}` : ""}
${agentProfile ? `Agente de estratégia/copy: ${JSON.stringify(agentProfile)}` : ""}
${designAgent ? `Agente de design: ${JSON.stringify(designAgent)}` : ""}
${designBrief ? `Briefing visual da marca: ${JSON.stringify(designBrief)}` : ""}`;

      const carouselInstructions = isCarousel && carouselSlides
        ? `\nEste é um CARROSSEL com ${slideCount} slides. Crie copy slide a slide, incluindo papel do slide, headline, corpo curto e direção visual específica.`
        : "";

      const userPrompt = `Crie um pacote completo de produção para ${platform === "instagram" ? "Instagram" : "LinkedIn"}.
Formato: ${isCarousel ? `Carrossel (${carouselSlides || "múltiplos"} slides)` : format}
Briefing/demanda: ${briefing || topic}
Tom: ${tone || "profissional e engajante"}
${template ? `Use este template como base: ${template}` : ""}
${carouselInstructions}

Retorne SOMENTE JSON válido neste formato:
{
  "diagnosis": "leitura estratégica curta do briefing",
  "recommendedAngle": "ângulo de comunicação escolhido e por quê",
  "mainTitle": "título/gancho principal",
  "slides": [
    { "number": 1, "role": "capa", "headline": "...", "body": "...", "visualDirection": "..." }
  ],
  "caption": "legenda completa com hook, desenvolvimento e CTA",
  "hashtags": "#hashtags relevantes",
  "ctaOptions": ["opção 1", "opção 2", "opção 3"],
  "visualDirection": "direção visual geral da peça: layout, paleta, hierarquia, tipografia, imagem, restrições",
  "reviewChecklist": ["checagem estratégica", "checagem de copy", "checagem visual", "checagem de marca", "checagem de publicação"],
  "imagePrompt": "prompt em inglês para gerar a arte ou capa do slide 1"
}

Se for carrossel, o array slides deve ter exatamente ${slideCount} itens. Se não for carrossel, retorne 1 item representando a peça.`;

      const text = await generateTextContent({ provider, model, systemPrompt, userPrompt, jsonMode: true, maxTokens: 4000 });
      const result = JSON.parse(text);
      res.json(result);
    } catch (e: any) {
      console.error("Caption generation error:", e);
      res.status(500).json({ error: e.message || "Failed to generate caption" });
    }
  });

  // Backward-compatible caption endpoint.
  app.post("/api/ai/caption", async (req, res) => {
    try {
      const response = await fetch(`http://127.0.0.1:${process.env.PORT || "5000"}/api/ai/content-package`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          cookie: req.headers.cookie || "",
        },
        body: JSON.stringify(req.body),
      });
      const data = await response.json();
      res.status(response.status).json({
        caption: data.caption,
        hashtags: data.hashtags,
        imagePrompt: data.imagePrompt,
        productionPackage: data,
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message || "Failed to generate caption" });
    }
  });

  // --- AI: GENERATE IMAGE ---
  app.post("/api/ai/image", async (req, res) => {
    try {
      const { prompt, platform, format, brandColors, style, designBrief, designAgent, provider = "openai", model } = req.body;

      const briefLines: string[] = [];
      if (designBrief) {
        const b = designBrief as Record<string, any>;
        if (b.mood) briefLines.push(`Visual mood: ${b.mood}`);
        if (b.colorPreference) briefLines.push(`Color approach: ${b.colorPreference}`);
        if (b.imageType) briefLines.push(`Image type: ${b.imageType}`);
        if (b.layoutComplexity) briefLines.push(`Layout complexity: ${b.layoutComplexity}`);
        if (b.brandAdherence) briefLines.push(`Brand adherence: ${b.brandAdherence}`);
        if (b.typographyPreference) briefLines.push(`Typography style: ${b.typographyPreference}`);
        if (b.infoHierarchy) briefLines.push(`Visual hierarchy focus: ${b.infoHierarchy}`);
        if (b.accessibility) briefLines.push(`Readability level: ${b.accessibility}`);
        if (b.visualRestrictions?.length) briefLines.push(`Avoid: ${b.visualRestrictions.join(", ")}`);
        if (b.styleReference) briefLines.push(`Style reference: ${b.styleReference}`);
      }
      const briefContext = briefLines.length > 0 ? briefLines.join(". ") + "." : "";

      const agentLines: string[] = [];
      if (designAgent) {
        const da = designAgent as Record<string, any>;
        if (da.extractedVisualStyle) agentLines.push(`EXTRACTED VISUAL STYLE FROM REAL REFERENCES:\n${da.extractedVisualStyle}`);
        if (da.visualMood) agentLines.push(`Visual mood & aesthetic: ${da.visualMood}`);
        if (da.colorApproach) agentLines.push(`Color approach: ${da.colorApproach}`);
        if (da.typographyStyle) agentLines.push(`Typography: ${da.typographyStyle}`);
        if (da.layoutPreferences) agentLines.push(`Layout & composition: ${da.layoutPreferences}`);
        if (da.graphicElements) agentLines.push(`Graphic elements: ${da.graphicElements}`);
        if (da.referencePersonas) agentLines.push(`Design references (replicate style): ${da.referencePersonas}`);
        if (da.restrictions?.length) agentLines.push(`STRICTLY AVOID: ${Array.isArray(da.restrictions) ? da.restrictions.join(", ") : da.restrictions}`);
      }
      const agentContext = agentLines.length > 0 ? agentLines.join("\n") : "";

      const enhancedPrompt = [
        prompt,
        platform === "instagram"
          ? "Square or portrait format, highly visual, Instagram-worthy."
          : "Professional, LinkedIn appropriate, clean and modern.",
        style ? `Style: ${style}` : "",
        brandColors?.dominant
          ? `Brand colors — dominant: ${brandColors.dominant}, secondary: ${brandColors.secondary}, accent: ${brandColors.accent}. Apply the 60-30-10 color rule.`
          : brandColors?.length ? `Use these brand colors: ${brandColors.join(", ")}` : "",
        briefContext,
        agentContext,
        "High quality, professional marketing image for social media.",
      ].filter(Boolean).join("\n");

      if (provider === "gemini") {
        const key = await storage.getSetting("ai_gemini_key");
        if (!key) throw new Error("Chave Gemini não configurada em Configurações → IA.");
        const genAI = new GoogleGenerativeAI(key);
        const imageModel = model || "gemini-2.0-flash-preview-image-generation";
        const gemModel = genAI.getGenerativeModel({ model: imageModel });
        const result = await gemModel.generateContent({
          contents: [{ role: "user", parts: [{ text: enhancedPrompt }] }],
          generationConfig: { responseModalities: ["image"] } as any,
        });
        const parts = result.response.candidates?.[0]?.content?.parts || [];
        for (const part of parts as any[]) {
          if (part.inlineData) {
            const stored = await storeGeneratedImage(part.inlineData.data, part.inlineData.mimeType || "image/png");
            return res.json({ url: stored.url, key: stored.key, storage: stored.storage });
          }
        }
        throw new Error("Gemini não retornou imagem. Tente novamente ou verifique o prompt.");
      }

      // Default: OpenAI gpt-image-1
      const openaiClient = await getOpenAIClient();
      const response = await openaiClient.images.generate({
        model: "gpt-image-1",
        prompt: enhancedPrompt,
        n: 1,
        size: "1024x1024",
      });

      const imageData = response.data?.[0];
      if (!imageData) throw new Error("OpenAI não retornou dados da imagem.");
      if (imageData.b64_json) {
        const stored = await storeGeneratedImage(imageData.b64_json, "image/png");
        return res.json({ url: stored.url, key: stored.key, storage: stored.storage });
      }
      res.json({ url: imageData.url });
    } catch (e: any) {
      console.error("Image generation error:", e);
      res.status(500).json({ error: e.message || "Failed to generate image" });
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

      const openaiClient = await getOpenAIClient();
      const response = await openaiClient.chat.completions.create({
        model: "gpt-4.1",
        messages: [{
          role: "user",
          content: [
            imageContent,
            {
              type: "text",
              text: `Analise esta imagem em detalhes para replicar o estilo de conteúdo para redes sociais. Retorne um JSON com:
              - description: descrição detalhada da imagem
              - style: objeto com { colors: string[], composition: string, mood: string, typography: string, graphicElements: string }
              - contentType: tipo de conteúdo (produto, lifestyle, corporativo, marketing digital, etc)
              - contentStructure: "carousel" se parecer um slide de carrossel (tem numeração de páginas, setas, "deslize", estrutura sequencial, etc) ou "static" se for uma imagem única
              - isCarousel: true se for um slide de carrossel, false se for estático
              - slideCount: número estimado de slides se for carrossel (baseado em indicadores visuais como paginação "1/8", bolinhas, setas, texto "deslize"), null se não for carrossel
              - copyElements: array de strings com todos os elementos de texto visíveis na imagem
              - targetAudience: público-alvo provável
              - suggestedCaption: sugestão de legenda em português baseada no conteúdo
              - imagePromptToReplicate: prompt detalhado em inglês para replicar este estilo visual exato em novas imagens`
            }
          ]
        }],
        response_format: { type: "json_object" },
        max_completion_tokens: 2000,
      });

      const result = JSON.parse(response.choices[0]?.message?.content || "{}");
      res.json(result);
    } catch (e: any) {
      console.error("Image analysis error:", e);
      res.status(500).json({ error: e.message || "Failed to analyze image" });
    }
  });

  // --- AI: CALENDAR GENERATOR ---
  app.post("/api/ai/calendar", async (req, res) => {
    try {
      const {
        projectId, projectContext, period, platforms, topics, instructions,
        objective, contentMix, postsPerWeek, knowledgeContext, brandRules, agentProfile,
        provider = "openai", model = "gpt-4.1",
      } = req.body;

      let knowledgeText = knowledgeContext || "";
      if (projectId && !knowledgeContext) {
        try {
          const items = await storage.getKnowledgeBase(Number(projectId));
          if (items.length > 0) {
            knowledgeText = items.map(i => `[${i.category || "geral"}] ${i.title}: ${i.content}`).join("\n");
          }
        } catch {}
      }

      const contentMixInstructions: Record<string, string> = {
        equilibrado: "Distribua igualmente entre conteúdo educativo (40%), relacional/humanizado (30%) e promocional/conversão (30%).",
        educativo: "Priorize conteúdo educativo e de autoridade (60%), complementado por relacional (25%) e promocional (15%).",
        promocional: "Distribua com foco em conversão e vendas (50%), educativo para preparar a audiência (30%) e relacional (20%).",
        relacional: "Priorize conteúdo humanizado e de conexão (55%), educativo leve (30%) e promocional sutil (15%).",
      };
      const mixGuide = contentMixInstructions[contentMix] || contentMixInstructions.equilibrado;

      const agentProfileContext = agentProfile ? `
PERFIL DO AGENTE DE SOCIAL MEDIA:
${agentProfile.personaDescription ? `Identidade: ${agentProfile.personaDescription}` : ""}
${agentProfile.referencePersonas ? `Referências de estilo: ${agentProfile.referencePersonas}` : ""}
${agentProfile.toneCharacteristics?.length ? `Tom de voz: ${agentProfile.toneCharacteristics.join(", ")}` : ""}
${agentProfile.voiceRegister ? `Registro de voz: ${agentProfile.voiceRegister}` : ""}
${agentProfile.deliveryDepth ? `Nível de profundidade: ${agentProfile.deliveryDepth}` : ""}
${agentProfile.contentObjectives?.length ? `Objetivos de conteúdo prioritários: ${agentProfile.contentObjectives.join(", ")}` : ""}
${agentProfile.contentPillars?.length ? `Pilares de conteúdo: ${agentProfile.contentPillars.join(", ")}` : ""}
${agentProfile.preferredFrameworks?.length ? `Frameworks a aplicar: ${agentProfile.preferredFrameworks.join(", ")}` : ""}
${agentProfile.targetAudience ? `Público-alvo: ${agentProfile.targetAudience}` : ""}
${agentProfile.audiencePains ? `Dores do público: ${agentProfile.audiencePains}` : ""}
${agentProfile.audienceDreams ? `Sonhos/desejos do público: ${agentProfile.audienceDreams}` : ""}
${agentProfile.hookStyle ? `Estilo de gancho preferido: ${agentProfile.hookStyle}` : ""}
${agentProfile.ctaStyle ? `Estilo de CTA preferido: ${agentProfile.ctaStyle}` : ""}
${agentProfile.restrictions?.length ? `RESTRIÇÕES - NUNCA FAZER: ${agentProfile.restrictions.join("; ")}` : ""}
${agentProfile.forbiddenWords?.length ? `Palavras proibidas: ${agentProfile.forbiddenWords.join(", ")}` : ""}
`.trim() : "";

      const systemPrompt = `Você é uma Social Media Sênior e Copywriter com mais de 10 anos de experiência em estratégia de conteúdo digital para marcas. Você pensa de forma estratégica e criativa ao mesmo tempo.
${agentProfileContext ? `\n${agentProfileContext}\n` : ""}
Ao criar um calendário, você aplica os seguintes princípios:

ESTRATÉGIA DE CONTEÚDO:
- Você define pilares de conteúdo com base no nicho, público-alvo e objetivos do cliente
- Você entende o funil de consciência: Topo (descoberta/educação) → Meio (consideração/conexão) → Fundo (conversão/fidelização)
- Você nunca começa uma quinzena com post promocional — você aquece a audiência primeiro
- Você varia formatos estrategicamente: usa carrosseis para educar, reels para alcance, posts para posicionamento, stories para humanizar
- Você considera a jornada da semana: Seg/Ter = posts de valor/educação, Qua/Qui = engajamento/relacional, Sex = inspiração/conversão leve

COPYWRITING:
- Você pensa em títulos com ganchos fortes (números, perguntas, afirmações contraintuitivas, "como fazer X sem Y")
- Você usa frameworks como AIDA (Atenção, Interesse, Desejo, Ação) e PAS (Problema, Agitação, Solução)
- Você adapta o tom e linguagem para cada plataforma: Instagram é mais emocional/visual, LinkedIn é mais profissional/reflexivo
- Você sabe que o título do post deve parar o scroll — ele é o elemento mais importante

BOAS PRÁTICAS POR PLATAFORMA:
- Instagram: até 3-4 posts/semana, stories diários se possível, reels para crescimento orgânico, carrosseis para salvamentos
- LinkedIn: 2-3 posts/semana, textos reflexivos com quebra de linha, autoridade e cases reais`;

      const userPrompt = `Crie um calendário de conteúdo estratégico para a quinzena: ${period}

CONTEXTO DO PROJETO:
${projectContext}

${knowledgeText ? `BASE DE CONHECIMENTO DO CLIENTE:\n${knowledgeText}\n` : ""}
${brandRules ? `REGRAS DE MARCA:\n${brandRules}\n` : ""}

OBJETIVO PRINCIPAL DA QUINZENA: ${objective || "Crescimento e posicionamento de marca"}

DISTRIBUIÇÃO DE CONTEÚDO: ${mixGuide}

PLATAFORMAS: ${platforms?.join(", ")}
FREQUÊNCIA: ${postsPerWeek ? `${postsPerWeek} posts por semana por plataforma` : "3-4 posts por semana no Instagram, 2-3 no LinkedIn"}

${topics ? `TEMAS/TÓPICOS SUGERIDOS: ${topics}` : ""}
${instructions ? `INSTRUÇÕES ADICIONAIS: ${instructions}` : ""}

IMPORTANTE:
- Distribua os posts estrategicamente ao longo da quinzena (não aglomere tudo no início)
- Varie os formatos (post, carrossel, story, reels) de forma inteligente
- Cada post deve ter um objetivo claro dentro do funil
- Use dias úteis preferencialmente para posts no LinkedIn
- Considere o ritmo da semana ao distribuir os tipos de conteúdo

Retorne um JSON com array "posts" onde cada post tem:
- date: data no formato YYYY-MM-DD
- title: título do post com gancho forte (que para o scroll)
- platform: instagram ou linkedin
- format: post, carrossel, story ou reels
- topic: tópico/tema/pilar de conteúdo
- objective: objetivo estratégico do post (ex: "educação - topo de funil", "conversão - fundo de funil", "engajamento - comunidade")
- hook: o primeiro elemento que chamará atenção (primeira linha do texto ou descrição do visual)
- contentPillar: pilar de conteúdo (ex: "autoridade", "humanização", "produto/serviço", "educação", "prova social")`;

      const text = await generateTextContent({ provider, model, systemPrompt, userPrompt, jsonMode: true, maxTokens: 4000 });
      const result = JSON.parse(text);
      res.json(result);
    } catch (e: any) {
      console.error("Calendar generation error:", e);
      res.status(500).json({ error: e.message || "Failed to generate calendar" });
    }
  });

  // --- ACCOUNT & SETTINGS ---
  app.get("/api/account", async (_req, res) => {
    try {
      const name = await storage.getSetting("account_name");
      const email = await storage.getSetting("account_email");
      const hash = await storage.getSetting("account_password_hash");
      res.json({ name: name || "", email: email || "", hasPassword: !!hash });
    } catch (e) { res.status(500).json({ error: "Failed to get account" }); }
  });

  app.patch("/api/account", async (req, res) => {
    try {
      const { name, email } = req.body;
      if (name !== undefined) await storage.setSetting("account_name", name || null);
      if (email !== undefined) await storage.setSetting("account_email", email || null);
      res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: "Failed to update account" }); }
  });

  app.post("/api/account/change-password", async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ error: "A nova senha deve ter pelo menos 6 caracteres" });
      }
      const crypto = await import("crypto");
      const stored = await storage.getSetting("account_password_hash");
      if (stored) {
        const currentHash = crypto.createHash("sha256").update(currentPassword || "").digest("hex");
        if (currentHash !== stored) {
          return res.status(401).json({ error: "Senha atual incorreta" });
        }
      }
      const newHash = crypto.createHash("sha256").update(newPassword).digest("hex");
      await storage.setSetting("account_password_hash", newHash);
      res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: "Failed to change password" }); }
  });

  app.get("/api/settings", async (_req, res) => {
    try {
      const all = await storage.getSettings();
      const masked: Record<string, string> = {};
      for (const [k, v] of Object.entries(all)) {
        if (v && (k.includes("token") || k.includes("secret") || k.includes("key"))) {
          masked[k] = v.length > 8 ? `${"*".repeat(v.length - 4)}${v.slice(-4)}` : "****";
        } else {
          masked[k] = v;
        }
      }
      const hasKeys: Record<string, boolean> = {};
      for (const k of Object.keys(all)) { hasKeys[k] = !!all[k]; }
      res.json({ settings: masked, connected: hasKeys });
    } catch (e) { res.status(500).json({ error: "Failed to get settings" }); }
  });

  app.patch("/api/settings", async (req, res) => {
    try {
      const updates: Record<string, string | null> = req.body;
      for (const [key, value] of Object.entries(updates)) {
        await storage.setSetting(key, value);
      }
      res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: "Failed to save settings" }); }
  });

  app.delete("/api/settings/:key", async (req, res) => {
    try {
      await storage.setSetting(req.params.key, null);
      res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: "Failed to delete setting" }); }
  });

  // --- META CONNECTION ---
  app.get("/api/meta/accounts", async (_req, res) => {
    try {
      const token = await storage.getSetting("meta_system_user_token");
      const portfolioId = await storage.getSetting("meta_business_portfolio_id");
      if (!token) return res.status(400).json({ error: "Token Meta não configurado" });

      const version = process.env.META_GRAPH_VERSION || "v23.0";
      const fields = "id,name,username,profile_picture_url";
      const targets = portfolioId
        ? [`${portfolioId}/owned_instagram_accounts?fields=${fields}`]
        : [`me/accounts?fields=id,name,instagram_business_account{${fields}}`];

      const results: any[] = [];
      for (const target of targets) {
        const url = new URL(`https://graph.facebook.com/${version}/${target}`);
        url.searchParams.set("access_token", token);
        const response = await fetch(url);
        const body = await response.json();
        if (!response.ok) {
          return res.status(response.status).json({ error: body.error?.message || "Falha ao consultar Meta", details: body.error });
        }
        results.push(...(body.data || []));
      }

      const accounts = results.map((item) => item.instagram_business_account || item).filter(Boolean);
      res.json({ accounts, source: portfolioId ? "business_portfolio" : "pages" });
    } catch (e: any) {
      res.status(500).json({ error: e.message || "Erro ao conectar com a Meta" });
    }
  });

  return httpServer;
}
