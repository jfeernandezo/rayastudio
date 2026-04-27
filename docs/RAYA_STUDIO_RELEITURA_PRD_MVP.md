# Raya Studio - Releitura Estrategica, PRD e MVP

Este documento consolida a conversa sobre a evolucao do Raya Studio para um sistema baseado em processos, voltado para otimizar a producao de conteudo de pequenos empresarios e agencias.

Ele deve servir como ponto de partida para a proxima etapa de desenvolvimento: revisar o produto, estabilizar o repositorio e construir um MVP solido.

## 1. Contexto

O projeto original do Raya Studio foi pensado como uma plataforma de criacao de conteudo com IA para agencias. A ideia central ja era forte: centralizar briefing, estrategia, calendario editorial, criacao com IA, aprovacao do cliente, templates, prompts e base de conhecimento.

Ao analisar o repositorio local em:

`C:\Users\contr\OneDrive\Desktop\www\Raya-Studio`

foi identificado que o projeto ja possui varias pecas importantes implementadas, mas ainda nao esta funcional nem suficientemente organizado como produto final.

O novo direcionamento proposto e transformar o Raya Studio em um sistema operacional de producao de conteudo baseado em processos.

## 2. Nova tese do produto

O Raya Studio nao deve ser apenas um "gerador de conteudo com IA".

A nova tese:

> Raya Studio e um sistema de producao de conteudo baseado em processos para pequenos empresarios e agencias, onde a IA nao gera pecas soltas, mas conduz um fluxo completo: diagnostico, estrategia, pauta, copy, direcao visual, revisao e aprovacao.

A pergunta central do produto passa a ser:

> Qual processo repetivel o Raya executa melhor do que uma pessoa alternando entre ChatGPT, Canva, Notion, planilhas, Trello e WhatsApp?

Essa mudanca e importante porque a dor real de agencias e pequenos empresarios nao e apenas "falta de ideias". A dor maior e:

- falta de processo;
- retrabalho;
- inconsistencias de marca;
- dificuldade de transformar briefing em conteudo pronto;
- aprovacao confusa com cliente;
- dependencia de ferramentas soltas;
- dificuldade de manter padrao visual e estrategico.

## 3. Publico-alvo

### Publico primario

Pequenos empresarios, criadores e prestadores de servico que precisam produzir conteudo com frequencia, mas nao tem uma equipe estruturada.

Exemplos:

- consultores;
- infoprodutores;
- profissionais liberais;
- donos de negocios locais;
- especialistas que vendem pelo Instagram ou LinkedIn;
- pequenas marcas em crescimento.

### Publico secundario

Agencias pequenas, social medias e freelancers que gerenciam conteudo para multiplos clientes.

Exemplos:

- agencias boutique;
- social medias independentes;
- designers que tambem entregam conteudo;
- copywriters que precisam estruturar posts;
- gestores de trafego que precisam apoiar criativos organicos.

## 4. Problema principal

Hoje, a producao de conteudo normalmente acontece de forma fragmentada:

1. O briefing fica em um formulario, documento ou WhatsApp.
2. A estrategia fica na cabeca do social media.
3. A copy e gerada no ChatGPT de forma avulsa.
4. A arte e feita no Canva ou Figma sem ligacao direta com o briefing.
5. O calendario fica em planilha ou Trello.
6. A aprovacao acontece pelo WhatsApp.
7. O historico se perde.

O resultado:

- muitas versoes;
- pouca padronizacao;
- demora para aprovar;
- conteudo sem consistencia;
- dificuldade de escalar;
- baixa previsibilidade operacional.

## 5. Promessa central

> Transforme um briefing em conteudo pronto para aprovar, seguindo um processo claro, com estrategia, copy e direcao visual consistentes com a marca.

Versao curta:

> Do briefing ao post aprovado, em um fluxo guiado por IA.

## 6. Releitura do Raya Studio

O Raya Studio deve funcionar como um cockpit de producao de conteudo.

Em vez de pedir ao usuario que "gere uma legenda" ou "gere uma imagem", o sistema deve conduzir uma sequencia:

1. Diagnosticar o cliente ou marca.
2. Definir regras de comunicacao.
3. Definir um sistema visual.
4. Receber um briefing de conteudo.
5. Transformar o briefing em uma estrutura.
6. Gerar a copy.
7. Gerar a direcao visual.
8. Preparar o material para revisao.
9. Enviar para aprovacao.
10. Registrar ajustes e historico.

## 7. Estado atual do repositorio

### Stack identificada

- React
- Vite
- TypeScript
- Express
- Drizzle ORM
- PostgreSQL
- Tailwind
- Radix UI
- TanStack Query
- Wouter
- OpenAI, Anthropic e Gemini como provedores de IA

