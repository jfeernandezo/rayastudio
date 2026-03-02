import { eq, desc, and } from "drizzle-orm";
import { db } from "./db";
import {
  users, projects, contentPieces, templates, knowledgeBase, prompts, conversations, messages, projectFonts, appSettings, agentProfiles,
  type User, type InsertUser,
  type Project, type InsertProject,
  type ContentPiece, type InsertContentPiece,
  type Template, type InsertTemplate,
  type KnowledgeBase, type InsertKnowledgeBase,
  type Prompt, type InsertPrompt,
  type Conversation, type Message,
  type ProjectFont, type InsertProjectFont,
  type AgentProfile, type InsertAgentProfile,
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  getProjects(): Promise<Project[]>;
  getProject(id: number): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, project: Partial<InsertProject>): Promise<Project>;
  deleteProject(id: number): Promise<void>;

  getProjectFonts(projectId: number): Promise<ProjectFont[]>;
  createProjectFont(font: InsertProjectFont): Promise<ProjectFont>;
  updateProjectFont(id: number, font: Partial<InsertProjectFont>): Promise<ProjectFont>;
  deleteProjectFont(id: number): Promise<void>;

  getContentPieces(projectId?: number): Promise<ContentPiece[]>;
  getContentPiece(id: number): Promise<ContentPiece | undefined>;
  getContentByApprovalToken(token: string): Promise<ContentPiece | undefined>;
  createContentPiece(piece: InsertContentPiece): Promise<ContentPiece>;
  updateContentPiece(id: number, piece: Partial<InsertContentPiece>): Promise<ContentPiece>;
  deleteContentPiece(id: number): Promise<void>;
  generateApprovalToken(id: number): Promise<ContentPiece>;

  getTemplates(projectId?: number): Promise<Template[]>;
  getTemplate(id: number): Promise<Template | undefined>;
  createTemplate(template: InsertTemplate): Promise<Template>;
  updateTemplate(id: number, template: Partial<InsertTemplate>): Promise<Template>;
  deleteTemplate(id: number): Promise<void>;

  getKnowledgeBase(projectId?: number): Promise<KnowledgeBase[]>;
  createKnowledgeBaseItem(item: InsertKnowledgeBase): Promise<KnowledgeBase>;
  updateKnowledgeBaseItem(id: number, item: Partial<InsertKnowledgeBase>): Promise<KnowledgeBase>;
  deleteKnowledgeBaseItem(id: number): Promise<void>;

  getPrompts(): Promise<Prompt[]>;
  createPrompt(prompt: InsertPrompt): Promise<Prompt>;
  updatePrompt(id: number, prompt: Partial<InsertPrompt>): Promise<Prompt>;
  deletePrompt(id: number): Promise<void>;

  getAgentProfiles(projectId?: number): Promise<AgentProfile[]>;
  getAgentProfile(id: number): Promise<AgentProfile | undefined>;
  createAgentProfile(profile: InsertAgentProfile): Promise<AgentProfile>;
  updateAgentProfile(id: number, profile: Partial<InsertAgentProfile>): Promise<AgentProfile>;
  deleteAgentProfile(id: number): Promise<void>;

  getConversations(): Promise<Conversation[]>;
  createConversation(title: string): Promise<Conversation>;
  deleteConversation(id: number): Promise<void>;
  getMessages(conversationId: number): Promise<Message[]>;
  createMessage(conversationId: number, role: string, content: string): Promise<Message>;

  getSettings(): Promise<Record<string, string>>;
  getSetting(key: string): Promise<string | null>;
  setSetting(key: string, value: string | null): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  async getUserByUsername(username: string) {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  async createUser(insertUser: InsertUser) {
    const id = randomUUID();
    const [user] = await db.insert(users).values({ ...insertUser, id }).returning();
    return user;
  }

  async getProjects() {
    return db.select().from(projects).orderBy(desc(projects.createdAt));
  }
  async getProject(id: number) {
    const [p] = await db.select().from(projects).where(eq(projects.id, id));
    return p;
  }
  async createProject(project: InsertProject) {
    const [p] = await db.insert(projects).values(project).returning();
    return p;
  }
  async updateProject(id: number, project: Partial<InsertProject>) {
    const [p] = await db.update(projects).set(project).where(eq(projects.id, id)).returning();
    return p;
  }
  async deleteProject(id: number) {
    await db.delete(projects).where(eq(projects.id, id));
  }

  async getProjectFonts(projectId: number) {
    return db.select().from(projectFonts).where(eq(projectFonts.projectId, projectId)).orderBy(projectFonts.createdAt);
  }
  async createProjectFont(font: InsertProjectFont) {
    const [f] = await db.insert(projectFonts).values(font).returning();
    return f;
  }
  async updateProjectFont(id: number, font: Partial<InsertProjectFont>) {
    const [f] = await db.update(projectFonts).set(font).where(eq(projectFonts.id, id)).returning();
    return f;
  }
  async deleteProjectFont(id: number) {
    await db.delete(projectFonts).where(eq(projectFonts.id, id));
  }

  async getContentPieces(projectId?: number) {
    if (projectId) {
      return db.select().from(contentPieces).where(eq(contentPieces.projectId, projectId)).orderBy(desc(contentPieces.createdAt));
    }
    return db.select().from(contentPieces).orderBy(desc(contentPieces.createdAt));
  }
  async getContentPiece(id: number) {
    const [p] = await db.select().from(contentPieces).where(eq(contentPieces.id, id));
    return p;
  }
  async getContentByApprovalToken(token: string) {
    const [p] = await db.select().from(contentPieces).where(eq(contentPieces.approvalToken, token));
    return p;
  }
  async createContentPiece(piece: InsertContentPiece) {
    const [p] = await db.insert(contentPieces).values(piece).returning();
    return p;
  }
  async updateContentPiece(id: number, piece: Partial<InsertContentPiece>) {
    const [p] = await db.update(contentPieces).set(piece).where(eq(contentPieces.id, id)).returning();
    return p;
  }
  async deleteContentPiece(id: number) {
    await db.delete(contentPieces).where(eq(contentPieces.id, id));
  }
  async generateApprovalToken(id: number) {
    const token = randomUUID();
    const [p] = await db.update(contentPieces).set({ approvalToken: token }).where(eq(contentPieces.id, id)).returning();
    return p;
  }

  async getTemplates(projectId?: number) {
    if (projectId !== undefined) {
      return db.select().from(templates).where(eq(templates.projectId, projectId)).orderBy(desc(templates.createdAt));
    }
    return db.select().from(templates).orderBy(desc(templates.createdAt));
  }
  async getTemplate(id: number) {
    const [t] = await db.select().from(templates).where(eq(templates.id, id));
    return t;
  }
  async createTemplate(template: InsertTemplate) {
    const [t] = await db.insert(templates).values(template).returning();
    return t;
  }
  async updateTemplate(id: number, template: Partial<InsertTemplate>) {
    const [t] = await db.update(templates).set(template).where(eq(templates.id, id)).returning();
    return t;
  }
  async deleteTemplate(id: number) {
    await db.delete(templates).where(eq(templates.id, id));
  }

  async getKnowledgeBase(projectId?: number) {
    if (projectId !== undefined) {
      return db.select().from(knowledgeBase).where(eq(knowledgeBase.projectId, projectId)).orderBy(desc(knowledgeBase.createdAt));
    }
    return db.select().from(knowledgeBase).orderBy(desc(knowledgeBase.createdAt));
  }
  async createKnowledgeBaseItem(item: InsertKnowledgeBase) {
    const [k] = await db.insert(knowledgeBase).values(item).returning();
    return k;
  }
  async updateKnowledgeBaseItem(id: number, item: Partial<InsertKnowledgeBase>) {
    const [k] = await db.update(knowledgeBase).set(item).where(eq(knowledgeBase.id, id)).returning();
    return k;
  }
  async deleteKnowledgeBaseItem(id: number) {
    await db.delete(knowledgeBase).where(eq(knowledgeBase.id, id));
  }

  async getPrompts() {
    return db.select().from(prompts).orderBy(desc(prompts.createdAt));
  }
  async createPrompt(prompt: InsertPrompt) {
    const [p] = await db.insert(prompts).values(prompt).returning();
    return p;
  }
  async updatePrompt(id: number, prompt: Partial<InsertPrompt>) {
    const [p] = await db.update(prompts).set(prompt).where(eq(prompts.id, id)).returning();
    return p;
  }
  async deletePrompt(id: number) {
    await db.delete(prompts).where(eq(prompts.id, id));
  }

  async getAgentProfiles(projectId?: number) {
    if (projectId !== undefined) {
      return db.select().from(agentProfiles)
        .where(eq(agentProfiles.projectId, projectId))
        .orderBy(desc(agentProfiles.createdAt));
    }
    return db.select().from(agentProfiles).orderBy(desc(agentProfiles.createdAt));
  }
  async getAgentProfile(id: number) {
    const [a] = await db.select().from(agentProfiles).where(eq(agentProfiles.id, id));
    return a;
  }
  async createAgentProfile(profile: InsertAgentProfile) {
    const [a] = await db.insert(agentProfiles).values(profile).returning();
    return a;
  }
  async updateAgentProfile(id: number, profile: Partial<InsertAgentProfile>) {
    const [a] = await db.update(agentProfiles).set(profile).where(eq(agentProfiles.id, id)).returning();
    return a;
  }
  async deleteAgentProfile(id: number) {
    await db.delete(agentProfiles).where(eq(agentProfiles.id, id));
  }

  async getConversations() {
    return db.select().from(conversations).orderBy(desc(conversations.createdAt));
  }
  async createConversation(title: string) {
    const [c] = await db.insert(conversations).values({ title }).returning();
    return c;
  }
  async deleteConversation(id: number) {
    await db.delete(messages).where(eq(messages.conversationId, id));
    await db.delete(conversations).where(eq(conversations.id, id));
  }
  async getMessages(conversationId: number) {
    return db.select().from(messages).where(eq(messages.conversationId, conversationId)).orderBy(messages.createdAt);
  }
  async createMessage(conversationId: number, role: string, content: string) {
    const [m] = await db.insert(messages).values({ conversationId, role, content }).returning();
    return m;
  }

  async getSettings(): Promise<Record<string, string>> {
    const rows = await db.select().from(appSettings);
    return Object.fromEntries(rows.map(r => [r.key, r.value ?? ""]));
  }
  async getSetting(key: string): Promise<string | null> {
    const [row] = await db.select().from(appSettings).where(eq(appSettings.key, key));
    return row?.value ?? null;
  }
  async setSetting(key: string, value: string | null): Promise<void> {
    if (value === null || value === "") {
      await db.delete(appSettings).where(eq(appSettings.key, key));
    } else {
      await db.insert(appSettings).values({ key, value }).onConflictDoUpdate({
        target: appSettings.key,
        set: { value, updatedAt: new Date() },
      });
    }
  }
}

export const storage = new DatabaseStorage();
