<p align="center">
  <img src="client/public/raya-logo.png" alt="Raya Studio" width="80" />
</p>

<h1 align="center">Raya Studio</h1>

<p align="center">
  <strong>A plataforma de criação de conteúdo com IA feita para agências.</strong><br/>
  Do briefing à aprovação do cliente — tudo em um único lugar.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/versão-1.0-orange?style=flat-square" />
  <img src="https://img.shields.io/badge/plataforma-Web-blue?style=flat-square" />
  <img src="https://img.shields.io/badge/IA-OpenAI%20%7C%20Anthropic%20%7C%20Gemini-purple?style=flat-square" />
</p>

---

## O Problema

Agências de marketing digital perdem **horas por semana** alternando entre dezenas de ferramentas:

- Planilhas para calendários editoriais
- ChatGPT avulso para legendas e ideias
- Canva para criação de imagens
- WhatsApp/email para aprovação do cliente
- Trello/Monday para gerenciar status
- Documentos espalhados com tom de voz, cores e briefings

O resultado? **Retrabalho, inconsistência de marca e gargalos de aprovação.**

---

## A Solução

O **Raya Studio** centraliza todo o fluxo de produção de conteúdo em uma plataforma inteligente:

### 🎯 Projetos por Cliente
Cada cliente da agência é um projeto com identidade visual completa — logo, paleta de cores, tipografia, briefing criativo e regras de marca. A IA respeita tudo isso automaticamente.

### ✍️ Criação de Conteúdo com IA
Gere **legendas, hashtags e imagens** com um clique. A IA entende o contexto do cliente, aplica o tom de voz correto e segue o brief de design — sem copiar e colar entre ferramentas.

### 📅 Calendário Editorial Inteligente
A IA atua como uma **Social Media Sênior** e gera o planejamento quinzenal estratégico, considerando:
- Funil de conteúdo (topo, meio e fundo)
- Mix entre conteúdo educativo, relacional e promocional
- Formatos variados por plataforma (post, carrossel, story, reels)
- Distribuição inteligente ao longo da quinzena

### 🤖 Agentes de IA Personalizáveis
Crie **personas criativas** que definem como a IA se comporta:

| Agente de Estratégia | Agente de Design |
|---|---|
| Tom de voz e registro | Mood visual e estética |
| Pilares e objetivos de conteúdo | Paleta de cores e tipografia |
| Frameworks (AIDA, PAS...) | Referências visuais |
| Público-alvo, dores e desejos | Elementos gráficos |
| Estilo de hook e CTA | Extração automática de estilo |

### ✅ Aprovação de Cliente em Um Clique
Envie um **link de aprovação** para o cliente — sem necessidade de login. Ele visualiza o conteúdo e pode:
- ✅ **Aprovar** → o conteúdo avança no pipeline
- ✏️ **Pedir revisão** → com comentário que aparece como notificação na plataforma

### 📝 Templates, Prompts e Base de Conhecimento
Monte uma biblioteca reutilizável de templates, prompts e informações do cliente. Tudo alimenta o contexto da IA para resultados cada vez mais precisos.

---

## Funcionalidades Principais

| Funcionalidade | Descrição |
|---|---|
| **Dashboard** | Visão geral de todos os projetos com métricas e pipeline de status |
| **Gestão de Projetos** | Identidade visual, brief, fontes, regras e integrações por cliente |
| **Criador de Conteúdo** | Legendas + imagens geradas por IA com contexto completo |
| **Calendário Editorial** | Planejamento quinzenal gerado por IA com estratégia de funil |
| **Agentes de IA** | Personas de estratégia e design que guiam a criação |
| **Templates** | Modelos de legenda e prompt reutilizáveis por plataforma |
| **Prompts** | Biblioteca de prompts por categoria (venda, engajamento, storytelling...) |
| **Base de Conhecimento** | Informações do cliente que a IA consulta automaticamente |
| **Aprovação do Cliente** | Link público para aprovação/revisão com comentários |
| **Configurações** | Chaves de API, integrações (ClickUp, Meta) e conta |

---

