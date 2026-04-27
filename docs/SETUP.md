# Setup Local — Raya Studio

Guia detalhado para rodar o Raya Studio em ambiente de desenvolvimento.

---

## Pré-requisitos

- **Node.js 20+** (testado em 20 LTS)
- **npm** (vem com o Node)
- **Docker + Docker Compose** (recomendado para o Postgres) — alternativamente, uma instância Postgres 14+ local ou remota
- **Git**

Verifique:

```bash
node -v   # deve ser >= 20
npm -v
docker --version
```

---

## Setup Rápido

```bash
git clone <repo>
cd Raya-Studio
npm install
cp .env.example .env
npm run docker:db   # sobe Postgres em container na porta 5434
npm run db:push     # aplica o schema no banco
npm run dev         # inicia servidor + Vite HMR em http://localhost:5000
```

Depois acesse `http://localhost:5000` e faça login com:

- Usuário: `adm@raya.local`
- Senha: `raya-dev-password`

---

## Banco de Dados

O Raya Studio usa **PostgreSQL 15** + **Drizzle ORM**. Você pode rodar o banco de três formas:

### Opção A — Postgres via Docker Compose (recomendado)

O `docker-compose.yml` já define um serviço `postgres`. Para subir só ele:

```bash
npm run docker:db
```

Isso expõe o banco em `localhost:5434` com:
- usuário: `raya`
- senha: `raya_dev_password`
- database: `raya`

O `.env.example` já vem configurado para essa porta. Os dados ficam em um volume Docker (`raya_postgres_data`) e persistem entre restarts.

Para parar:

```bash
npm run docker:down
```

### Opção B — Postgres local instalado

Se preferir um Postgres instalado nativamente, ajuste o `.env`:

```env
DATABASE_URL=postgresql://USUARIO:SENHA@localhost:5432/raya
DATABASE_SSL=false
```

Crie o database manualmente:

```bash
createdb raya
```

### Opção C — Postgres remoto (gerenciado, RDS, Cloud SQL, etc.)

```env
DATABASE_URL=postgresql://USUARIO:SENHA@HOST:5432/raya?sslmode=require
DATABASE_SSL=true
```

> O app faz `pool.connect()` no boot via `waitForDb()` em [server/db.ts](../server/db.ts) e falha rápido se o DB não responder — útil para detectar misconfig cedo.

---

## Migrações

O projeto usa **Drizzle Kit** para gerenciar o schema. Há três fluxos:

| Comando | Quando usar |
|---|---|
| `npm run db:push` | Dev local: aplica o schema atual diretamente, sem versionar. Rápido para iterar. |
| `npm run db:generate` | Gera um novo arquivo SQL em `migrations/` baseado nas mudanças do `shared/schema.ts`. |
| `npm run db:migrate` | Aplica as migrações versionadas (rodado automaticamente no boot de produção quando `RUN_MIGRATIONS=true`). |
| `npm run db:reset` | **Apaga e recria o schema do zero.** Só em ambientes descartáveis. |

Fluxo típico ao mudar o schema:

1. Edite `shared/schema.ts`
2. `npm run db:generate` → cria `migrations/000X_*.sql`
3. Revise o SQL gerado
4. `npm run db:push` em dev / `npm run db:migrate` em prod

---

## Usuário Inicial (Seed)

O arquivo [server/seed.ts](../server/seed.ts) cria/atualiza um usuário admin no boot. As credenciais vêm do `.env`:

```env
ADMIN_USERNAME=adm@raya.local
ADMIN_PASSWORD=raya-dev-password
```

Em produção, **mude essa senha antes do primeiro boot**. O seed usa `onConflictDoUpdate`, então alterar `ADMIN_PASSWORD` e reiniciar o app sincroniza a nova senha.

---

## Configurar Chaves de IA

As chaves dos providers (OpenAI, Anthropic, Gemini) **não vão no `.env`**. São salvas no banco via UI:

