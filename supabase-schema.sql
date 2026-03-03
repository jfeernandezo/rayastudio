-- ============================================================
-- RAYA STUDIO — Schema Completo para Supabase
-- Execute este SQL no SQL Editor do Supabase Dashboard
-- ============================================================

-- 1. USERS
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL
);

-- 2. PROJECTS
CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  client_name TEXT,
  logo_url TEXT,
  brand_colors JSONB DEFAULT NULL,
  design_brief JSONB DEFAULT NULL,
  niche TEXT[] DEFAULT '{}',
  formats TEXT[] DEFAULT '{}',
  rules TEXT,
  instructions TEXT,
  primary_font TEXT,
  clickup_list_id TEXT,
  meta_instagram_account_id TEXT,
  meta_page_id TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

-- 3. PROJECT FONTS
CREATE TABLE IF NOT EXISTS project_fonts (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_name TEXT NOT NULL,
  format TEXT NOT NULL,
  url TEXT NOT NULL,
  role TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

-- 4. CONTENT PIECES
CREATE TABLE IF NOT EXISTS content_pieces (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  caption TEXT,
  hashtags TEXT,
  platform TEXT NOT NULL DEFAULT 'instagram',
  format TEXT NOT NULL DEFAULT 'post',
  status TEXT NOT NULL DEFAULT 'draft',
  image_url TEXT,
  image_prompt TEXT,
  scheduled_date TEXT,
  notes TEXT,
  clickup_task_id TEXT,
  extracted_content TEXT,
  approval_token TEXT UNIQUE,
  approval_comment TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

-- 5. TEMPLATES
CREATE TABLE IF NOT EXISTS templates (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  platform TEXT,
  format TEXT,
  caption_template TEXT,
  prompt_template TEXT,
  reference_image_url TEXT,
  slide_count INTEGER,
  category TEXT,
  is_global BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

-- 6. KNOWLEDGE BASE
CREATE TABLE IF NOT EXISTS knowledge_base (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

-- 7. PROMPTS
CREATE TABLE IF NOT EXISTS prompts (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  platform TEXT,
  format TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

-- 8. AGENT PROFILES
CREATE TABLE IF NOT EXISTS agent_profiles (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
  agent_type TEXT DEFAULT 'estrategia',
  name TEXT NOT NULL,
  description TEXT,
  persona_description TEXT,
  reference_personas TEXT,
  tone_characteristics TEXT[] DEFAULT '{}',
  voice_register TEXT,
  delivery_depth TEXT DEFAULT 'intermediário',
  content_objectives TEXT[] DEFAULT '{}',
  content_pillars TEXT[] DEFAULT '{}',
  preferred_frameworks TEXT[] DEFAULT '{}',
  target_audience TEXT,
  audience_pains TEXT,
  audience_dreams TEXT,
  restrictions TEXT[] DEFAULT '{}',
  forbidden_words TEXT[] DEFAULT '{}',
  hook_style TEXT,
  cta_style TEXT,
  visual_mood TEXT,
  color_approach TEXT,
  typography_style TEXT,
  layout_preferences TEXT,
  graphic_elements TEXT,
  reference_images TEXT[] DEFAULT '{}',
  extracted_visual_style TEXT,
  is_global BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

-- 9. APP SETTINGS
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

-- 10. CONVERSATIONS
CREATE TABLE IF NOT EXISTS conversations (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

-- 11. MESSAGES
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

-- ============================================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_project_fonts_project_id ON project_fonts(project_id);
CREATE INDEX IF NOT EXISTS idx_content_pieces_project_id ON content_pieces(project_id);
CREATE INDEX IF NOT EXISTS idx_content_pieces_status ON content_pieces(status);
CREATE INDEX IF NOT EXISTS idx_content_pieces_platform ON content_pieces(platform);
CREATE INDEX IF NOT EXISTS idx_content_pieces_approval_token ON content_pieces(approval_token);
CREATE INDEX IF NOT EXISTS idx_templates_project_id ON templates(project_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_project_id ON knowledge_base(project_id);
CREATE INDEX IF NOT EXISTS idx_agent_profiles_project_id ON agent_profiles(project_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);

