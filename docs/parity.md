# Conferência de paridade

A especificação `Implementação.md` foi lida integralmente antes da implementação e relida durante a validação. A implementação PHP permanece em `legacy/` para comparação. Nenhum banco de produção foi acessado; a verificação usou o schema legado em MariaDB isolado.

| Área | Implementação e conferência |
| --- | --- |
| Identidade e conteúdo | Paleta, Syne/Figtree/JetBrains Mono, logos, quatro projetos, stack, textos centrais e destinos originais preservados. Diagramas de sistemas feitos em HTML/CSS, sem screenshots fictícios. |
| Abertura e motion | Intro fullscreen, cinco estágios, código/arquitetura/construção, pin de desktop, scrub, progressão, revelações e hover. Cleanup, conteúdo inicial disponível, reduced motion e mobile sem pin. |
| Som | Web Audio centralizado, opt-in, volume limitado, rate limit, pausa ao ocultar, persistência, recuperação após gesto e cleanup. |
| Navegação e contato | Âncoras, seção ativa, menu mobile/teclado, header reativo, copiar e-mail, links originais e topo. |
| GitHub | Consulta server-side, cache de 1h, timeout, token privado, filtro de repositórios públicos, fallback sem métricas inventadas. |
| Infraestrutura | App Router, componentes estáticos no servidor, TypeScript estrito, Zod, consultas parametrizadas, Decimal e timezone explícito. |
| Clientes | CRUD, busca/status, estatísticas, campos condicionais, três pagamentos, cinco status, manutenção/renovação, documento privado, troca e remoção. |
| Agenda/dashboard | Regras e filtros legados, próximas parcelas, urgência 7/15/30 dias, atrasados, totais/status/notas/eventos. |
| Notas e catálogo | CRUD de notas, vínculo opcional; criação/edição/desativação/reordenação de produtos. |
| Propostas | Sequência anual com bloqueio, tokens aleatórios, snapshots, até 100 itens, reorder, descontos, totais server-side, transações, edição, duplicação, envio, cancelamento e exclusão restrita. |
| Público | Preview restrito, identificação assinada, histórico, aceite/recusa confirmados, expiração, sincronização transacional do cliente e PDF protegido pelo gate. |
| Autenticação | Bcrypt PHP compatível, Argon2id no setup, token privado, cookie rotacionado/expirável, logout POST, rate limit MySQL e verificação de origem. Proteção em cada página administrativa e APIs. |
| Arquivos | Limites, extensão + conteúdo MIME, nomes aleatórios, filesystem privado/S3, download autenticado. |
| PDF | Doze operações com arquivos reais, processos sem shell, UUID, limpeza, capabilities, Unicode, OCR inglês/português. qpdf substitui criptografia antiga do Ghostscript. |
| UX e acesso | Formulários com rótulos associados, dialogs nativos, foco, teclado, feedback, estados vazios/erro/carregamento, breakpoints e noindex de áreas privadas. |
| SEO | Metadata, canonical, OG/Twitter, sitemap/robots e icons. |
| Migração/deploy | Migration aditiva, instalação inicial segura separada, legado preservado, Docker Linux, proxy HTTPS, backup e rollback documentados. |

## Evidências

`tests/domain.test.ts`: 23 casos de domínio. `tests/pdf.test.ts`: integração das 12 ferramentas com arquivos reais, senha e privacidade. `tests/e2e/flows.spec.ts`: fluxos por HTTP e navegador, incluindo concorrência de códigos, estados, aceite, sincronização, responsividade, movimento e áudio.

A concorrência revelou um deadlock causado por INSERT IGNORE seguido de promoção do lock. O upsert agora obtém o lock exclusivo antes da leitura da sequência e do contador de tentativas. A listagem de propostas utiliza consultas em lote.

O primeiro build revelou tracing de diretórios dinâmicos. Caminhos de dados privados agora são excluídos explicitamente; o artefato standalone não inclui `.env`, PHP ou arquivos privados. PDF comercial e páginas desktop/mobile foram renderizados e inspecionados.

Limites reais: não houve deploy externo nem acesso aos dados reais, S3 ou ambiente Docker de destino. PDF → Word extrai texto; não promete reprodução de layouts. Binários ausentes desabilitam somente a ferramenta correspondente com mensagem explícita. As credenciais/banco de testes não devem ser usados em produção.

## Resultado da rodada final

- `npm run lint`: aprovado sem avisos.
- `npm run typecheck`: aprovado.
- `npm test`, com todos os binários disponíveis: 25 testes aprovados, incluindo PDF comercial multipágina com Unicode e palavras longas.
- `npm run build`: aprovado sem avisos; 18 entradas de rota geradas/listadas, incluindo rotas dinâmicas.
- `TEST_BASE_URL=http://localhost:3001 npx playwright test`: 5 testes aprovados contra o servidor standalone de produção.
- Setup real, novo hash Argon2id, login e bloqueio de redefinição de senha existente: aprovados no banco isolado.
- Migration aditiva e comando de manutenção: executados no banco de testes.
- JavaScript da home observado no navegador, incluindo GSAP: aproximadamente 192 KiB gzip, abaixo do orçamento de 250 KiB. LCP/INP/CLS de campo ainda dependem de tráfego real.
- Artefato standalone: verificado sem `.env` e PHP; segredo de autenticação ausente dos assets estáticos.

Referência auditada: commit `e06fb7a614cbbedca400eae5613aa5a08a77f08a` do repositório original.