1. Logue no app
2. Vá em **Configurações → IA**
3. Cole a chave de cada provider e salve

A plataforma detecta automaticamente os modelos disponíveis em cada provider e os exibe na criação de conteúdo.

> Vantagem: trocar de chave (ou rodar multi-tenant no futuro) não exige redeploy.

Exceção: o modelo do chat de testes interno usa `process.env.CHAT_MODEL` (default `gpt-4o`) e a credencial em `AI_INTEGRATIONS_OPENAI_API_KEY`.

---

## Storage de Imagens Geradas

Por padrão, imagens geradas pela IA são salvas em `uploads/generated/YYYY-MM-DD/`. O Express serve essa pasta como rota estática.

Para usar S3-compatível (AWS, MinIO, DigitalOcean Spaces) em dev, configure no `.env`:

```env
S3_BUCKET=raya-dev
S3_REGION=us-east-1
S3_ENDPOINT=http://localhost:9000   # MinIO local, por exemplo
S3_FORCE_PATH_STYLE=true
S3_ACCESS_KEY_ID=minioadmin
S3_SECRET_ACCESS_KEY=minioadmin
S3_PUBLIC_BASE_URL=http://localhost:9000/raya-dev
```

Se `S3_BUCKET` estiver vazio, o app cai automaticamente no storage local — não precisa mudar código.

---

## Hot Reload

Em dev (`npm run dev`), o Vite cuida do HMR do frontend e o `tsx` reinicia o servidor automaticamente quando arquivos em `server/` ou `shared/` mudam.

- Frontend: refresh instantâneo
- Backend: o server reinicia em ~1s (mantém conexão DB via pool)

---

## Verificação Pós-Setup

Rode o smoke test mental:

1. Acessar `http://localhost:5000` → deve redirecionar para `/login`
2. Login com credenciais do seed → vai para `/` (dashboard vazio)
3. Criar um projeto → aparece na lista
4. Criar um conteúdo dentro do projeto → aparece como "rascunho"
5. Compartilhar link de aprovação → abre `/approve/:token` em modo anônimo
6. Aprovar pelo link → status muda para "aprovado" no painel

Se algum passo falhar, confira:

- Logs do servidor no terminal
- `npm run check` para erros TypeScript
- Postgres rodando: `docker compose ps` ou `pg_isready`

---

## Estrutura de Pastas

```
.
├── client/              # Frontend React + Vite
│   └── src/
│       ├── pages/       # Rotas (dashboard, projects, content-creator, approve, ...)
│       ├── components/  # UI (sidebar, shadcn)
│       └── lib/         # Helpers e queryClient
├── server/              # Backend Express + Drizzle
│   ├── index.ts         # Entry point — setup security, auth, routes
│   ├── routes.ts        # Todas as rotas /api/*
│   ├── auth.ts          # Passport-Local + scrypt + sessões em Postgres
│   ├── db.ts            # Pool pg + Drizzle
│   ├── migrate.ts       # Runner de migrações no boot
│   ├── security.ts      # Helmet + rate limit
│   ├── asset-storage.ts # S3 ou disco local
│   ├── dns-fix.ts       # Workaround de DNS para alguns ambientes
│   ├── seed.ts          # Cria usuário admin
│   └── storage.ts       # Camada de acesso a dados (Drizzle)
├── shared/              # Tipos e schema Drizzle compartilhados
├── migrations/          # SQL versionado (gerado pelo Drizzle Kit)
├── docs/                # Esta documentação
├── docker-compose.yml   # Stack app + Postgres
├── Dockerfile           # Build multi-stage
└── .env.example         # Template de variáveis
```

---

## Próximos Passos

- Para colocar em produção: [DEPLOYMENT.md](DEPLOYMENT.md)
- Para entender o produto e roadmap: [RAYA_STUDIO_RELEITURA_PRD_MVP.md](RAYA_STUDIO_RELEITURA_PRD_MVP.md)