### Modulos existentes

O repositorio ja possui estruturas para:

- Dashboard
- Projetos
- Detalhe de projeto
- Criador de conteudo
- Calendario editorial
- Templates
- Prompts
- Base de conhecimento
- Agentes de IA
- Configuracoes
- Login
- Aprovacao publica por link

### Entidades principais existentes

Arquivo:

`shared/schema.ts`

Entidades relevantes:

- `users`
- `projects`
- `projectFonts`
- `contentPieces`
- `templates`
- `knowledgeBase`
- `prompts`
- `agentProfiles`
- `appSettings`
- `conversations`
- `messages`

### Endpoints relevantes existentes

Arquivo:

`server/routes.ts`

Endpoints identificados:

- `/api/projects`
- `/api/content`
- `/api/templates`
- `/api/knowledge`
- `/api/prompts`
- `/api/agent-profiles`
- `/api/ai/models`
- `/api/ai/caption`
- `/api/ai/image`
- `/api/ai/analyze-image`
- `/api/ai/calendar`
- `/api/approve/:token`

### Problemas tecnicos encontrados

O projeto nao esta funcional no estado atual.

Ao executar:

```bash
npm run check
```

No momento da releitura havia erros TypeScript em diversos arquivos (incluindo as integracoes herdadas do Replit, `content-creator.tsx`, `routes.ts` e `storage.ts`). Os arquivos `server/integrations/*` foram removidos do repositorio e os demais erros foram corrigidos — `npm run check` passa limpo na versao atual.

Ao executar:

```bash
npm run dev
```

o erro encontrado foi:

```txt
'NODE_ENV' nao e reconhecido como um comando interno ou externo
```

Isso acontece porque o script atual usa sintaxe Unix:

```json
"dev": "NODE_ENV=development tsx server/index.ts"
```

No Windows, o ideal e usar `cross-env` ou adaptar o script.

### Observacao sobre git

O repositorio possui alteracoes pendentes, incluindo arquivos modificados, arquivos deletados e novos arquivos.

Antes de qualquer refatoracao tecnica, e recomendado revisar o estado do Git para separar:

- alteracoes intencionais;
- lixo herdado;
- arquivos removidos que devem permanecer removidos;
- assets importantes que nao podem ser perdidos.

## 8. Carrossel e sistema visual

Antes desta analise, foi criado um guia de estilo para carrosseis organicos baseado em uma sequencia de 9 slides de referencia.

O novo padrao definido:

- carrosseis de 5 a 6 slides;
- visual minimalista, premium e editorial;
- fundos alternando entre escuro, claro e terracota;
- tipografia grande e direta;
- cards escuros para conteudo pratico;
- terracota como cor de assinatura;
- CTA final simples e forte;
- foco em utilidade imediata.

Esse guia pode virar um recurso nativo do Raya Studio:

- template global de carrossel;
- agente de design;
- sistema de marca;
- base para geracao de posts organicos;
- padrao de output para posts.

## 9. Oportunidade do produto

O Raya pode ocupar uma posicao diferente de ferramentas genericas de IA.

Em vez de competir como "mais uma interface para gerar legenda", ele pode se posicionar como:

> Uma esteira inteligente de producao de conteudo.

Ou:

> Um sistema de processos para criar, revisar e aprovar conteudo com consistencia.

Essa posicao e mais defensavel porque pequenas agencias e empresarios nao querem apenas texto. Eles querem um fluxo que reduza caos.

## 10. Jobs to Be Done

### JTBD 1

Quando preciso criar conteudo para uma marca, quero transformar um briefing em um post estruturado, para nao depender de tentativa e erro no ChatGPT.

### JTBD 2

Quando gerencio conteudo para clientes, quero manter regras de marca, tom de voz e estilo visual salvos, para nao recomecar do zero a cada demanda.

### JTBD 3

Quando preciso aprovar conteudo com um cliente, quero enviar um link simples, para evitar mensagens soltas e perda de historico.

### JTBD 4

Quando preciso planejar a producao de conteudo, quero enxergar status e proximas etapas, para saber o que esta em ideia, producao, revisao e aprovado.

### JTBD 5

Quando encontro um estilo visual que funciona, quero transforma-lo em um sistema replicavel, para produzir mais conteudos com consistencia.

## 11. PRD inicial

### Nome do produto

Raya Studio

### Categoria

Sistema de producao de conteudo com IA baseado em processos.

### Visao

Criar uma plataforma que ajude pequenos empresarios e agencias a transformar briefings em conteudos prontos para revisao e aprovacao, mantendo consistencia estrategica, textual e visual.

