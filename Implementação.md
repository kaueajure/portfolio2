Você é um engenheiro de software sênior especializado em Next.js, React, TypeScript, arquitetura full-stack, motion design, GSAP, UX/UI, segurança, bancos MySQL e migração de sistemas legados.

Sua tarefa é reconstruir e migrar integralmente o seguinte projeto para Next.js:

REPOSITÓRIO ATUAL:
https://github.com/kaueajure/portfolio

REFERÊNCIA VISUAL E DE MOVIMENTO:
https://dixor-react.vercel.app/

O objetivo NÃO é simplesmente criar uma nova landing page.

O repositório atual contém um portfólio público e também um sistema administrativo completo. A nova implementação deve preservar todo o conteúdo, regras de negócio, funcionalidades, banco, fluxos administrativos e comportamentos importantes já existentes, ao mesmo tempo em que substitui a implementação HTML/CSS/JavaScript/PHP atual por uma arquitetura moderna em Next.js.

A nova interface deve preservar a identidade visual de Kauê Ajure, porém evoluir significativamente a experiência, principalmente na primeira impressão e nas animações durante o scroll.

# REGRA MAIS IMPORTANTE: ANALISE O REPOSITÓRIO ANTES DE PROGRAMAR

Antes de alterar qualquer arquivo, faça uma auditoria completa do repositório.

Não comece recriando a interface baseado apenas neste prompt.

Leia integralmente todos os arquivos próprios do projeto, incluindo:

- HTML;
- CSS;
- JavaScript;
- PHP;
- SQL;
- configuração;
- autenticação;
- APIs;
- regras de negócio;
- uploads;
- ferramentas PDF;
- proposta pública;
- painel administrativo;
- assets;
- documentação de segurança.

Não é necessário estudar linha por linha das bibliotecas de terceiros dentro de `vendor/`, mas identifique quais dependências são utilizadas e para que servem.

Considere o repositório existente como a principal fonte de verdade para comportamento funcional e conteúdo.

Caso haja alguma divergência entre este prompt e a implementação atual, preserve primeiro as regras de negócio comprovadas pelo código atual, exceto quando este prompt estiver explicitamente pedindo uma alteração.

Se o repositório estiver privado e você não tiver acesso aos arquivos, não invente sua estrutura. Solicite acesso ao repositório ou os arquivos necessários.

# OBJETIVO DO PROJETO

Transformar o projeto atual em uma aplicação full-stack moderna baseada em:

- Next.js com App Router;
- React;
- TypeScript;
- arquitetura modular;
- Server Components sempre que forem adequados;
- Client Components somente onde houver interação ou animação;
- MySQL;
- validação server-side;
- sistema de autenticação seguro;
- animações avançadas;
- design responsivo;
- acessibilidade;
- SEO;
- boa performance.

Utilize a versão estável e corrigida mais recente do Next.js disponível no momento da implementação. Não fixe uma versão de patch antiga simplesmente porque ela é mencionada em documentação ou exemplos.

A aplicação final não deve depender de PHP para funcionar.

O PHP existente deve servir como referência funcional durante a migração.

# PRINCÍPIO DE MIGRAÇÃO

Não faça uma simples tradução:

HTML → JSX  
PHP → Route Handler  
CSS → Tailwind

Primeiro compreenda o produto.

Depois reconstrua a arquitetura de maneira apropriada para Next.js.

Entretanto, não altere arbitrariamente regras de negócio existentes.

As informações e funcionalidades atuais precisam continuar funcionando.

# IDENTIDADE VISUAL EXISTENTE

Preserve a identidade atual como base.

O projeto atualmente utiliza aproximadamente:

- fundo principal: `#eef1f3`;
- fundo secundário: `#e6eaed`;
- superfícies: `#f8fafb`;
- texto principal: `#15181c`;
- texto secundário: `#5f6770`;
- azul principal: `#4a7fa3`;
- azul profundo: `#376687`;
- azul claro: `#6b9fc0`;
- fundo escuro: `#171a1e`.

Tipografia atual:

- títulos/display: Syne;
- texto: Figtree;
- código/labels técnicos: JetBrains Mono.

Assets de identidade existentes:

- `logo-preta.png`;
- `logo-branca.png`;
- favicon;
- apple touch icon.

Preserve essa identidade.

Utilize preferencialmente `next/font` para carregar as fontes.

Não transforme o portfólio em uma cópia visual do Dixor.

# COMO UTILIZAR O DIXOR

O site:

https://dixor-react.vercel.app/

deve ser estudado como referência de:

- ritmo entre seções;
- motion design;
- elementos grandes;
- contraste entre áreas claras e escuras;
- composição editorial;
- transições;
- scroll storytelling;
- entradas e saídas de elementos;
- sobreposição de camadas;
- tipografia de grande escala;
- tratamento de portfólio;
- sensação de movimento contínuo;
- microinterações;
- uso de GSAP.

NÃO copiar:

- código;
- assets;
- imagens;
- textos;
- composição exata;
- grid exato;
- sequência exata das seções;
- identidade;
- cores;
- componentes;
- layout pixel a pixel.

O resultado deve parecer um projeto original de Kauê Ajure inspirado pela qualidade de motion design do Dixor, e não uma skin do template.

# CONCEITO VISUAL PRINCIPAL

A experiência precisa comunicar imediatamente:

"desenvolvedor full-stack que cria sistemas reais".

Não quero o clichê genérico de portfólio de desenvolvedor com:

- fundo preto;
- texto verde Matrix;
- chuva de caracteres aleatórios;
- ícones genéricos de programação espalhados;
- excesso de neon;
- estética de "hacker";
- terminal falso sem função visual;
- dezenas de efeitos que não contam nenhuma história.

Os elementos técnicos devem ter relação direta com desenvolvimento de software, arquitetura e com minha própria stack.

Utilize elementos como:

- terminal;
- editor de código;
- árvore de arquivos;
- requests de API;
- banco;
- estruturas JSON;
- commits;
- branch;
- build;
- deploy;
- logs;
- workers;
- eventos em tempo real;
- componentes;
- rotas;
- queries;
- TypeScript;
- Next.js;
- React;
- Node;
- MySQL;
- Redis;
- Socket.IO;
- Linux.

