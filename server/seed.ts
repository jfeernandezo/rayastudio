import { db } from "./db";
import { projects, contentPieces, templates, knowledgeBase, prompts } from "@shared/schema";
import { sql } from "drizzle-orm";

export async function seedDatabase() {
  const existingProjects = await db.select().from(projects);
  if (existingProjects.length > 0) return;

  const [proj1] = await db.insert(projects).values({
    name: "Vibe Code Agency",
    clientName: "Vibe Code",
    description: "Agência de desenvolvimento com foco em vibe coding e IA aplicada.",
    instructions: "Tom jovem, técnico mas acessível, usar emojis com moderação. Público: devs e empreendedores tech.",
    rules: "Não usar jargão muito técnico. Evitar posts genéricos sem substância.",
    niche: ["tecnologia", "desenvolvimento", "IA", "vibe coding"],
    formats: ["post", "carrossel", "story"],
    brandColors: ["#6B46C1", "#9F7AEA", "#E9D8FD"],
  }).returning();

  const [proj2] = await db.insert(projects).values({
    name: "Studio Criativo BR",
    clientName: "Studio Criativo",
    description: "Estúdio de design e branding para pequenas e médias empresas.",
    instructions: "Tom inspirador, criativo, visual. Mostrar transformação antes/depois.",
    rules: "Sempre mostrar o portfólio. Evitar textos longos no feed.",
    niche: ["design", "branding", "criatividade", "marketing visual"],
    formats: ["post", "carrossel", "reels"],
    brandColors: ["#F6AD55", "#ED8936", "#FFF5EB"],
  }).returning();

  await db.insert(contentPieces).values([
    {
      projectId: proj1.id,
      title: "Como o Vibe Coding está mudando o desenvolvimento",
      platform: "linkedin",
      format: "post",
      status: "approved",
      caption: "O mercado de desenvolvimento mudou. Com o vibe coding, qualquer pessoa com uma boa ideia pode criar produtos digitais reais.\n\nNão se trata de substituir devs — se trata de ampliar quem pode criar.\n\nO que antes levava meses, hoje leva dias.\n\nE sua empresa está pronta para isso?",
      hashtags: "#vibecoding #desenvolvimento #ia #tecnologia #inovacao",
      scheduledDate: "2026-03-05",
    },
    {
      projectId: proj1.id,
      title: "5 ferramentas de IA para produtividade",
      platform: "instagram",
      format: "carrossel",
      status: "review",
      caption: "5 ferramentas de IA que a nossa equipe usa todo dia 🤖\n\nDeslize para ver cada uma →",
      hashtags: "#ia #produtividade #ferramentas #tech #vibecoding",
      scheduledDate: "2026-03-10",
    },
    {
      projectId: proj1.id,
      title: "Case de sucesso: App lançado em 3 dias",
      platform: "instagram",
      format: "post",
      status: "draft",
      notes: "Usar foto do cliente com o produto final",
    },
    {
      projectId: proj2.id,
      title: "Transformação de marca: antes e depois",
      platform: "instagram",
      format: "carrossel",
      status: "published",
      caption: "Uma identidade visual forte transforma o negócio.\n\nVeja o case completo de rebranding que fizemos para @clientexyz 🎨",
      hashtags: "#design #branding #identidadevisual #logodesign #rebrand",
      scheduledDate: "2026-03-01",
    },
  ]);

  await db.insert(templates).values([
    {
      name: "Post de Valor LinkedIn",
      description: "Template para posts educativos no LinkedIn",
      platform: "linkedin",
      format: "post",
      category: "Educativo",
      isGlobal: true,
      captionTemplate: "[AFIRMAÇÃO PROVOCADORA]\n\n[3-5 PONTOS PRINCIPAIS]\n\n[CHAMADA PARA AÇÃO]\n\n[HASHTAGS]",
      promptTemplate: "Crie um post de valor para LinkedIn sobre [TÓPICO]. Use uma afirmação provocadora no início, liste 3-5 pontos concretos e termine com uma pergunta para engajar.",
    },
    {
      name: "Carrossel Instagram",
      description: "Template para carrossel com dicas ou passos",
      platform: "instagram",
      format: "carrossel",
      category: "Educativo",
      isGlobal: true,
      captionTemplate: "[HEADLINE CHAMATIVO] 📲\n\nDeslize para aprender [TÓPICO] →\n\n[RESUMO DO CONTEÚDO]\n\n[HASHTAGS]",
      promptTemplate: "Crie uma legenda para carrossel sobre [TÓPICO]. A primeira frase deve ser um hook poderoso. Inclua contexto do que o usuário vai aprender ao deslizar.",
    },
    {
      name: "Story de Pergunta",
      description: "Template para stories de engajamento",
      platform: "instagram",
      format: "story",
      category: "Engajamento",
      isGlobal: true,
      captionTemplate: "[PERGUNTA DIRETA PARA O PÚBLICO]\n\nConta pra gente! 👇",
      promptTemplate: "Crie uma pergunta engajadora para story sobre [TÓPICO] que incentive os seguidores a responder.",
    },
    {
      name: "Post de Venda Sutil",
      description: "Template para posts que vendem sem parecer forçado",
      platform: "instagram",
      format: "post",
      category: "Venda",
      isGlobal: true,
      captionTemplate: "[HISTÓRIA OU PROBLEMA DO CLIENTE]\n\n[COMO VOCÊ RESOLVEU]\n\n[RESULTADO CONCRETO]\n\n👉 [CTA]\n\n[HASHTAGS]",
      promptTemplate: "Crie um post que conta a história de como [PRODUTO/SERVIÇO] resolveu o problema de [CLIENTE TIPO]. Foque no resultado e na transformação, não no produto.",
    },
  ]);

  await db.insert(knowledgeBase).values([
    {
      projectId: proj1.id,
      title: "Público-Alvo Principal",
      content: "Desenvolvedores juniores e mid-level (25-35 anos), empreendedores tech, pessoas interessadas em IA e automação. Buscam produtividade e inovação. Estão no LinkedIn e Instagram. Consomem conteúdo técnico mas querem aplicação prática.",
      category: "Público-Alvo",
      tags: ["devs", "empreendedores", "tech"],
    },
    {
      projectId: proj1.id,
      title: "Principais Serviços",
      content: "Desenvolvimento de apps com vibe coding, consultoria em IA, automações com Make e n8n, criação de MVPs em tempo acelerado. Diferencial: entrega 5x mais rápida que métodos tradicionais.",
      category: "Produto/Serviço",
      tags: ["serviços", "diferencial"],
    },
    {
      title: "Dicas Gerais de Copywriting",
      content: "1. Comece sempre com um hook forte. 2. Use números e dados concretos. 3. Termine com uma pergunta ou CTA claro. 4. Parágrafos curtos aumentam a leitura. 5. Emojis com moderação chamam atenção sem poluir.",
      category: "Referências",
      tags: ["copywriting", "dicas"],
    },
    {
      title: "Formatos que mais performam 2025",
      content: "Instagram: Carrosséis educativos (maior salvamento), Reels com dica rápida (maior alcance). LinkedIn: Posts com lista numerada (maior engajamento), posts pessoais com aprendizados (maior viralização).",
      category: "Referências",
      tags: ["formatos", "performance", "2025"],
    },
  ]);

  await db.insert(prompts).values([
    {
      name: "Hook Poderoso",
      content: "Crie um hook de 1-2 linhas que faça o leitor parar o scroll. Use uma estatística surpreendente, uma pergunta provocadora ou uma afirmação controversa relacionada ao tópico.",
      category: "Engajamento",
    },
    {
      name: "CTA de Engajamento",
      content: "Crie uma chamada para ação que incentive comentários. Faça uma pergunta específica relacionada ao conteúdo, não genérica como 'O que você acha?'",
      category: "Engajamento",
    },
    {
      name: "Tom Informal e Próximo",
      content: "Reescreva este texto com tom mais informal, como se estivesse conversando com um amigo. Use linguagem do dia a dia, evite termos corporativos, pode usar contrações e expressões populares.",
      category: "Tom de Voz",
    },
    {
      name: "Storytelling com Transformação",
      content: "Estruture o conteúdo como uma história de transformação: mostre o problema inicial, o processo de mudança e o resultado final. Use detalhes específicos para tornar real.",
      category: "Storytelling",
    },
    {
      name: "Lista com Emojis",
      content: "Transforme este conteúdo em uma lista com 5-7 itens, cada um começando com um emoji relevante. Seja conciso e direto em cada ponto.",
      category: "Formato",
    },
    {
      name: "Post de LinkedIn Profissional",
      content: "Adapte este conteúdo para o LinkedIn: tom mais profissional mas ainda humano, foque em insights e aprendizados, adicione contexto profissional ou de carreira. Termine com uma pergunta para a rede.",
      category: "Plataforma",
      platform: "linkedin",
    },
    {
      name: "Legenda Curta para Story",
      content: "Crie uma legenda ultra-curta (máximo 15 palavras) para story. Deve ser impactante, clara e incentivar uma ação simples.",
      category: "Plataforma",
      platform: "instagram",
      format: "story",
    },
    {
      name: "Post de Venda Autêntica",
      content: "Transforme este conteúdo em um post de venda que não pareça forçado. Use a estrutura: problema do cliente → solução → resultado concreto → como obter. Foque 80% no problema e resultado, 20% na venda.",
      category: "Venda",
    },
  ]);

  console.log("Database seeded successfully!");
}