## Plataformas Suportadas

| Rede Social | Formatos |
|---|---|
| **Instagram** | Post (1080×1080), Story/Reels (1080×1920), Carrossel |
| **LinkedIn** | Post Landscape (1200×627), Post Quadrado (1080×1080), Banner (1128×191) |

---

## Provedores de IA

O Raya Studio é **multi-provider** — você escolhe qual IA usar:

| Provider | Geração de Texto | Geração de Imagem |
|---|---|---|
| **OpenAI** | ✅ | ✅ |
| **Anthropic** | ✅ | — |
| **Google Gemini** | ✅ | ✅ |

> Os modelos disponíveis são detectados automaticamente a partir das chaves configuradas em **Configurações → IA**. Como os providers lançam modelos novos com frequência, a plataforma sempre usa os mais recentes — sem deploy.

---

## Pipeline de Conteúdo

Cada peça de conteúdo passa por um pipeline visual:

```
À Fazer → Em Revisão → Aprovado → Agendado → Publicado
```

O gerenciamento é feito via **kanban** dentro do projeto, com movimentação de status e filtragem por plataforma e formato.

---

## Fluxo de Trabalho

```
1. Crie o projeto do cliente (cores, fontes, brief)
2. Configure os agentes de IA (estratégia + design)
3. Alimente a base de conhecimento
4. Gere o calendário quinzenal com IA
5. Crie o conteúdo (legenda + imagem)
6. Envie o link de aprovação ao cliente
7. Cliente aprova ou solicita ajustes
8. Agende e publique
```

---

## Integrações

| Serviço | Funcionalidade |
|---|---|
| **ClickUp** | Sincronização de tarefas por projeto |
| **Meta Business** | Conexão com contas do Instagram e páginas do Facebook |

---

## Stack Técnica

| Camada | Tecnologia |
|---|---|
| **Frontend** | React 18 + Vite 7, Wouter (router), TanStack Query, shadcn/ui + Tailwind CSS |
| **Backend** | Node.js 20 + Express 5, Passport (auth local), Helmet + rate limiting |
| **Banco de Dados** | PostgreSQL 15 + Drizzle ORM (migrações em `migrations/`) |
| **Storage de Assets** | S3-compatível (AWS, MinIO, DigitalOcean Spaces) ou disco local |
| **SDKs de IA** | `openai`, `@anthropic-ai/sdk`, `@google/generative-ai` |
| **Empacotamento** | esbuild (bundle do servidor) + Vite (bundle do cliente) |
| **Container** | Docker multi-stage + docker-compose |

---

## Como Rodar Localmente

**Pré-requisitos:** Node.js 20+, Docker (para o Postgres) e npm.

```bash
# 1. Clonar e instalar dependências
git clone <repo>
cd Raya-Studio
npm install

# 2. Copiar variáveis de ambiente (ajuste os valores se necessário)
cp .env.example .env

# 3. Subir o Postgres em container (porta 5434)
npm run docker:db

# 4. Aplicar o schema no banco
npm run db:push

# 5. Iniciar o servidor de desenvolvimento (HMR via Vite)
npm run dev
```

Acesse `http://localhost:5000`.

> **Login inicial:** o seed cria automaticamente o usuário definido em `ADMIN_USERNAME` / `ADMIN_PASSWORD` (default: `adm@raya.local` / `raya-dev-password`). Configure as chaves de IA em **Configurações → IA** após o primeiro login.

Para detalhes (Postgres remoto, geração de migrações, etc.) veja [docs/SETUP.md](docs/SETUP.md).

---

## Deploy em Produção

A forma recomendada é via Docker Compose, que sobe o app + Postgres em uma stack única:

```bash
# Ajuste o .env com os valores de produção (ver checklist abaixo)
docker compose up -d --build
```

