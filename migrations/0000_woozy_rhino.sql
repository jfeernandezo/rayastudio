CREATE TABLE "agent_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer,
	"agent_type" text DEFAULT 'estrategia',
	"name" text NOT NULL,
	"description" text,
	"persona_description" text,
	"reference_personas" text,
	"tone_characteristics" text[] DEFAULT '{}',
	"voice_register" text,
	"delivery_depth" text DEFAULT 'intermediário',
	"content_objectives" text[] DEFAULT '{}',
	"content_pillars" text[] DEFAULT '{}',
	"preferred_frameworks" text[] DEFAULT '{}',
	"target_audience" text,
	"audience_pains" text,
	"audience_dreams" text,
	"restrictions" text[] DEFAULT '{}',
	"forbidden_words" text[] DEFAULT '{}',
	"hook_style" text,
	"cta_style" text,
	"visual_mood" text,
	"color_approach" text,
	"typography_style" text,
	"layout_preferences" text,
	"graphic_elements" text,
	"reference_images" text[] DEFAULT '{}',
	"extracted_visual_style" text,
	"is_global" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app_settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_pieces" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"title" text NOT NULL,
	"caption" text,
	"hashtags" text,
	"platform" text DEFAULT 'instagram' NOT NULL,
	"format" text DEFAULT 'post' NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"image_url" text,
	"image_prompt" text,
	"briefing" text,
	"production_package" jsonb DEFAULT 'null'::jsonb,
	"visual_direction" text,
	"review_checklist" text[] DEFAULT '{}',
	"scheduled_date" text,
	"notes" text,
	"clickup_task_id" text,
	"extracted_content" text,
	"approval_token" text,
	"approval_comment" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "content_pieces_approval_token_unique" UNIQUE("approval_token")
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "knowledge_base" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"category" text,
	"tags" text[] DEFAULT '{}',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"conversation_id" integer NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_fonts" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"name" text NOT NULL,
	"file_name" text NOT NULL,
	"format" text NOT NULL,
	"url" text NOT NULL,
	"role" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"client_name" text,
	"logo_url" text,
	"brand_colors" jsonb DEFAULT 'null'::jsonb,
	"design_brief" jsonb DEFAULT 'null'::jsonb,
	"niche" text[] DEFAULT '{}',
	"formats" text[] DEFAULT '{}',
	"rules" text,
	"instructions" text,
	"primary_font" text,
	"clickup_list_id" text,
	"meta_instagram_account_id" text,
	"meta_page_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prompts" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"content" text NOT NULL,
	"category" text,
	"platform" text,
	"format" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer,
	"name" text NOT NULL,
	"description" text,
	"platform" text,
	"format" text,
	"caption_template" text,
	"prompt_template" text,
	"reference_image_url" text,
	"slide_count" integer,
	"category" text,
	"is_global" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "agent_profiles" ADD CONSTRAINT "agent_profiles_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_pieces" ADD CONSTRAINT "content_pieces_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_base" ADD CONSTRAINT "knowledge_base_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_fonts" ADD CONSTRAINT "project_fonts_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "templates" ADD CONSTRAINT "templates_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;