Esses elementos devem fazer parte da narrativa visual.

# PRIMEIRA IMPRESSÃO — EXPERIÊNCIA PRINCIPAL

Essa é uma das partes mais importantes do projeto.

A abertura deve ser muito mais marcante que a atual.

Quero uma experiência de scroll intuitiva, interativa e visualmente rica.

Crie uma seção inicial cinematográfica e scroll-driven.

Não crie um loader falso que obrigue o visitante a esperar.

O conteúdo deve estar utilizável imediatamente.

## Estado inicial

Ao abrir o site, apresentar uma composição fullscreen.

O ambiente deve lembrar a área de trabalho de um desenvolvedor, mas de maneira abstrata e refinada.

Possíveis elementos simultâneos:

- linhas discretas de grid;
- coordenadas;
- terminal parcial;
- file tree;
- pequenos blocos de código;
- indicadores de branch;
- cursor piscando;
- logs;
- pequenos status;
- números;
- elementos representando API, banco e deploy;
- partículas geométricas extremamente sutis;
- logo;
- nome "Kauê Ajure".

Não colocar tudo com o mesmo peso visual.

Deve existir hierarquia clara.

## Storytelling pelo primeiro scroll

A primeira sequência pode ocupar aproximadamente 250–320vh em desktop e utilizar uma área visual pinned durante parte do percurso.

Ela deve responder progressivamente ao scroll.

Exemplo conceitual:

### Fase 1 — inicialização

Mostrar fragmentos de uma aplicação sendo inicializada.

Exemplos conceituais:

`portfolio/`
`src/`
`app/`
`components/`
`services/`
`db/`

Pequenos logs podem aparecer:

`initializing interface`
`loading projects`
`connecting experience`
`motion ready`

Não precisa usar exatamente esses textos.

### Fase 2 — código

Durante o scroll:

- determinadas linhas ficam ativas;
- outras desaparecem;
- componentes se reorganizam;
- elementos de terminal atravessam a composição;
- blocos técnicos começam a convergir.

O código deve parecer real e legível.

Não gere código absurdo apenas para preencher espaço.

### Fase 3 — arquitetura

Transforme visualmente código em conceitos do meu trabalho:

Interface → API → Banco → Worker → Deploy.

Podem existir conexões animadas entre essas camadas.

### Fase 4 — compilação visual

Os elementos técnicos começam a formar a interface definitiva.

Por exemplo:

fragmentos de código → linhas → cards → tipografia → hero.

A sensação deve ser de que o visitante acabou de ver a interface "ser construída".

### Fase 5 — hero definitivo

A sequência termina revelando claramente:

Kauê Ajure

Sistemas de gestão e produtos SaaS — da interface ao banco e ao deploy.

Com CTAs equivalentes a:

- Ver projetos;
- Falar comigo.

Também exibir, de maneira integrada:

- Desenvolvedor Full Stack;
- disponível para projetos;
- foco em SaaS, gestão e operação;
- React / Next.js / TypeScript;
- Node.js / MySQL / tempo real;
- API / workers / Linux / deploy.

Ao terminar a sequência, o elemento pinned deve ser liberado naturalmente e o usuário continua navegando pelo restante do site.

# SCROLL

O scroll deve parecer fluido, mas não ser sequestrado.

Não implemente navegação que force cada movimento do mouse para uma tela específica.

O usuário precisa continuar sentindo que está navegando uma página web normal.

Pode utilizar:

- GSAP;
- ScrollTrigger;
- scrub;
- pin;
- timelines;
- Lenis, se realmente agregar valor.

Integre corretamente Lenis e ScrollTrigger caso ambos sejam utilizados.

Garanta cleanup das timelines ao desmontar componentes.

Não anime diretamente o elemento que está sendo usado como pin quando isso comprometer os cálculos do ScrollTrigger; utilize elementos internos.

# ANIMAÇÕES

Utilize movimento como parte da arquitetura visual, e não decoração arbitrária.

Tipos desejados:

- split text;
- máscaras;
- clip-path;
- elementos revelados pelo scroll;
- parallax leve;
- transições de escala;
- números;
- linhas;
- grids;
- elementos que atravessam seções;
- pequenos elementos sticky;
- scrub;
- cards que mudam de profundidade;
- texto horizontal;
- transformação de layouts;
- indicadores de progresso;
- microinterações magnéticas;
- hover de projetos;
- cursor contextual apenas em desktop, se realmente agregar valor.

Prefira animar:

- transform;
- opacity;
- clip-path quando apropriado.

Evite animar propriedades que provoquem reflow contínuo.

Utilize `will-change` somente nos elementos realmente necessários.

# PERFORMANCE DA EXPERIÊNCIA ANIMADA

"Cheio de coisa" não significa DOM gigantesco.

Não crie centenas de spans continuamente animados.

Caso seja necessário criar partículas, linhas ou elementos ambientais numerosos, considere Canvas.

Carregue experiências pesadas sob demanda.

Não permita que as animações comprometam:

- LCP;
- INP;
- CLS;
- navegação mobile;
- consumo exagerado de CPU;
- duração de bateria.

Em dispositivos fracos, reduza automaticamente a complexidade quando apropriado.

# ACESSIBILIDADE DE MOVIMENTO

Respeite:

`prefers-reduced-motion: reduce`

Nesse modo:

- não utilizar longos trechos pinned;
- não utilizar parallax forte;
- remover animações desnecessárias;
- revelar imediatamente o conteúdo importante;
- preservar toda a informação da experiência.

Não esconder conteúdo essencial atrás de animações.

# ÁUDIO

Quero sons relacionados à experiência.

Entretanto, NÃO tente tocar áudio automaticamente ao carregar a página.

Os navegadores podem bloquear isso e som inesperado prejudica a experiência.

Crie um controle visual claro:

`SOUND OFF`
ou equivalente.

O padrão deve ser sem som.

Depois que o usuário ativar explicitamente o áudio, habilite a experiência sonora.

Salve a preferência localmente.

A interface deve continuar 100% funcional sem áudio.

