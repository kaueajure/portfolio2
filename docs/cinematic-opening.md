# Abertura cinematográfica

A abertura monta visualmente uma interface e revela a página real do portfólio. Não há uma segunda versão do hero: a prévia usa o mesmo HTML, fontes, imagens e layout da página final.

## Comportamento

- Timeline automática de 7,75 s no desktop/tablet e aproximadamente 5,46 s no mobile, após carregar GSAP e as fontes.
- Boot, editor, módulos de interface, prévia real do site, conexão dos serviços, build e expansão da prévia até preencher a tela.
- O conteúdo é renderizado no servidor. Durante a prévia, sua área animada fica limitada à altura da tela; o restante da página não aumenta a superfície transformada.
- Ao concluir, o overlay é ocultado antes de restaurar estilos e rolagem. A largura reservada à barra de rolagem permanece estável. A página não ganha pin, spacer ou percurso adicional de scroll.
- As animações de rolagem são inicializadas depois da abertura, com dois frames para permitir a pintura da página final. Replays interrompem essas animações e as reinicializam após a abertura.
- Estados: idle, playing, skipping, finishing e complete. Scroll e inert são restaurados no término, pulo, falha e desmontagem.
- Controles de som e pulo acessíveis, foco contido e Escape para pular. Após interação por teclado, o foco volta ao elemento anterior ou à seção inicial, sem contorno decorativo. O título não recebe foco programático. Links e botões preservam seus indicadores de foco.
- Reproduz em toda entrada/recarregamento da home. Âncoras são respeitadas após a abertura; o botão de replay retorna ao início.
- O boot vem visível no HTML do servidor. JavaScript desativado libera a home via noscript; caso a hidratação não inicie, o overlay idle perde visibilidade após 10 s.
- Reduced motion dispensa a sequência. Alterar essa preferência durante a execução também libera a página.
- Falhas no carregamento/animação liberam a homepage; watchdog independente encerra qualquer espera em 10 s.

## Organização

- `intro.tsx`: hero real do portfólio.
- `intro/cinematic-intro.tsx`: ciclo de vida, foco, bloqueio e eventos de início/conclusão.
- `intro/scenes.tsx`: cenas decorativas, com aria-hidden.
- `intro/timeline.ts`: direção temporal e transformação da página real.
- `motion.tsx`: animações de rolagem, medidas após a conclusão.
- `sound-control.tsx` e `audio.ts`: áudio compartilhado com o header, ativado somente pelo usuário.

## Verificação

`tests/e2e/opening.spec.ts` cobre 1440, 768, 390 e 320 px, conclusão automática, refresh, replay, teclado, áudio, âncoras, menu mobile, reduced motion, JavaScript desativado e navegação para projetos.

Os testes também comparam a geometria do título na prévia com a página final, verificam continuidade inferior a 1 px no frame de liberação, limitam a prévia à altura da tela e confirmam que nenhum estilo temporário, inert ou foco no título permanece. Capturas da prévia e da página final são produzidas nos testes de desktop e mobile.

Execute com o servidor local iniciado: `TEST_BASE_URL=http://localhost:3100 npx playwright test tests/e2e/opening.spec.ts`.
