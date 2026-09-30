# Abertura cinematográfica

Esta correção substitui somente a abertura por scroll prevista originalmente em `Implementação.md`. O restante do portfólio mantém suas animações de scroll e os módulos administrativos permanecem inalterados.

## Comportamento

- Timeline automática de 7,75 s no desktop/tablet e aproximadamente 5,46 s no mobile.
- Boot, criação da árvore, revelação de código, expansão de retângulos de código em módulos, conexão Interface/API/Database/Worker/Deploy, build e expansão da página real.
- O hero é HTML renderizado no servidor e permanece no documento. A intro é um overlay fixo removido ao terminar; não cria pin, spacer nem percurso adicional de scroll.
- O reveal usa a página real numa janela recortada que se expande. Não carrega vídeo nem bibliotecas novas.
- Estados: idle, playing, skipping, finishing e complete. O bloqueio de scroll e o atributo inert do conteúdo são restaurados no término, pulo, falha e desmontagem.
- Controles de som e pulo acessíveis, foco contido, Escape para pular e foco devolvido ao hero. Cenas decorativas usam aria-hidden.
- Reproduz em toda entrada/recarregamento da home, inclusive com âncora. Sem bloqueio por sessionStorage ou necessidade de query param.
- O boot já vem visível no HTML do servidor, antes da hidratação; JavaScript desativado libera a home via noscript. Se a hidratação não iniciar, o overlay idle perde visibilidade após 10 s.
- Reduced motion dispensa a sequência. Mudança para essa preferência durante a execução libera a página.
- Falha no carregamento/animação libera a homepage; watchdog independente encerra qualquer espera em 10 s.

## Organização

`intro.tsx`: hero estático. `intro/cinematic-intro.tsx`: ciclo de vida, estado, foco e bloqueio. `intro/scenes.tsx`: elementos visuais. `intro/timeline.ts`: direção temporal. `sound-control.tsx`: controle compartilhado com o header. `audio.ts`: sons de ruído filtrado, transientes, acordes e sweeps, com opt-in, volume baixo e rate limit.

## Verificação

`tests/e2e/opening.spec.ts` cobre conclusão automática em 1440/768/390 px, scroll restaurado, replay em refresh, primeira pintura, pulo, reduced motion, áudio compartilhado, teclado e falha de chunk GSAP. Os testes antigos de pin/spacer/scroll de 1850 px foram removidos. `tests/e2e/flows.spec.ts` preserva as verificações administrativas e de navegação/áudio.

Validação da correção de primeira pintura e replay: lint e typecheck sem erros; 25 testes Vitest aprovados com os binários PDF disponíveis; 11 testes de abertura Playwright aprovados no servidor standalone de produção; build aprovado. A suíte cobre 1440, 768 e 390 px, reduced motion, JavaScript atrasado e JavaScript desativado. Na implementação inicial também foram aprovados os testes dos fluxos administrativos e inspecionada visualmente a montagem/reveal. Nenhuma dependência adicionada, migration ou alteração de API/admin.
