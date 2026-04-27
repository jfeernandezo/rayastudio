# Deploy em Produção — Raya Studio

Guia para colocar o Raya Studio rodando em produção. A stack recomendada é **Docker Compose + Postgres + reverse proxy com HTTPS**.

---

## Visão Geral da Arquitetura

```
                   ┌──────────────────┐
   Internet ──────►│ Nginx / Caddy    │ (HTTPS, gzip, headers)
                   │  Reverse Proxy   │
                   └────────┬─────────┘
                            │ http://app:5000
                   ┌────────▼─────────┐
                   │  Raya Studio     │  (Express + Vite build)
                   │  container       │  uploads → /app/uploads (volume)
                   └────────┬─────────┘
                            │ postgresql://postgres:5432
                   ┌────────▼─────────┐
                   │  Postgres 15     │  data → /var/lib/postgresql/data (volume)
                   └──────────────────┘
```

---

## Checklist Pré-Deploy

Antes do primeiro `docker compose up`, garanta no `.env`:

- [ ] `NODE_ENV=production`
- [ ] `SESSION_SECRET` — string aleatória longa. Gere com `openssl rand -hex 32`
- [ ] `ADMIN_USERNAME` / `ADMIN_PASSWORD` — credenciais do usuário admin inicial. **Use senha forte.**
- [ ] `DATABASE_URL` — connection string para o Postgres (interno do compose ou gerenciado)
- [ ] `DATABASE_SSL=true` se o Postgres for remoto/gerenciado
- [ ] `PUBLIC_BASE_URL=https://app.seudominio.com` — usado nos links de aprovação enviados ao cliente
- [ ] `RUN_MIGRATIONS=true` — migrações Drizzle rodam no boot
- [ ] `AI_RATE_LIMIT_PER_MINUTE` — ajuste conforme uso esperado (default `20`)
- [ ] `CHAT_MODEL` — opcional, default `gpt-4o`
- [ ] (Opcional, mas recomendado) Credenciais S3 para storage durável de imagens

---

## Deploy via Docker Compose

```bash
# No servidor de produção
git clone <repo>
cd Raya-Studio
cp .env.example .env

# Edite o .env com os valores de produção (ver checklist acima)
nano .env

# Subir a stack (build + start em background)
docker compose up -d --build

# Acompanhar logs
docker compose logs -f app
```

O healthcheck do Postgres garante que o app só sobe depois que o banco aceita conexões. As migrações Drizzle rodam automaticamente no boot quando `NODE_ENV=production` e `RUN_MIGRATIONS=true`.

### Atualização

```bash
git pull
docker compose up -d --build app   # rebuild só do app, mantém DB rodando
docker compose logs -f app
```

---

## Storage de Imagens em Produção

### Opção A — Volume Docker local (default)

Imagens geradas vão para `/app/uploads/generated/...` dentro do container, mapeado para o volume `raya_uploads`. Funciona, mas:

- Não escala horizontalmente (uma única réplica)
- Backup precisa incluir o volume

### Opção B — S3-compatível (recomendado)

Configure as variáveis `S3_*` no `.env`. O app passa a fazer upload para o bucket e armazena apenas a URL pública no banco.

Funciona com:
- **AWS S3** — `S3_REGION` + credenciais IAM
- **MinIO** self-hosted — `S3_ENDPOINT=https://minio.seudominio.com`, `S3_FORCE_PATH_STYLE=true`
- **DigitalOcean Spaces** — `S3_ENDPOINT=https://nyc3.digitaloceanspaces.com`, `S3_FORCE_PATH_STYLE=true`
- **Cloudflare R2** — endpoint do tipo `https://<account>.r2.cloudflarestorage.com`

Defina `S3_PUBLIC_BASE_URL` se as URLs públicas forem servidas por uma CDN diferente do endpoint (ex.: CloudFront na frente do S3).

---

## Reverse Proxy

A stack expõe o app na porta `5000` do host. Coloque um proxy reverso na frente para HTTPS, gzip e headers de segurança.

### Exemplo Nginx

```nginx
server {
    listen 80;
    server_name app.seudominio.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name app.seudominio.com;

    ssl_certificate     /etc/letsencrypt/live/app.seudominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.seudominio.com/privkey.pem;

    client_max_body_size 25M;   # uploads de imagem podem chegar a 20MB

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade           $http_upgrade;
        proxy_set_header Connection        "upgrade";
        proxy_read_timeout 300s;            # streaming de IA pode ser longo
    }
}
```