## Sound design

A experiência sonora deve lembrar software/desenvolvimento.

Pode incluir sons discretos para:

- inicialização;
- terminal;
- digitação;
- mudança importante de estágio;
- compile/build concluído;
- abertura de projeto;
- clique importante;
- transição.

Não tocar som em cada pixel do scroll.

Não tocar som em cada hover.

Não criar cacofonia.

Os sons devem ser muito baixos e curtos.

Considere implementar o sound design proceduralmente com Web Audio API para reduzir dependência de arquivos externos.

Exemplos:

- pequenos blips;
- transient clicks;
- ruído filtrado curto;
- sweep discreto;
- confirmação tonal.

Centralize isso em um `AudioEngine` ou estrutura equivalente.

O engine deve possuir:

- `enable`;
- `disable`;
- `toggle`;
- controle global de volume;
- rate limiting;
- cleanup;
- pausa quando a página ficar oculta;
- persistência da preferência.

# HEADER

Manter conceito funcional do header atual, porém redesenhá-lo dentro da nova linguagem.

Links principais:

- Sobre;
- Projetos;
- Stack;
- GitHub;
- Contato.

Preservar:

- marca;
- navegação por âncoras;
- estado ativo da seção;
- menu mobile;
- acessibilidade;
- header reativo ao scroll.

Pode esconder parcialmente o header quando o usuário desce e reaparecer quando sobe, desde que a navegação continue previsível.

Adicionar acesso ao controle de som de maneira discreta.

# SOBRE

Preservar o conteúdo e a mensagem atualmente existentes.

A seção comunica:

"Desenvolvo a interface e o que acontece por trás dela."

Texto atual descreve atuação em:

- chamados;
- demandas;
- prazos;
- usuários;
- informações;
- React;
- TypeScript;
- Node.js;
- autenticação;
- permissões;
- APIs;
- banco;
- tempo real;
- workers;
- Linux.

As quatro camadas conceituais atuais devem continuar representadas:

Experiência  
React · Next.js

Aplicação  
Node.js · APIs

Dados  
MySQL · Drizzle

Operação  
Workers · Linux

Você pode redesenhar completamente a apresentação, mas não remover essas informações.

Considere transformar essa seção em uma arquitetura visual vertical ou horizontal na qual cada camada se conecta à próxima.

# PROJETOS

Preservar os quatro projetos atuais e suas informações.

## Alonso

Categoria:
Produto · Imobiliário

Descrição principal:
Presença digital da Alonso Negócios Imobiliários para busca, contato e administração do catálogo.

Descrição detalhada:
Site público com pesquisa e contatos contextuais, além de área administrativa com autenticação, sessão, cadastro de imóveis, mídias e painel operacional sobre MySQL.

Stack atual exibida:

- Next.js;
- React;
- TypeScript;
- MySQL;
- Zod;
- Vitest.

## Gestifique

Categoria:
SaaS · Atendimento

Descrição:
Chamados, clientes, SLA e canais de atendimento na mesma aplicação.

Funcionalidades mencionadas:

- portal do cliente;
- base de conhecimento;
- perfis;
- relatórios;
- e-mail;
- WhatsApp;
- Socket.IO;
- worker.

Tecnologias:

- React;
- TypeScript;
- Node.js;
- Express;
- MySQL;
- Redis;
- Socket.IO.

## Flixa

Categoria:
Produto · Entretenimento

Descrição:
Catálogo, biblioteca, amigos, fóruns e esportes em uma plataforma.

Características:

- autenticação;
- perfis;
- presença em tempo real;
- Drizzle;
- testes de navegação;
- reprodução;
- recursos sociais.

Stack:

- Next.js;
- React;
- TypeScript;
- Drizzle;
- MySQL;
- Ably;
- Cloudflare.

## Portal Meta

Categoria:
Sistema · Operação

Descrição:
Demandas, agenda, chamados e obrigações por município.

Características:

- usuários;
- permissões;
- indicadores;
- auditoria;
- WhatsApp;
- tempo real;
- worker.

Stack:

- React;
- TypeScript;
- Node.js;
- Express;
- MySQL;
- Redis;
- Socket.IO.

## Nova apresentação dos projetos

Não utilize quatro cards genéricos idênticos.

Cada projeto deve possuir uma pequena representação visual de seu próprio sistema.

Por exemplo:

Alonso:
catálogo → busca → favoritos → contato → admin.

Gestifique:
e-mail / portal / WhatsApp → SLA → automação / worker / relatório.

Flixa:
catálogo → biblioteca → amigos → esportes → fóruns.

Portal Meta:
demandas → agenda → SLA → logs → municípios → usuários → relatórios.

Esses diagramas podem reagir ao hover e ao scroll.

Os projetos podem alternar composição esquerda/direita.

Utilize imagens reais dos projetos somente se estiverem disponíveis no repositório ou se forem fornecidas posteriormente.

Não invente screenshots.

# STACK

Preservar as categorias atuais.

## Interface

React  
Next.js  
TypeScript  
Tailwind  
Vite

## Aplicação

Node.js  
Express  
REST  
Socket.IO  
Workers

## Dados

MySQL  
MariaDB  
Drizzle  
Redis

## Operação

Linux  
Git  
Cloudflare  
JWT  
Testes

Evite a clássica nuvem de badges.

Crie algo mais técnico, como:

- dependency graph;
- pipeline;
- terminal;
- arquitetura em camadas;
- módulos conectados;
- comandos;
- visualização de fluxo.

# GITHUB

Preservar a seção de atividade GitHub.

Atualmente ela apresenta:

- quantidade de repositórios públicos;
- linguagem principal;
- data de criação da conta;
- distribuição de linguagens;
- lista dos projetos;
- status da API;
- fallback local.

Projetos em destaque:

- Alonso;
- Gestifique;
- Flixa;
- Portal Meta.

Faça a consulta preferencialmente no servidor.

Não faça múltiplas requisições desnecessárias da API GitHub no browser.

Utilize cache/revalidation apropriado.

Caso seja disponibilizado um `GITHUB_TOKEN`, ele deve existir exclusivamente no servidor.

