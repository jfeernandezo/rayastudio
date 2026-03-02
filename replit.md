# ContentFlow — replit.md

## Overview

ContentFlow is a social media content management platform built for digital agencies. It helps teams create, organize, schedule, and publish content across Instagram and LinkedIn for multiple client projects.

**Core features:**
- **Projects** — manage multiple client brands, each with their own instructions, brand colors, niches, and tone-of-voice rules
- **Content Creator** — AI-assisted caption and image generation per content piece (post, story, carrossel, reels)
- **Calendar** — visual monthly calendar for scheduling content across platforms
- **Templates** — reusable caption/prompt templates (global or per-project)
- **Knowledge Base** — store brand knowledge (target audience, tone, references, etc.) per project
- **Prompts** — save and reuse AI prompts categorized by type, platform, and format
- **AI integrations** — OpenAI for caption generation, image generation (gpt-image-1), image analysis, voice chat, and batch processing

The app is built as a monorepo with a React frontend (Vite) and an Express backend (Node.js), sharing types via a `shared/` folder. The UI is in Brazilian Portuguese.

---

## User Preferences

Preferred communication style: Simple, everyday language.

---

## System Architecture

### Frontend (React + Vite)

- **Framework:** React 18 with TypeScript, bundled by Vite
- **Routing:** `wouter` (lightweight client-side router)
- **State / data fetching:** TanStack React Query with a custom `apiRequest` helper; all server state is server-side — no global client store
- **UI components:** shadcn/ui (New York style) built on Radix UI primitives + Tailwind CSS
- **Forms:** React Hook Form with Zod resolvers (schemas shared from `shared/schema.ts`)
- **Styling:** Tailwind CSS with CSS custom properties for theming (light/dark mode via `class` strategy); color palette is purple-primary
- **Fonts:** DM Sans (body), Fira Code / Geist Mono (mono), Architects Daughter (accent)
- **Path aliases:** `@/` → `client/src/`, `@shared/` → `shared/`

**Pages:**
| Route | Component |
|---|---|
| `/` | Dashboard |
| `/projects` | Projects list |
| `/projects/:id` | Project detail + content list |
| `/projects/:id/content/:contentId` | Content creator/editor |
| `/projects/:id/content/new` | New content creator |
| `/templates` | Templates library |
| `/knowledge` | Knowledge base |
| `/prompts` | Prompts library |
| `/calendar` | Content calendar |

### Backend (Express + Node.js)

- **Entry point:** `server/index.ts` — creates the HTTP server, mounts middleware, calls `registerRoutes`, seeds the database on first boot
- **Routing:** All API routes registered in `server/routes.ts` under `/api/*`
- **Storage layer:** `server/storage.ts` exports an `IStorage` interface implemented against PostgreSQL via Drizzle ORM; this abstraction makes it easy to swap implementations
- **Dev server:** In development, Vite runs as Express middleware (`server/vite.ts`); in production, the built static files are served from `dist/public/`
- **Build:** Custom `script/build.ts` runs `viteBuild()` then `esbuild` for the server, bundling a curated allowlist of dependencies into a single `dist/index.cjs`

**REST API resources:**
- `/api/projects` — CRUD for client projects
- `/api/content` — CRUD for content pieces (filterable by `projectId`)
- `/api/templates` — CRUD for templates
- `/api/knowledge` — CRUD for knowledge base items
- `/api/prompts` — CRUD for prompt library
- `/api/conversations` + `/api/messages` — AI chat history
- `/api/generate-caption` — OpenAI text generation
- `/api/generate-image` — OpenAI image generation (gpt-image-1)
- `/api/analyze-image` — OpenAI vision analysis
- `/api/generate-calendar` — AI-assisted bulk content calendar generation

### Database (PostgreSQL + Drizzle ORM)