### Problema

A producao de conteudo organico e fragmentada, lenta e inconsistente. O usuario alterna entre muitas ferramentas, perde contexto, gera retrabalho e depende demais de processos manuais.

### Solucao

Um fluxo guiado por IA que centraliza informacoes da marca, briefing, estrategia, copy, direcao visual, status e aprovacao.

### Publico inicial do MVP

Agencias pequenas, social medias e prestadores de servico que produzem conteudo para Instagram e LinkedIn.

### Principio de produto

O Raya deve sempre orientar o usuario por processo.

Sempre que possivel, a interface deve responder:

- em que etapa estou;
- qual informacao falta;
- qual output sera gerado;
- qual proximo passo.

## 12. Escopo do MVP

O MVP deve ser menor que a visao original, mas mais coerente e funcional.

### Objetivo do MVP

Permitir que um usuario cadastre um cliente, configure regras basicas de marca, envie um briefing e gere um pacote de conteudo pronto para revisao.

### Fluxo principal do MVP

1. Usuario faz login.
2. Usuario cria um projeto/cliente.
3. Usuario preenche o perfil da marca.
4. Usuario cria ou seleciona um template de conteudo.
5. Usuario envia um briefing de post.
6. IA gera:
   - promessa do post;
   - estrutura slide a slide;
   - copy do carrossel;
   - legenda;
   - CTA;
   - direcao visual;
   - checklist de revisao.
7. Usuario ajusta e salva.
8. Usuario envia link de aprovacao.
9. Cliente aprova ou solicita revisao.

## 13. Funcionalidades do MVP

### 1. Projetos / Clientes

Cada projeto representa uma marca ou cliente.

Campos essenciais:

- nome do projeto;
- nome do cliente;
- nicho;
- publico-alvo;
- oferta principal;
- descricao;
- tom de voz;
- regras;
- restricoes;
- formatos prioritarios.

### 2. Sistema de Marca

Permitir registrar as regras basicas que guiam conteudo e design.

Campos:

- cores principais;
- fonte principal;
- estilo visual;
- referencias;
- palavras proibidas;
- palavras preferidas;
- CTAs preferidos;
- padroes de carrossel;
- observacoes.

### 3. Briefing Guiado

Formulario estruturado para criar uma nova demanda de conteudo.

Campos:

- tema;
- objetivo;
- publico;
- promessa;
- canal;
- formato;
- quantidade de slides;
- CTA;
- tom;
- conteudo obrigatorio;
- restricoes;
- observacoes.

### 4. Gerador Processual

Nao deve gerar apenas legenda.

Deve gerar um pacote estruturado:

- diagnostico rapido do briefing;
- angulo recomendado;
- titulo principal;
- estrutura de slides;
- copy de cada slide;
- legenda;
- hashtags opcionais;
- direcao visual;
- variacoes de CTA;
- pontos de revisao.

### 5. Templates

Templates devem ser tratados como processos reutilizaveis.

Exemplos:

- carrossel educativo;
- carrossel checklist;
- carrossel tutorial;
- post de venda indireta;
- post de autoridade;
- estudo de caso;
- storytelling;
- comparativo antes/depois.

### 6. Agentes

Agentes devem ser simplificados no MVP.

Sugestao:

- Agente de Estrategia
- Agente de Copy
- Agente de Design

No MVP, eles podem ser perfis configuraveis, nao necessariamente agentes autonomos complexos.

### 7. Esteira de Conteudo

Status minimos:

- Ideia
- Em producao
- Em revisao
- Aprovado

Status opcionais para depois:

- Agendado
- Publicado

### 8. Aprovacao por link

Funcionalidade importante para agencias.

O cliente deve poder:

- visualizar o conteudo;
- aprovar;
- pedir revisao;
- deixar comentario.

Sem precisar criar conta.

## 14. Fora do escopo do MVP

Para manter foco, deixar fora inicialmente:

- publicacao automatica em redes sociais;
- integracao com Meta Business;
- integracao com ClickUp;
- calendario editorial avancado;
- chat interno complexo;
- multi-provider completo;
- geracao avancada de imagem;
- editor visual completo estilo Canva;
- analytics;
- gestao financeira;
- multi-usuario avancado;
- permissoes por equipe.

Esses itens podem voltar depois que o fluxo principal estiver validado.

## 15. Diferencial do MVP

O diferencial nao e "usar IA".

O diferencial e:

> transformar IA em processo operacional.

Enquanto uma IA generica responde um prompt, o Raya deve conduzir o usuario por uma sequencia inteligente.

## 16. Metricas de sucesso