Nunca expor esse token no bundle client-side.

Manter fallback caso a API fique indisponível.

O fato de algum projeto ser privado não deve provocar quebra da seção.

# CONTATO

Preservar:

- CTA de contato;
- e-mail atual;
- botão para copiar e-mail;
- GitHub;
- LinkedIn;
- retorno ao topo;
- identificação "Kauê Ajure · Desenvolvedor Full Stack".

Redesenhar visualmente sem alterar os destinos existentes.

# RESPONSIVIDADE

A implementação precisa ser concebida separadamente para:

- desktop grande;
- notebook;
- tablet;
- mobile.

Não apenas reduzir tudo proporcionalmente.

## Desktop

Pode utilizar:

- pinned sections;
- mouse interactions;
- cursor contextual;
- parallax;
- elementos sobrepostos;
- typography oversized.

## Mobile

Simplificar:

- número de camadas;
- intensidade de parallax;
- pinned duration;
- partículas;
- efeitos dependentes de ponteiro.

Não depender de hover.

O storytelling inicial deve continuar existindo, mas de forma mais direta.

Manter texto legível e CTAs acessíveis.

# ESTRUTURA NEXT.JS ESPERADA

Utilize uma organização semelhante a esta como referência, adaptando caso a análise real indique uma organização melhor:

`src/app`
- área pública;
- proposta pública;
- login;
- admin;
- APIs necessárias.

`src/components`
- portfolio;
- motion;
- ui;
- admin;
- proposals;
- pdf.

`src/lib`
- auth;
- db;
- validation;
- github;
- storage;
- proposals;
- pdf;
- security;
- utils.

`src/hooks`
- animações;
- áudio;
- media queries;
- interação.

`src/types`

`public`
- identidade;
- sons locais se existirem;
- imagens;
- assets estáticos.

Evite uma aplicação em que toda a homepage esteja dentro de um único arquivo `page.tsx`.

# SERVER COMPONENTS E CLIENT COMPONENTS

Use Server Components por padrão.

Marque com `"use client"` apenas os componentes que realmente precisam de:

- GSAP;
- eventos;
- hooks client-side;
- Web Audio;
- estado interativo;
- dialogs;
- drag/reorder;
- clipboard.

Não torne a aplicação inteira client-side apenas por causa das animações.

# BANCO DE DADOS

O sistema atual utiliza MySQL.

Preserve os dados existentes.

Não crie uma nova estrutura incompatível sem necessidade.

Mapeie preferencialmente as tabelas existentes com Drizzle ORM ou abordagem equivalente.

Tabelas atuais relevantes:

`clientes`

`usuarios`

`notas`

`produtos_servicos`

`propostas`

`proposta_itens`

`proposta_visualizacoes`

Se for utilizar Drizzle, mapeie os nomes atuais das tabelas e colunas para propriedades TypeScript mais legíveis sem necessariamente renomear fisicamente o banco.

A migração precisa ser não destrutiva.

Nunca apagar dados existentes automaticamente.

Crie migrations adequadas caso novas tabelas sejam necessárias.

# CLIENTES — FUNCIONALIDADE QUE DEVE SER PRESERVADA

Cada cliente possui:

- nome;
- telefone;
- e-mail;
- data de compra;
- valor de orçamento;
- valor vendido;
- status;
- forma de pagamento;
- informações específicas da forma de pagamento;
- informações específicas do status;
- manutenção;
- renovação;
- observações;
- documento.

## Status

Valores atuais:

`orcamento`

`aprovado`

`em_andamento`

`entregue`

`cancelado`

Apresente labels em português.

### Orçamento

Exigir validade do orçamento.

### Aprovado

Exigir data de aprovação.

### Em andamento

Exigir previsão de entrega.

### Entregue

Exigir data de entrega.

### Cancelado

Exigir motivo de cancelamento, limitado conforme regra existente.

# PAGAMENTOS DO CLIENTE

Tipos atuais:

`a_vista`

`mensal`

`parcelas`

## À vista

Permitir data de pagamento.

## Mensal

Exigir:

- valor mensal > 0;
- dia de vencimento entre 1 e 28;
- data inicial.

## Parcelado

Exigir:

- quantidade mínima de 2;
- quantidade máxima de 120;
- valor da parcela > 0;
- data da primeira parcela;
- número de parcelas pagas.

`parcelas_pagas` nunca pode superar o total de parcelas.

# MANUTENÇÃO E RENOVAÇÃO

Manter os defaults atuais:

- manutenção: 90 dias;
- renovação: 365 dias.

Esses valores podem ser personalizados por cliente.

# AGENDA

Preservar exatamente a lógica de negócio existente.

A partir da data da compra:

`dataManutencao = dataCompra + diasManutencao`

`dataRenovacao = dataCompra + diasRenovacao`

Para pagamentos parcelados:

se `parcelasPagas < qtdParcelas`:

`proximaParcela = primeiraParcela + parcelasPagas meses`

Classificação:

- menor que 0 dias → overdue;
- até 7 dias → nível 7;
- até 15 dias → nível 15;
- até 30 dias → nível 30;
- acima de 30 → ok.

Manter os filtros da agenda.

# DASHBOARD

Preservar os indicadores atuais.

Calcular:

- quantidade total de clientes;
- quantidade de notas;
- pipeline;
- urgentes;
- atrasados;
- quantidade por status;
- próximos eventos.

Pipeline atual:

somatório de `valor_vendido` dos clientes cujo status não seja cancelado.

Urgentes:

- atrasados;
- eventos em até 7 dias.

Próximos eventos:

eventos com até 30 dias.

Preservar apresentação resumida dos primeiros eventos importantes.

# NOTAS

Manter CRUD completo de notas.

Campos:

- título;
- conteúdo;
- cliente opcional.

Permitir:

- criar;
- editar;
- excluir;
- listar.

Preservar vínculo opcional com cliente.

# PRODUTOS E SERVIÇOS

Preservar catálogo utilizado nas propostas.

Campos:

- nome;
- tipo de preço;
- preço;
- descrição;
- ativo;
- ordem.

Tipos:

`fixo`

`hora`

Manter:

