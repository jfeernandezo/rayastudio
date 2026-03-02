import { eq, desc, and } from "drizzle-orm";
import { db } from "./db";
import {
  users, projects, contentPieces, templates, knowledgeBase, prompts, conversations, messages,
  type User, type InsertUser,
  type Project, type InsertProject,
  type ContentPiece, type InsertContentPiece,
  type Template, type InsertTemplate,
  type KnowledgeBase, type InsertKnowledgeBase,
  type Prompt, type InsertPrompt,
  type Conversation, type Message,
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

  getConversations(): Promise<Conversation[]>;
  createConversation(title: string): Promise<Conversation>;
  deleteConversation(id: number): Promise<void>;
  getMessages(conversationId: number): Promise<Message[]>;
  createMessage(conversationId: number, role: string, content: string): Promise<Message>;
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
}

export const storage = new DatabaseStorage();