### Metricas de produto

- tempo medio entre briefing e primeira versao;
- numero de conteudos criados por cliente;
- porcentagem de conteudos aprovados sem revisao;
- quantidade de ajustes por conteudo;
- frequencia de uso semanal;
- numero de templates reutilizados.

### Metricas qualitativas

- usuario sente que economizou tempo;
- usuario percebe consistencia de marca;
- cliente aprova com menos friccao;
- usuario volta para criar o proximo conteudo.

## 17. Roadmap sugerido

### Fase 0 - Estabilizacao tecnica

Objetivo: fazer o projeto rodar.

Tarefas:

- corrigir script `dev` para Windows;
- rodar app localmente;
- corrigir erros TypeScript;
- revisar `.env.example`;
- validar conexao com Postgres self-hosted;
- corrigir encoding dos textos;
- confirmar login e seed de usuario;
- revisar estado do Git.

### Fase 1 - Releitura de produto

Objetivo: alinhar telas e linguagem ao novo posicionamento.

Tarefas:

- revisar menu lateral;
- renomear modulos se necessario;
- criar conceito de "Processos";
- transformar templates em processos reutilizaveis;
- ajustar copy da interface;
- remover complexidade que nao serve ao MVP.

### Fase 2 - MVP operacional

Objetivo: permitir briefing -> conteudo estruturado -> aprovacao.

Tarefas:

- melhorar cadastro de projeto;
- criar perfil de marca;
- criar briefing guiado;
- reescrever endpoint de geracao de conteudo;
- salvar output estruturado;
- exibir estrutura slide a slide;
- criar CTA e direcao visual;
- enviar para aprovacao;
- registrar feedback do cliente.

### Fase 3 - Sistema visual e carrossel

Objetivo: incorporar o guia de estilo de carrossel.

Tarefas:

- criar template global "Carrossel Organico 5 Slides";
- criar template global "Carrossel Organico 6 Slides";
- criar agente de design com o estilo extraido;
- permitir salvar referencias visuais;
- gerar direcao visual por slide;
- futuramente gerar imagens/exportacoes.

### Fase 4 - Calendario e escala

Objetivo: transformar outputs em planejamento recorrente.

Tarefas:

- calendario simplificado;
- criacao em lote;
- status por conteudo;
- filtros por cliente;
- reaproveitamento de conteudos;
- biblioteca de campanhas.

## 18. Recomendacao tecnica inicial

Antes de adicionar novas features, fazer uma limpeza tecnica controlada.

Ordem recomendada:

1. Criar branch nova.
2. Revisar estado do Git.
3. Corrigir `npm run dev`.
4. Corrigir `npm run check`.
5. Isolar ou remover integracoes Replit quebradas.
6. Validar banco.
7. Subir app local.
8. Testar login.
9. Testar criacao de projeto.
10. Testar criacao de conteudo.
11. Testar aprovacao publica.

## 19. Possivel nova estrutura de documentacao

Criar uma pasta `docs` com:

```txt
docs/
  RAYA_STUDIO_RELEITURA_PRD_MVP.md
  PRODUCT_REFRAME.md
  PRD.md
  MVP_SCOPE.md
  TECHNICAL_AUDIT.md
  ROADMAP.md
  CONTENT_PROCESS.md
  CAROUSEL_STYLE_GUIDE.md
```

Este documento atual pode ser dividido depois nesses arquivos menores.

## 20. Decisoes importantes tomadas ate agora

- O produto deve ser relido como sistema de processos, nao apenas gerador de conteudo.
- O MVP deve ser menor e mais solido.
- O foco inicial deve ser briefing -> pacote de conteudo -> revisao/aprovacao.
- Carrosseis devem seguir padrao de 5 a 6 slides.
- O guia visual de carrossel pode virar um template/agente dentro do Raya.
- Integracoes externas devem ficar fora do MVP.
- Primeiro passo tecnico e estabilizar o repositorio.

## 21. Proxima etapa recomendada

Ao abrir o projeto no ambiente de desenvolvimento, a proxima etapa deve ser:

1. Criar uma branch de trabalho.
2. Fazer auditoria tecnica do estado atual.
3. Corrigir ambiente local.
4. Atualizar scripts.
5. Corrigir TypeScript.
6. Rodar o app.
7. Mapear telas que entram no MVP.
8. Comecar a refatoracao pelo fluxo principal.

## 22. Frase-guia do projeto

> O Raya Studio deve ajudar uma pessoa a sair de um briefing solto para um conteudo pronto para aprovacao, com processo, consistencia e velocidade.

Se uma funcionalidade nao melhora esse caminho, ela nao pertence ao MVP.