- criação;
- edição;
- desativação;
- ordenação.

# PROPOSTAS

Este módulo precisa ser migrado com extremo cuidado.

Não simplificar.

Statuses atuais:

`rascunho`

`enviada`

`visualizada`

`aceita`

`recusada`

`expirada`

`cancelada`

## Código

Preservar formato semelhante a:

`PROP-AAAA-NNN`

Exemplo:

`PROP-2026-001`

A numeração é sequencial por ano.

## Token público

Cada proposta possui token criptograficamente aleatório equivalente aos atuais 32 bytes representados em 64 caracteres hexadecimais.

Nunca utilizar ID incremental como token público.

# CAMPOS DA PROPOSTA

Preservar:

- cliente opcional;
- título;
- validade;
- desconto em valor;
- desconto percentual;
- subtotal;
- total;
- condições;
- escopo;
- data de visualização;
- data de resposta;
- resposta do cliente;
- itens;
- histórico de visualizações.

# ITENS DA PROPOSTA

Itens devem funcionar como snapshots.

Mesmo quando originados do catálogo, armazenar:

- nome;
- descrição;
- tipo de preço;
- preço unitário;
- quantidade;
- total;
- ordem.

Assim, alterações posteriores no catálogo não devem modificar propostas antigas.

Permitir:

- adicionar do catálogo;
- adicionar item avulso;
- remover;
- mover para cima;
- mover para baixo;
- alterar quantidade;
- alterar preço;
- editar informações permitidas.

Limite equivalente ao atual:

máximo de 100 itens.

# CÁLCULO DAS PROPOSTAS

Linha:

`totalLinha = precoUnitario × quantidade`

Subtotal:

soma das linhas.

Desconto:

aceitar valor fixo OU percentual.

Se percentual > 0, percentual tem prioridade e o desconto fixo deve ser zerado.

Percentual:

0–100%.

Nunca gerar total negativo.

Todos os cálculos monetários devem ser consistentes e protegidos contra erros de ponto flutuante. Considere internamente centavos/integer ou uma estratégia decimal adequada.

# ESTADOS E TRANSIÇÕES DA PROPOSTA

## Criação

Nova proposta:

`rascunho`

## Enviar

Somente permitir envio se:

- possuir pelo menos um item;
- total > 0.

Ao enviar:

- status → `enviada`;
- limpar visualização anterior;
- limpar resposta anterior.

## Visualização

Ao primeiro acesso público válido:

`enviada` → `visualizada`.

## Aceite

Permitido apenas quando:

- `enviada`;
- ou `visualizada`;
- e não expirada.

Status:

`aceita`.

## Recusa

Mesmas condições.

Status:

`recusada`.

## Expiração

Quando a validade estiver no passado e a proposta for elegível:

status → `expirada`.

## Cancelamento

Não permitir cancelamento de proposta já aceita.

## Exclusão

Somente permitir exclusão de:

- rascunho;
- cancelada.

# SINCRONIZAÇÃO COM CLIENTE AO ACEITAR PROPOSTA

Preservar a regra atual.

Quando uma proposta vinculada a cliente for aceita:

- `valor_orcamento` do cliente recebe o total;
- `valor_vendido` recebe o total;
- status do cliente → `aprovado`;
- data de aprovação → hoje;
- preservar/aplicar validade adequada;
- atualizar timestamp.

Faça essa operação transacionalmente.

# DUPLICAÇÃO DE PROPOSTA

Preservar.

Ao duplicar:

- gerar novo código;
- gerar novo token público;
- status → rascunho;
- título recebe indicação de cópia;
- copiar itens como novos snapshots;
- copiar escopo;
- condições;
- cliente;
- descontos;
- validade.

# PROPOSTA PÚBLICA

Implementar rota Next.js amigável, por exemplo:

`/proposta/[token]`

ou outra estrutura limpa equivalente.

O token precisa continuar não previsível.

## Preview

Antes de o visitante fornecer seu nome, não retornar o conteúdo integral da proposta.

Preview pode conter somente informações equivalentes às atuais:

- código;
- título;
- status;
- validade;
- indicação de expiração.

## Gate de identificação

Antes de revelar a proposta, solicitar nome.

Mínimo:

2 caracteres.

Máximo:

120.

Armazenar sessão do visualizador localmente de maneira apropriada para evitar pedir novamente durante a mesma sessão.

## Registro de visualização

Registrar:

- proposta;
- nome;
- horário.

Mostrar no admin "Quem viu".

Manter até pelo menos o histórico utilizado atualmente.

## Proposta aberta

Mostrar:

- código;
- título;
- validade;
- itens;
- quantidades;
- preços;
- subtotal;
- desconto;
- total;
- escopo;
- condições;
- status;
- opção de PDF.

## Resposta

Permitir:

- aceitar;
- recusar;
- mensagem opcional.

Mensagem:

máximo 2000 caracteres.

Exigir confirmação visual antes de uma ação irreversível.

Não depender de `window.confirm` na nova interface; criar dialog acessível.

# PDF DA PROPOSTA

Continuar permitindo geração/download do PDF da proposta tanto no painel quanto na proposta pública quando permitido.

O PDF deve conter:

- marca Kauê Ajure;
- identificação de proposta comercial;
- título;
- código;
- cliente quando existir;
- validade;
- itens;
- tipo;
- quantidade;
- unitário;
- total de linha;
- subtotal;
- desconto;
- total;
- escopo;
- condições.

Pode melhorar o layout do PDF, mas não remover essas informações.

Usar fontes e encoding que suportem português adequadamente.

Não repetir a limitação atual de conversão de UTF-8 para ISO-8859-1 se uma biblioteca Node moderna permitir Unicode real.

# AUTENTICAÇÃO

Preservar login administrativo seguro.

Não armazenar JWT ou sessão sensível no `localStorage`.

Utilizar sessão segura baseada em cookie:

- HttpOnly;
- Secure em produção;
- SameSite apropriado;
- rotação/regeneração após autenticação;
- expiração adequada.

Pode utilizar uma biblioteca madura compatível com Next.js, desde que ela não comprometa a migração do banco existente.