### Exemplo Caddy (mais simples, HTTPS automático)

```caddyfile
app.seudominio.com {
    reverse_proxy 127.0.0.1:5000
    encode gzip
}
```

---

## Backup

Dois volumes precisam de backup regular:

| Volume | Conteúdo | Frequência sugerida |
|---|---|---|
| `raya_postgres_data` | Banco completo (projetos, conteúdos, sessões) | Diário |
| `raya_uploads` | Imagens geradas e fontes (se não usar S3) | Diário |

### Backup do Postgres

```bash
# Dump completo
docker compose exec -T postgres pg_dump -U raya raya | gzip > backup-$(date +%F).sql.gz

# Restore
gunzip < backup-2026-04-27.sql.gz | docker compose exec -T postgres psql -U raya -d raya
```

Automatize via cron:

```cron
0 3 * * * cd /opt/raya-studio && docker compose exec -T postgres pg_dump -U raya raya | gzip > /backups/raya-$(date +\%F).sql.gz
```

### Backup dos Uploads

```bash
docker run --rm -v raya_uploads:/data -v $(pwd):/backup alpine \
  tar czf /backup/uploads-$(date +%F).tar.gz -C /data .
```

Se estiver usando S3, ative versionamento + lifecycle no bucket — o backup vira responsabilidade do provider.

---

## Logs e Monitoramento

O app loga no `stdout`/`stderr` (capturado pelo Docker). Inspecione com:

```bash
docker compose logs -f app
docker compose logs --tail=200 app
```

Para produção real, encaminhe para algum coletor (Loki, Datadog, CloudWatch). Exemplo de driver de log no `docker-compose.yml`:

```yaml
services:
  app:
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "5"
```

Métricas básicas que valem monitorar:
- Healthcheck HTTP em `/api/me` (retorna 401 se não logado, 200 se logado — basta checar 2xx/4xx vs 5xx)
- Latência de `/api/ai/*` (depende dos providers externos)
- Uso de disco do volume `raya_uploads` (se sem S3)
- Conexões ativas no Postgres

---

## Troubleshooting

### App não sobe — `DATABASE_URL precisa estar definido`

Falta a env. Confira que o `.env` tá no diretório do compose e que a variável não tá comentada.

### App sobe mas dá erro 502 no Nginx

Provavelmente o app não terminou de bootar (migrações longas no primeiro deploy). Veja `docker compose logs app`.

### Imagens geradas não aparecem em produção

- Sem S3: confira que o volume `raya_uploads` está montado e que o Express está servindo `/uploads/generated`. Em produção, o reverse proxy precisa repassar essas rotas (não filtrar).
- Com S3: confira que `S3_PUBLIC_BASE_URL` aponta para uma URL acessível publicamente.

### Cookie de sessão não persiste após login

`SESSION_SECRET` mudou entre restarts. Em produção, defina uma única vez e mantenha. Sessions são invalidadas quando o secret muda.

### Rate limit muito agressivo

Ajuste `AI_RATE_LIMIT_PER_MINUTE`. Lembrando: o limit é por IP, então usuários atrás de NAT compartilham o mesmo limite.

### "Failed to send message" no chat

Confira `AI_INTEGRATIONS_OPENAI_API_KEY` e `CHAT_MODEL`. Se o modelo não existir/a chave não tiver acesso, a stream falha logo no início.

---

## Rollback Rápido

```bash
git log --oneline -10                 # encontre o SHA bom
git checkout <sha>
docker compose up -d --build app
```

Se a versão nova rodou migrações destrutivas, restore o backup do Postgres antes do checkout:

```bash
gunzip < /backups/raya-2026-04-26.sql.gz | docker compose exec -T postgres psql -U raya -d raya
```

---

## Próximos Passos Recomendados

- Configurar S3 desde o início (evita migração de assets depois)
- Habilitar backups automáticos antes de abrir para clientes reais
- Criar um usuário admin secundário e desabilitar/rotacionar o do seed
- Considerar criptografia at-rest das chaves de IA salvas em `app_settings` (atualmente em texto puro no banco)