**Checklist obrigatório de produção:**
- [ ] `SESSION_SECRET` — string aleatória longa (ex.: `openssl rand -hex 32`)
- [ ] `ADMIN_PASSWORD` — senha forte para o usuário inicial
- [ ] `DATABASE_URL` apontando para o Postgres gerenciado (ou interno do compose)
- [ ] `PUBLIC_BASE_URL` — URL pública do app, usada nos links de aprovação enviados ao cliente
- [ ] `NODE_ENV=production` (ativa migrações automáticas no boot, cookie seguro, etc.)
- [ ] Reverse proxy (Nginx/Caddy) com HTTPS
- [ ] (Opcional) S3 configurado para storage durável de imagens geradas

Guia completo, incluindo backup dos volumes e exemplos de Nginx, em [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

---

## Variáveis de Ambiente

Todas as variáveis vivem no `.env` (use `.env.example` como base).

| Variável | Obrigatório | Descrição |
|---|---|---|
| `DATABASE_URL` | ✅ | Connection string do Postgres |
| `DATABASE_SSL` | — | `true` para Postgres remoto com SSL |
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | ⚠️ Docker | Credenciais do container Postgres do compose |
| `SESSION_SECRET` | ✅ produção | Chave para assinar cookies de sessão |
| `ADMIN_USERNAME` | — | Usuário admin criado no seed (default `adm@raya.local`) |
| `ADMIN_PASSWORD` | ✅ produção | Senha do usuário admin inicial |
| `NODE_ENV` | — | `development` ou `production` |
| `PORT` | — | Porta do servidor (default `5000`) |
| `PUBLIC_BASE_URL` | ✅ produção | URL pública usada nos links de aprovação |
| `RUN_MIGRATIONS` | — | `true` para rodar migrações Drizzle no boot de produção |
| `AI_RATE_LIMIT_PER_MINUTE` | — | Limite global por minuto nos endpoints `/api/ai` (default `20`) |
| `CHAT_MODEL` | — | Modelo OpenAI usado nas conversas (default `gpt-4o`) |
| `S3_BUCKET` / `S3_REGION` / `S3_ENDPOINT` | — | Configuração do bucket S3-compatível (vazio = storage local) |
| `S3_FORCE_PATH_STYLE` | — | `true` para MinIO/Spaces |
| `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY` | ⚠️ S3 | Credenciais quando `S3_BUCKET` estiver definido |
| `S3_PUBLIC_BASE_URL` | — | Base pública dos arquivos no bucket (CDN, por exemplo) |

> ⚠️ As **chaves dos providers de IA (OpenAI, Anthropic, Gemini) NÃO ficam no `.env`** — são salvas no banco via UI em **Configurações → IA**, o que permite trocar/rodar multi-tenant sem redeploy.

---

## Scripts Disponíveis

| Script | O que faz |
|---|---|
| `npm run dev` | Servidor + Vite HMR em modo desenvolvimento |
| `npm run build` | Build de produção (cliente + servidor) |
| `npm run start` | Roda o build de produção (`dist/index.cjs`) |
| `npm run check` | TypeScript check em todo o projeto |
| `npm run db:generate` | Gera nova migração Drizzle a partir do schema |
| `npm run db:push` | Aplica o schema direto no banco (uso local rápido) |
| `npm run db:migrate` | Roda as migrações versionadas em `migrations/` |
| `npm run db:reset` | **Apaga e recria o schema** (cuidado em qualquer ambiente que não seja descartável) |
| `npm run docker:db` | Sobe apenas o serviço Postgres do compose |
| `npm run docker:up` | Sobe a stack inteira (app + Postgres) |
| `npm run docker:down` | Derruba a stack |

---

## Documentação Adicional

- [docs/SETUP.md](docs/SETUP.md) — guia detalhado de setup local
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) — checklist de produção, backup e proxy reverso
- [docs/RAYA_STUDIO_RELEITURA_PRD_MVP.md](docs/RAYA_STUDIO_RELEITURA_PRD_MVP.md) — releitura estratégica do produto e roadmap

---

## Suporte

Para dúvidas, sugestões ou suporte técnico, entre em contato com nossa equipe.

---

<p align="center">
  <strong>Raya Studio</strong> · Explore sua Criatividade<br/>
  <sub>Feito para agências que querem produzir mais, com mais qualidade e menos esforço.</sub>
</p>