Analise o formato dos hashes atuais antes de migrar.

Não invalide senhas existentes silenciosamente.

Se o formato atual de `password_hash()` não puder ser validado diretamente pela solução Node escolhida, implemente uma estratégia explícita de migração ou redefinição.

# SETUP DE SENHA

O projeto atual possui fluxo de definição de senha baseado em `setup_token`.

Preserve uma solução equivalente.

Regras atuais importantes:

- setup desativado quando não existe token configurado;
- token de configuração nunca deve ser público;
- mínimo 12 caracteres;
- máximo 128;
- não revelar se um determinado usuário existe.

Transforme `setup_token` em variável de ambiente segura.

# RATE LIMIT

Preservar ou melhorar os limites existentes.

Equivalentes atuais:

Login:
8 tentativas / 15 minutos por IP.

Setup:
5 / 15 minutos.

Abertura pública de proposta:
40 / 10 minutos.

Resposta de proposta:
20 / 10 minutos.

Não utilize arquivos locais como armazenamento de rate limit em uma arquitetura serverless.

Use armazenamento apropriado ao ambiente escolhido.

# CSRF

Proteja operações autenticadas mutáveis.

Não presuma que usar Next.js automaticamente elimina toda necessidade de análise de CSRF.

Se a solução de autenticação/framework fornecer proteção adequada, documente como ela funciona.

Não aceite mutações administrativas de origem arbitrária.

# SEGURANÇA

Preserve e evolua as correções já existentes no projeto.

Manter:

- headers seguros;
- proteção contra MIME sniffing;
- política de referrer;
- proteção contra framing;
- arquivos privados;
- validação server-side;
- prepared statements/ORM parametrizado;
- rate limit;
- proteção de sessão;
- proteção de uploads;
- respostas genéricas de autenticação;
- logout via ação mutável e não por GET.

Nunca retornar stack trace ao usuário em produção.

Nunca retornar erros internos do MySQL diretamente.

# UPLOADS DE CLIENTES

Preservar uploads de documentos.

Limite atual:

20 MB.

Extensões atualmente aceitas:

- pdf;
- doc;
- docx;
- xls;
- xlsx;
- csv;
- ppt;
- pptx;
- odt;
- ods;
- txt;
- rtf;
- png;
- jpg;
- jpeg;
- webp;
- gif;
- zip;
- rar;
- 7z.

Continuar bloqueando explicitamente arquivos executáveis ou interpretáveis como:

- PHP;
- scripts;
- executáveis;
- HTML;
- SVG;
- JS;
- CSS;
- configurações de servidor;
- outros arquivos potencialmente executáveis.

Não confie somente na extensão.

Valide MIME.

Use nomes internos aleatórios.

Nunca exponha o caminho físico real do servidor.

Documentos privados devem ser baixados através de rota autenticada ou URL assinada de curta duração.

# STORAGE

A implementação atual usa disco local.

Crie uma abstração de storage.

Ela deve permitir:

## Desenvolvimento/VPS

filesystem privado.

## Produção serverless

storage compatível com S3 ou serviço equivalente.

Não dependa de armazenamento persistente dentro do filesystem de uma Function serverless.

# FERRAMENTAS DE PDF DO PAINEL

O projeto possui um módulo de ferramentas PDF que NÃO pode desaparecer na migração.

Preserve:

1. unir PDFs;
2. separar PDF;
3. imagens → PDF;
4. arquivo → PDF;
5. PDF → imagens;
6. PDF → texto;
7. PDF → Word;
8. comprimir;
9. proteger com senha;
10. remover senha;
11. aplicar marca d'água;
12. OCR.

O código atual utiliza, dependendo da operação:

- FPDI/FPDF;
- Ghostscript;
- Tesseract;
- `pdftotext`;
- LibreOffice/soffice;
- ZIP;
- armazenamento temporário de jobs.

Na implementação Next.js/Node, crie uma camada `PdfProcessor` ou equivalente.

Não execute comandos construídos concatenando entrada arbitrária do usuário.

Ao utilizar processos externos, prefira `spawn`/execução com lista de argumentos e validação rigorosa.

Cada processamento deve possuir diretório temporário isolado por UUID/token.

Limpar jobs antigos.

Nunca usar nome fornecido pelo usuário diretamente como caminho de execução.

# CAPABILITIES DO PDF

Preserve o conceito atual de detectar quais ferramentas estão instaladas.

Exemplo:

- merge → disponível;
- split → disponível;
- imagesToPdf → disponível;
- fileToPdf → depende de LibreOffice;
- pdfToImages → depende de Ghostscript;
- pdfToTxt → depende de pdftotext;
- pdfToDocx → depende de LibreOffice;
- compress → Ghostscript;
- protect → Ghostscript;
- unlock → Ghostscript;
- watermark → disponível;
- OCR → Ghostscript + Tesseract.

A interface deve informar quando determinado recurso não estiver disponível em vez de falhar silenciosamente.

# OCR

Preservar suporte preferencial a:

português + inglês.

Se os dados de treinamento em português não estiverem presentes, fazer fallback apropriado e deixar isso claro na configuração.

# IMPORTANTE SOBRE DEPLOY

Não assuma que o fato de o site de referência estar hospedado na Vercel significa que todo este sistema deve rodar integralmente em uma única Function da Vercel.

Há processamento de:

- PDFs;
- OCR;
- LibreOffice;
- Ghostscript;
- Tesseract;
- arquivos;
- banco;
- uploads.

A arquitetura deve ser escolhida de acordo com o ambiente real.

## Se o deploy for VPS/container/Hostinger com Node

É possível manter um monólito Next.js + worker/serviço PDF, instalando os binários necessários.

Produzir Dockerfile ou documentação equivalente quando apropriado.

## Se o frontend/API estiver na Vercel

Não dependa de filesystem local persistente.

Utilize:

- storage externo para arquivos;
- banco remoto;
- rate limit remoto.

Para funcionalidades PDF que dependam de binários não adequados à Function, separe um serviço/worker de processamento.

Nesse cenário:

Next.js  
→ API segura  
→ fila/worker PDF  
→ object storage  
→ resultado

