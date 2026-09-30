export type ProjectImage = {
  src: string;
  alt: string;
  caption: string;
  width: number;
  height: number;
};
export type Project = {
  slug: string;
  name: string;
  category: string;
  statement: string;
  description: string;
  audience: string;
  problem: string;
  role: string;
  scope: string;
  status: string;
  caseStudyHref: string;
  repositoryHref?: string;
  liveHref?: string;
  images: ProjectImage[];
  stack: string[];
  decisions: { title: string; description: string; evidence?: string }[];
  architecture: { name: string; responsibility: string }[];
  validation: string;
  limitations: string;
  evidenceLabel: string;
};

export const projects: Project[] = [
  {
    slug: "gestifique",
    name: "Gestifique",
    category: "SaaS de atendimento",
    statement: "Cada chamado, com contexto.",
    description:
      "Uma central para organizar filas, acompanhar prazos e conectar a equipe de suporte ao cliente.",
    audience: "Equipes de suporte e seus clientes",
    problem:
      "Um atendimento envolve mais que uma mensagem: tem responsável, prioridade, prazo, histórico e diferentes canais de entrada.",
    role: "Desenvolvimento full-stack",
    scope:
      "Interface de atendimento, portal do cliente, API, permissões, persistência e processamento em background.",
    status: "Código público",
    caseStudyHref: "/projetos/gestifique",
    repositoryHref: "https://github.com/kaueajure/gestifique",
    images: [
      {
        src: "/projects/gestifique-kanban.png",
        width: 1440,
        height: 1000,
        alt: "Gestifique: central de chamados em Kanban, com filas por responsável e colunas de status.",
        caption:
          "Central de chamados · visão Kanban. Captura de validação do projeto.",
      },
      {
        src: "/projects/gestifique-lista.png",
        width: 1440,
        height: 1000,
        alt: "Lista de chamados do Gestifique com situação, prioridade, SLA e responsável.",
        caption:
          "O mesmo atendimento, em lista: situação, prioridade e prazo no mesmo contexto.",
      },
      {
        src: "/projects/gestifique-portal.png",
        width: 1424,
        height: 905,
        alt: "Portal do cliente do Gestifique com um chamado de QA e sua situação.",
        caption: "Portal do cliente · acompanhamento de um chamado de teste.",
      },
    ],
    stack: [
      "React",
      "TypeScript",
      "Node.js",
      "Express",
      "MySQL",
      "Socket.IO",
      "Redis",
    ],
    decisions: [
      {
        title: "Uma fila, duas formas de acompanhar",
        description:
          "Lista e Kanban apresentam os chamados com status, responsável e SLA. O portal oferece ao cliente uma experiência própria para abrir e acompanhar solicitações.",
        evidence:
          "https://github.com/kaueajure/gestifique/tree/main/src/components",
      },
      {
        title: "Permissão não é só esconder um botão",
        description:
          "O projeto distingue o escopo da empresa das permissões globais. Os testes verificam, por exemplo, que um administrador de empresa não recebe automaticamente acesso global.",
        evidence:
          "https://github.com/kaueajure/gestifique/blob/main/tests/permissions.test.ts",
      },
      {
        title: "O atendimento não precisa esperar pelo worker",
        description:
          "A execução web pode ser separada dos jobs e listeners. O runbook define os papéis de cada processo, configuração de produção, migrações e rollback.",
        evidence:
          "https://github.com/kaueajure/gestifique/blob/main/docs/PRODUCTION_RUNBOOK.md",
      },
    ],
    architecture: [
      {
        name: "Equipe e cliente",
        responsibility:
          "Central React e portal com fluxos de atendimento distintos.",
      },
      {
        name: "API e permissões",
        responsibility: "Express organiza as regras e o acesso aos recursos.",
      },
      {
        name: "Persistência",
        responsibility: "MySQL / MariaDB armazena os dados do atendimento.",
      },
      {
        name: "Em paralelo",
        responsibility:
          "Socket.IO entrega atualizações; um processo worker pode executar jobs e listeners separadamente da web.",
      },
    ],
    validation:
      "O repositório inclui testes de permissões, endurecimento de produção e fluxos end-to-end, além das capturas de validação apresentadas neste case.",
    limitations:
      "As capturas documentam uma versão de validação, não o volume de uma operação em produção. Não há métricas públicas de adoção ou desempenho neste case.",
    evidenceLabel: "Permissões, testes e runbook de produção",
  },
  {
    slug: "alonso",
    name: "Alonso",
    category: "Produto imobiliário",
    statement: "Da busca ao catálogo publicado.",
    description:
      "Busca e contato no site público. Cadastro de imóveis, mídias e organização do catálogo na administração.",
    audience: "Pessoas buscando imóveis e equipe imobiliária",
    problem:
      "A experiência pública de busca precisa refletir um catálogo que a equipe consegue cadastrar, revisar e manter.",
    role: "Desenvolvimento full-stack",
    scope:
      "Site público, busca, favoritos, contatos e área administrativa com sessão, catálogo e mídias.",
    status: "Repositório não publicado",
    caseStudyHref: "/projetos/alonso",
    images: [
      {
        src: "/projects/alonso-admin.png",
        width: 1440,
        height: 1659,
        alt: "Tela real da administração Alonso para adicionar imóvel, com dados principais, detalhes e upload de mídia.",
        caption:
          "Administração Alonso · cadastro de imóvel em versão local de revisão.",
      },
    ],
    stack: ["Next.js", "React", "TypeScript", "MySQL", "Zod", "Vitest"],
    decisions: [
      {
        title: "Catálogo desacoplado da apresentação",
        description:
          "A interface acessa um provedor de imóveis. A implementação distingue o provedor de banco de uma resposta vazia quando o banco não está configurado.",
      },
      {
        title: "Publicação com administração própria",
        description:
          "O projeto possui repositórios para imóveis, lançamentos e leads, além de validação de formulários e processamento de mídias.",
      },
      {
        title: "Contato sem criar uma conta",
        description:
          "O site permite iniciar contato sem cadastro; a conta é usada para manter os imóveis favoritos salvos.",
      },
    ],
    architecture: [
      {
        name: "Busca pública",
        responsibility: "Páginas Next.js consultam o provedor de imóveis.",
      },
      {
        name: "Catálogo",
        responsibility:
          "Repositórios de imóveis e lançamentos conectam a aplicação ao MySQL.",
      },
      {
        name: "Administração",
        responsibility:
          "Sessão, validação e processamento de mídias sustentam a manutenção dos anúncios.",
      },
    ],
    validation:
      "O código local inclui testes de validação de imóveis, processamento de formulário, armazenamento de mídias e configuração da empresa.",
    limitations:
      "O repositório não está disponível publicamente. A captura de revisão mostra o formulário de cadastro, sem dados de imóveis publicados.",
    evidenceLabel: "Catálogo, publicação e validação de mídias",
  },
  {
    slug: "portalmeta",
    name: "Portal Meta",
    category: "Sistema de operação",
    statement: "Demandas com contexto municipal.",
    description:
      "Chamados, agenda e obrigações organizados por município, com permissões e acompanhamento da operação.",
    audience: "Equipes que acompanham demandas e obrigações municipais",
    problem:
      "Chamados e prazos precisam ser acompanhados junto do município e das responsabilidades de acesso, sem perder o histórico da operação.",
    role: "Desenvolvimento full-stack",
    scope:
      "Aplicação web, API, permissões, agenda, obrigações, auditoria e tarefas em background.",
    status: "Código público",
    caseStudyHref: "/projetos/portalmeta",
    repositoryHref: "https://github.com/kaueajure/portalmeta",
    images: [],
    stack: ["React", "TypeScript", "Express", "MySQL", "Socket.IO", "Redis"],
    decisions: [
      {
        title: "Município como contexto de acompanhamento",
        description:
          "Planilha, indicadores e acompanhamento por município fazem parte do módulo de obrigações, junto dos chamados e da agenda.",
        evidence: "https://github.com/kaueajure/portalmeta/blob/main/README.md",
      },
      {
        title: "Acesso tratado como parte do domínio",
        description:
          "O modelo de acesso às obrigações tem documentação própria e testes específicos, em vez de depender apenas da organização das telas.",
        evidence:
          "https://github.com/kaueajure/portalmeta/blob/main/docs/OBLIGATIONS_ACCESS_MODEL.md",
      },
      {
        title: "Execução web e jobs separáveis",
        description:
          "A aplicação oferece uma entrada de worker e documentação de produção, permitindo separar os processos responsáveis por requisições e tarefas em background.",
        evidence:
          "https://github.com/kaueajure/portalmeta/blob/main/docs/PRODUCTION_RUNBOOK.md",
      },
    ],
    architecture: [
      {
        name: "Operação",
        responsibility:
          "Chamados, agenda e módulos de obrigações na interface React.",
      },
      {
        name: "Regras de acesso",
        responsibility:
          "A API aplica o modelo de permissões e organiza a persistência.",
      },
      {
        name: "Continuidade",
        responsibility:
          "MySQL, atualizações Socket.IO e worker apoiam o acompanhamento das demandas.",
      },
    ],
    validation:
      "Há testes versionados para permissões e fluxos de obrigações, além de documentação do modelo de acesso e da implantação.",
    limitations:
      "Este case apresenta o escopo e as decisões documentadas. Não publica dados municipais, métricas de adoção ou resultados operacionais.",
    evidenceLabel: "Modelo de acesso e testes de obrigações",
  },
  {
    slug: "flixa",
    name: "Flixa",
    category: "Produto de entretenimento",
    statement: "Uma biblioteca que também conecta.",
    description:
      "Catálogo, biblioteca pessoal, perfis e recursos sociais reunidos em uma experiência de descoberta.",
    audience: "Pessoas organizando sua experiência de entretenimento",
    problem:
      "Descobrir conteúdo, manter uma biblioteca e compartilhar recomendações são fluxos diferentes que precisam conviver na mesma aplicação.",
    role: "Desenvolvimento full-stack",
    scope:
      "Catálogo, autenticação, perfis, biblioteca, recomendações e presença em tempo real.",
    status: "Código público",
    caseStudyHref: "/projetos/flixa",
    repositoryHref: "https://github.com/kaueajure/flixa",
    images: [],
    stack: [
      "React",
      "TypeScript",
      "Next.js / Vinext",
      "Drizzle",
      "MySQL",
      "Ably",
    ],
    decisions: [
      {
        title: "Biblioteca e descoberta com fluxos próprios",
        description:
          "O código separa as interfaces de biblioteca, amigos, esportes e retrospectiva, preservando responsabilidades de cada experiência.",
        evidence: "https://github.com/kaueajure/flixa/tree/main/app",
      },
      {
        title: "Presença além do estado da tela",
        description:
          "A aplicação possui rotas de autenticação e presença, além de integração com Ably para os recursos em tempo real.",
        evidence: "https://github.com/kaueajure/flixa/tree/main/app/api",
      },
      {
        title: "Validação de comportamentos",
        description:
          "Os testes versionados cobrem navegação, autenticação, presença, recomendações e eventos de reprodução.",
        evidence: "https://github.com/kaueajure/flixa/tree/main/tests",
      },
    ],
    architecture: [
      {
        name: "Experiência",
        responsibility: "Catálogo, biblioteca e perfis em React.",
      },
      {
        name: "Aplicação e dados",
        responsibility:
          "Rotas de API, Drizzle e MySQL para os recursos persistidos.",
      },
      {
        name: "Presença",
        responsibility:
          "Integração em tempo real separada da renderização dos conteúdos.",
      },
    ],
    validation:
      "O projeto contém testes de navegação, contas, presença e recomendações. A existência dessas suítes não é uma afirmação sobre sua execução em produção.",
    limitations:
      "O catálogo depende de fontes externas. Este case não apresenta métricas de público nem resultados comerciais.",
    evidenceLabel: "Navegação, presença e testes de interface",
  },
];

export const stack = [
  {
    name: "Interface",
    responsibility: "Filas e estados de atendimento legíveis.",
    tools: "React · TypeScript",
    evidence: "Gestifique",
    href: "/projetos/gestifique",
  },
  {
    name: "Aplicação",
    responsibility: "Regras de acesso contextualizadas por operação.",
    tools: "Node.js · Express",
    evidence: "Portal Meta",
    href: "/projetos/portalmeta#decisoes",
  },
  {
    name: "Dados",
    responsibility: "Um catálogo conectado à publicação.",
    tools: "MySQL · repositórios",
    evidence: "Alonso",
    href: "/projetos/alonso#decisoes",
  },
  {
    name: "Operação",
    responsibility: "Processos web e tarefas de background separados.",
    tools: "Worker · Redis",
    evidence: "Gestifique",
    href: "/projetos/gestifique#decisoes",
  },
];
