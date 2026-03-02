import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, serial, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({ username: true, password: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type DesignBrief = {
  brandAdherence?: string;
  mood?: string;
  colorPreference?: string;
  typographyPreference?: string;
  infoHierarchy?: string;
  imageType?: string;
  layoutComplexity?: string;
  styleReference?: string;
  accessibility?: string;
  mandatoryElements?: string[];
  visualRestrictions?: string[];
  additionalNotes?: string;
};

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  clientName: text("client_name"),
  logoUrl: text("logo_url"),
  brandColors: jsonb("brand_colors").$type<{ dominant: string; secondary: string; accent: string } | null>().default(null),
  designBrief: jsonb("design_brief").$type<DesignBrief | null>().default(null),
  niche: text("niche").array().default([]),
  formats: text("formats").array().default([]),
  rules: text("rules"),
  instructions: text("instructions"),
  primaryFont: text("primary_font"),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
});

export const insertProjectSchema = createInsertSchema(projects).omit({ id: true, createdAt: true });
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;

export const projectFonts = pgTable("project_fonts", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  fileName: text("file_name").notNull(),
  format: text("format").notNull(),
  url: text("url").notNull(),
  role: text("role"),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
});

export const insertProjectFontSchema = createInsertSchema(projectFonts).omit({ id: true, createdAt: true });
export type InsertProjectFont = z.infer<typeof insertProjectFontSchema>;
export type ProjectFont = typeof projectFonts.$inferSelect;

export const contentPieces = pgTable("content_pieces", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  caption: text("caption"),
  hashtags: text("hashtags"),
  platform: text("platform").notNull().default("instagram"),
  format: text("format").notNull().default("post"),
  status: text("status").notNull().default("draft"),
  imageUrl: text("image_url"),
  imagePrompt: text("image_prompt"),
  scheduledDate: text("scheduled_date"),
  notes: text("notes"),
  clickupTaskId: text("clickup_task_id"),
  extractedContent: text("extracted_content"),
  approvalToken: text("approval_token").unique(),
  approvalComment: text("approval_comment"),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
});

export const insertContentPieceSchema = createInsertSchema(contentPieces).omit({ id: true, createdAt: true });
export type InsertContentPiece = z.infer<typeof insertContentPieceSchema>;
export type ContentPiece = typeof contentPieces.$inferSelect;

export const templates = pgTable("templates", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  description: text("description"),
  platform: text("platform"),
  format: text("format"),
  captionTemplate: text("caption_template"),
  promptTemplate: text("prompt_template"),
  category: text("category"),
  isGlobal: boolean("is_global").default(false),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
});

export const insertTemplateSchema = createInsertSchema(templates).omit({ id: true, createdAt: true });
export type InsertTemplate = z.infer<typeof insertTemplateSchema>;
export type Template = typeof templates.$inferSelect;

export const knowledgeBase = pgTable("knowledge_base", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  content: text("content").notNull(),
  category: text("category"),
  tags: text("tags").array().default([]),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
});

export const insertKnowledgeBaseSchema = createInsertSchema(knowledgeBase).omit({ id: true, createdAt: true });
export type InsertKnowledgeBase = z.infer<typeof insertKnowledgeBaseSchema>;
export type KnowledgeBase = typeof knowledgeBase.$inferSelect;

export const prompts = pgTable("prompts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  content: text("content").notNull(),
  category: text("category"),
  platform: text("platform"),
  format: text("format"),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
});

export const insertPromptSchema = createInsertSchema(prompts).omit({ id: true, createdAt: true });
export type InsertPrompt = z.infer<typeof insertPromptSchema>;
export type Prompt = typeof prompts.$inferSelect;

export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
});

export const insertConversationSchema = createInsertSchema(conversations).omit({ id: true, createdAt: true });
export type Conversation = typeof conversations.$inferSelect;
export type Message = typeof messages.$inferSelect;