Não simplesmente remover funcionalidades incompatíveis.

# PAINEL ADMINISTRATIVO

Manter as áreas existentes:

- Dashboard;
- Clientes;
- Propostas;
- Agenda;
- Notas;
- PDF;
- link para Portfólio;
- Logout.

Sugestão de rotas:

`/admin/dashboard`

`/admin/clientes`

`/admin/propostas`

`/admin/propostas/nova`

`/admin/propostas/[id]`

`/admin/agenda`

`/admin/notas`

`/admin/pdf`

Não é obrigatório usar exatamente esses caminhos caso haja motivo arquitetural melhor.

# DESIGN DO ADMIN

O painel não precisa receber o mesmo nível de efeitos da homepage.

Priorize:

- velocidade;
- leitura;
- tabelas/listas claras;
- formulários eficientes;
- estados;
- keyboard navigation;
- dialogs;
- busca;
- filtros;
- feedback;
- responsividade.

Ele deve visualmente pertencer ao mesmo produto.

Use:

- mesma tipografia;
- mesma paleta;
- mesmos tokens;
- mesma linguagem de componentes.

Não coloque animações cinematográficas dentro de CRUDs.

# CLIENTES — INTERFACE ADMIN

Preservar:

- busca;
- filtro por status;
- estatísticas;
- lista;
- criação;
- edição;
- exclusão;
- upload;
- remoção de documento;
- campos condicionais.

Ao alterar status, mostrar apenas os campos relevantes.

Ao alterar forma de pagamento, mostrar apenas os campos correspondentes.

Validação client-side é apenas UX.

Toda regra deve existir também no servidor.

# PROPOSTAS — INTERFACE ADMIN

Preservar:

- busca;
- filtro de status;
- lista;
- nova proposta;
- catálogo;
- editar;
- PDF;
- copiar link;
- duplicar;
- cancelar;
- excluir quando permitido;
- quem visualizou;
- edição dos itens;
- item avulso;
- item do catálogo;
- descontos;
- totais em tempo real.

Os totais mostrados no cliente são apenas uma prévia.

O servidor deve recalcular tudo e ser a autoridade final.

# GERAÇÃO DE LINK PÚBLICO

Não construir links com string insegura ou confiar em `window.location` como única fonte.

Centralize geração de URL pública.

Em produção, utilize `APP_URL`/config equivalente.

# FORMATAÇÃO

Idioma:

pt-BR.

Moeda:

BRL.

Datas exibidas:

pt-BR.

Datas de negócio e regras de agenda devem considerar explicitamente o timezone:

`America/Sao_Paulo`

Evite bugs por interpretar datas `YYYY-MM-DD` como UTC e deslocá-las para o dia anterior.

# VALIDAÇÃO

Use uma camada central, preferencialmente Zod ou equivalente.

Compartilhe schemas quando adequado.

Nunca confiar nos valores enviados pelo client.

Validar:

- strings;
- IDs;
- enums;
- datas;
- dinheiro;
- quantidade;
- MIME;
- tamanho;
- tokens;
- descontos;
- transitions de status.

# TRATAMENTO MONETÁRIO

Evite erros de ponto flutuante.

Preferencialmente manipule dinheiro em centavos ou use solução decimal adequada.

No banco existente, mantenha compatibilidade com `DECIMAL(12,2)`.

# TRANSAÇÕES

Utilize transações principalmente em:

- substituição dos itens de proposta;
- atualização dos totais;
- aceite de proposta;
- sincronização da proposta com cliente;
- operações compostas que possam deixar dados inconsistentes.

# SEO DO PORTFÓLIO

Preservar e melhorar:

Título atual:
Kauê Ajure — Desenvolvedor Full Stack

Descrição:
Portfólio de Kauê Ajure, desenvolvedor Full Stack focado em sistemas de gestão, produtos SaaS e aplicações web completas.

Adicionar corretamente:

- metadata do Next.js;
- canonical;
- Open Graph;
- Twitter metadata quando adequado;
- sitemap;
- robots;
- favicon;
- structured data apropriado se realmente fizer sentido.

Admin e login:

`noindex`.

Propostas públicas:

avaliar privacidade e preferencialmente `noindex, nofollow`.

# SEMÂNTICA E ACESSIBILIDADE

Meta:

WCAG 2.2 AA sempre que possível.

Garantir:

- headings hierárquicos;
- landmarks;
- skip link;
- navegação por teclado;
- foco visível;
- botões reais para ações;
- links reais para navegação;
- dialogs acessíveis;
- labels;
- `aria-live` quando necessário;
- contraste;
- reduced motion;
- controles de áudio;
- nenhuma informação exclusivamente por cor.

# ESTADOS DA INTERFACE

Toda operação assíncrona relevante precisa contemplar:

- idle;
- loading;
- success;
- error;
- empty.

Não deixar botão aparentemente clicável enquanto uma operação crítica está ocorrendo.

Utilize feedback claro.

# ERROS

Crie:

- error boundaries quando apropriado;
- `not-found`;
- telas de erro amigáveis;
- fallback da API GitHub;
- fallback de motion;
- fallback de áudio;
- fallback das ferramentas PDF.

Nunca deixar a página branca por falha de uma animação.

Se GSAP não inicializar, o conteúdo deve aparecer normalmente.

# TESTES

Não considere a migração concluída apenas porque `next dev` abre.

Adicionar testes para regras críticas.

## Unitários

No mínimo:

- cálculos de proposta;
- descontos;
- geração de código;
- expiração;
- cálculo de agenda;
- próxima parcela;
- manutenção;
- renovação;
- validações críticas.

## Integração

Testar:

- autenticação;
- cliente;
- notas;
- catálogo;
- proposta;
- transições de status;
- sincronização após aceite.

## E2E

Cobrir fluxos principais com Playwright ou equivalente:

1. home abre;
2. navegação pública;
3. reduced-motion;
4. login;
5. criar cliente;
6. editar cliente;
7. criar proposta;
8. adicionar itens;
9. enviar;
10. abrir link público;
11. fornecer nome;
12. registrar visualização;
13. aceitar ou recusar;
14. verificar estado no admin.

