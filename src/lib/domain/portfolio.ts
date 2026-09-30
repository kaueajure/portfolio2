export const projects = [
  {
    name: "Alonso",
    slug: "alonso",
    category: "Produto · Imobiliário",
    statement:
      "Presença digital da Alonso Negócios Imobiliários para busca, contato e administração do catálogo.",
    description:
      "Site público com pesquisa e contatos contextuais, além de área administrativa com autenticação, sessão, cadastro de imóveis, mídias e painel operacional sobre MySQL.",
    stack: ["Next.js", "React", "TypeScript", "MySQL", "Zod", "Vitest"],
    nodes: ["Catálogo", "Busca", "Favoritos", "Contato", "Admin"],
    kind: "catalog",
  },
  {
    name: "Gestifique",
    slug: "gestifique",
    category: "SaaS · Atendimento",
    statement:
      "Chamados, clientes, SLA e canais de atendimento na mesma aplicação.",
    description:
      "Portal do cliente, base de conhecimento, perfis, relatórios, e-mail e WhatsApp, Socket.IO e worker para tarefas em background.",
    stack: [
      "React",
      "TypeScript",
      "Node.js",
      "Express",
      "MySQL",
      "Redis",
      "Socket.IO",
    ],
    nodes: [
      "E-mail",
      "Portal",
      "WhatsApp",
      "SLA",
      "Automação",
      "Worker",
      "Relatório",
    ],
    kind: "flow",
  },
  {
    name: "Flixa",
    slug: "flixa",
    category: "Produto · Entretenimento",
    statement:
      "Catálogo, biblioteca, amigos, fóruns e esportes em uma plataforma.",
    description:
      "Autenticação, perfis, presença em tempo real, Drizzle e testes de navegação, reprodução e recursos sociais.",
    stack: [
      "Next.js",
      "React",
      "TypeScript",
      "Drizzle",
      "MySQL",
      "Ably",
      "Cloudflare",
    ],
    nodes: ["Catálogo", "Biblioteca", "Amigos", "Esportes", "Fóruns"],
    kind: "orbit",
  },
  {
    name: "Portal Meta",
    slug: "portalmeta",
    category: "Sistema · Operação",
    statement: "Demandas, agenda, chamados e obrigações por município.",
    description:
      "Usuários e permissões, indicadores, auditoria, WhatsApp, tempo real e worker em background.",
    stack: [
      "React",
      "TypeScript",
      "Node.js",
      "Express",
      "MySQL",
      "Redis",
      "Socket.IO",
    ],
    nodes: [
      "Demandas",
      "Agenda",
      "SLA",
      "Logs",
      "Municípios",
      "Usuários",
      "Relatórios",
    ],
    kind: "operations",
  },
];
export const stack = [
  {
    name: "Interface",
    path: "app/",
    tools: ["React", "Next.js", "TypeScript", "Tailwind", "Vite"],
  },
  {
    name: "Aplicação",
    path: "services/",
    tools: ["Node.js", "Express", "REST", "Socket.IO", "Workers"],
  },
  {
    name: "Dados",
    path: "db/",
    tools: ["MySQL", "MariaDB", "Drizzle", "Redis"],
  },
  {
    name: "Operação",
    path: "infra/",
    tools: ["Linux", "Git", "Cloudflare", "JWT", "Testes"],
  },
];