- **ORM:** Drizzle ORM with `drizzle-kit` for migrations (`migrations/` folder, `db:push` script)
- **Connection:** `pg` Pool via `DATABASE_URL` environment variable
- **Schema file:** `shared/schema.ts` (single source of truth for both backend and frontend types via `drizzle-zod`)

**Tables:**
| Table | Purpose |
|---|---|
| `users` | Authentication (username + hashed password) |
| `projects` | Client projects with brand settings |
| `content_pieces` | Individual content items with platform, format, status, caption, hashtags, image |
| `templates` | Reusable caption/prompt templates |
| `knowledge_base` | Brand knowledge entries per project |
| `prompts` | Saved AI prompt templates |
| `conversations` | AI chat conversation threads |
| `messages` | Individual messages within a conversation |

### Authentication

- Basic user table exists (`users` with username/password) but no session middleware or auth routes are wired up in the visible routes — the storage interface includes `getUser`/`createUser` methods ready to be connected
- `connect-pg-simple` is in dependencies, suggesting session-based auth with PostgreSQL session store was planned or partially implemented

### Shared Code

- `shared/schema.ts` — all Drizzle table definitions + Zod insert schemas + TypeScript types (used by both server and client)
- `shared/models/chat.ts` — conversation/message table definitions (also imported into the main schema)

### Replit AI Integrations (modular)

Located under `server/replit_integrations/` and `client/replit_integrations/`:

- **Chat** (`/chat`) — conversation + message storage, streaming chat via OpenAI
- **Image** (`/image`) — image generation via `gpt-image-1`
- **Audio** (`/audio`) — voice recording (client), speech-to-text, text-to-speech, PCM16 streaming playback via AudioWorklet (client)
- **Batch** (`/batch`) — generic rate-limited, retry-enabled batch processor using `p-limit` + `p-retry`

Each integration is self-contained with its own `routes.ts`, `client.ts`, and `index.ts`.

---

## External Dependencies

### AI / OpenAI
- **Package:** `openai`
- **Environment variables:** `AI_INTEGRATIONS_OPENAI_API_KEY`, `AI_INTEGRATIONS_OPENAI_BASE_URL`
- **Used for:** caption generation, image generation (`gpt-image-1`), image analysis (vision), speech-to-text, text-to-speech, voice chat streaming

### Database
- **PostgreSQL** via `pg` driver
- **Environment variable:** `DATABASE_URL`
- **ORM:** `drizzle-orm` with `drizzle-kit` for schema migrations

### File Uploads
- **`multer`** — handles multipart/form-data for image uploads; stored in memory (up to 20 MB per file)

### Key Frontend Libraries
| Library | Purpose |
|---|---|
| `@tanstack/react-query` | Server state management + data fetching |
| `wouter` | Client-side routing |
| `react-hook-form` + `@hookform/resolvers` | Form state + Zod validation |
| `zod` / `drizzle-zod` | Schema validation shared between client and server |
| `date-fns` | Date formatting and calendar math (with `ptBR` locale) |
| `radix-ui/*` | Accessible headless UI primitives |
| `lucide-react` | Icon set |
| `embla-carousel-react` | Carousel component |
| `recharts` | Chart components |
| `vaul` | Drawer component |
| `cmdk` | Command palette |

### Key Backend Libraries
| Library | Purpose |
|---|---|
| `express` | HTTP server framework |
| `express-session` + `connect-pg-simple` | Session management with PostgreSQL store |
| `passport` + `passport-local` | Authentication strategy |
| `multer` | File upload handling |
| `nanoid` | Unique ID generation |
| `p-limit` + `p-retry` | Batch concurrency control and retry logic |
| `ws` | WebSocket support |
| `xlsx` | Excel file processing |
| `nodemailer` | Email sending |

### Replit-Specific
- `@replit/vite-plugin-runtime-error-modal` — shows runtime errors in dev
- `@replit/vite-plugin-cartographer` — Replit dev tooling
- `@replit/vite-plugin-dev-banner` — Replit dev tooling
- `REPL_ID` env var is checked to conditionally load Replit-only plugins