PDFs dependentes de binários podem ser testados condicionalmente conforme capabilities.

# VERIFICAÇÃO FINAL

Antes de declarar concluído, execute:

- lint;
- typecheck;
- testes;
- build de produção.

Corrija os erros encontrados.

Não finalizar deixando:

- TypeScript errors;
- warnings relevantes;
- imports quebrados;
- rotas 404 acidentais;
- TODOs essenciais;
- mocks no lugar de funcionalidades existentes;
- botões sem implementação.

# ENVIRONMENT VARIABLES

Criar `.env.example`.

Nunca subir credenciais reais.

Documentar pelo menos o necessário para:

- MySQL;
- segredo de autenticação;
- setup token;
- URL da aplicação;
- token GitHub opcional;
- storage;
- worker PDF, quando aplicável.

Utilize nomes coerentes.

# MIGRAÇÃO DO BANCO

Criar documentação clara para conectar a aplicação Next.js ao banco existente.

Não exigir que eu destrua o banco e rode um seed novo.

A aplicação deve conseguir utilizar os registros já existentes.

Caso alterações sejam necessárias:

- criar migration;
- explicar;
- manter rollback ou estratégia segura;
- não deletar dados.

# ARQUIVOS LEGADOS

Não apague imediatamente a implementação antiga durante o início da migração.

Primeiro:

1. mapear;
2. reproduzir;
3. testar;
4. validar paridade.

Somente depois remover PHP/HTML/JS legados que não sejam mais utilizados.

Assets que continuarem relevantes devem ser reaproveitados.

# PERFORMANCE

Defina orçamento de performance.

Evite:

- dependências gigantes sem necessidade;
- bibliotecas duplicadas;
- hydration em seções estáticas;
- imagens sem otimização;
- request waterfalls evitáveis;
- listeners globais esquecidos;
- timelines sem cleanup;
- animações infinitas pesadas.

Carregue componentes de motion pesado apenas onde forem utilizados.

Use `next/image` quando adequado.

# QUALIDADE DE CÓDIGO

Exijo:

- TypeScript estrito;
- componentes coesos;
- funções pequenas;
- regras de domínio fora dos componentes React;
- nenhuma query SQL perdida dentro de UI;
- nenhuma lógica de negócio duplicada;
- schemas centralizados;
- error handling consistente;
- naming em inglês no código novo quando fizer sentido;
- conteúdo da interface em português;
- comentários somente quando agregarem informação;
- nada de comentários explicando código óbvio.

# NÃO FAZER

Não:

- copiar o Dixor;
- transformar tudo em uma única página gigante;
- utilizar somente Client Components;
- reescrever conteúdo sem motivo;
- remover o painel;
- remover propostas;
- remover PDF;
- remover agenda;
- remover notas;
- remover clientes;
- remover catálogo;
- alterar o banco destrutivamente;
- armazenar secrets no frontend;
- armazenar autenticação em localStorage;
- deixar som automático;
- ignorar reduced-motion;
- usar código visual aleatório;
- criar uma estética Matrix;
- inventar projetos;
- inventar métricas;
- inventar screenshots;
- expor repositórios privados;
- implementar funções fictícias;
- marcar algo como concluído se ainda estiver mockado.

# PROCESSO DE EXECUÇÃO

Execute o trabalho em fases internas, mas não pare após entregar apenas planejamento.

### Fase 1
Auditar o repositório e produzir mentalmente mapa de funcionalidades e dependências.

### Fase 2
Definir arquitetura Next.js e estratégia de migração.

### Fase 3
Criar infraestrutura:

- Next.js;
- TypeScript;
- banco;
- env;
- auth;
- storage;
- validação.

### Fase 4
Migrar regras de negócio e painel.

### Fase 5
Migrar proposta pública.

### Fase 6
Migrar ferramentas PDF.

### Fase 7
Construir nova homepage e motion system.

### Fase 8
Responsividade e acessibilidade.

### Fase 9
Testes.

### Fase 10
Build e validação de produção.

# PRIORIDADES

Quando houver conflito, siga esta ordem:

1. preservar dados;
2. preservar regras de negócio;
3. segurança;
4. funcionalidade;
5. acessibilidade;
6. performance;
7. responsividade;
8. experiência visual;
9. efeitos decorativos.

Nunca sacrifique uma regra crítica de negócio para facilitar uma animação.

# CRITÉRIO PARA O NOVO PORTFÓLIO

Ao abrir a página, o visitante precisa sentir imediatamente que o site foi desenvolvido por alguém que trabalha com produtos digitais complexos.

A experiência deve ser memorável não pela quantidade arbitrária de efeitos, mas porque:

- código se transforma em interface;
- arquitetura vira narrativa visual;
- scroll controla a construção;
- som reforça momentos;
- projetos parecem sistemas reais;
- movimento explica o perfil full-stack.

A referência Dixor deve ser perceptível principalmente na qualidade da direção de arte, transições, escala e fluidez, não na cópia do layout.

# RESULTADO ESPERADO

Ao final, quero um único projeto Next.js completo que substitua o sistema atual e contenha:

- portfólio público completamente redesenhado;
- intro scroll-driven;
- animações avançadas;
- sistema de áudio opt-in;
- identidade Kauê Ajure preservada;
- conteúdo atual preservado;
- projetos atuais preservados;
- GitHub dinâmico;
- contato;
- autenticação;
- painel;
- dashboard;
- clientes;
- agenda;
- notas;
- catálogo;
- propostas;
- proposta pública;
- rastreamento de visualizações;
- aceite/recusa;
- PDF de proposta;
- toolkit PDF;
- uploads;
- MySQL existente;
- segurança;
- responsividade;
- acessibilidade;
- SEO;
- testes;
- documentação de deploy.

Não entregue apenas uma demonstração visual.

Não entregue somente a homepage.

Não entregue apenas um scaffold.

A implementação deve alcançar paridade funcional com o sistema existente e então melhorar sua arquitetura e experiência visual.

Antes de considerar o trabalho finalizado, compare explicitamente o resultado contra o repositório legado e verifique se alguma funcionalidade existente desapareceu durante a migração.