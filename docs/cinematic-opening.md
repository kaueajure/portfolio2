# Abertura cinematográfica

A abertura monta visualmente uma interface e revela a página real do portfólio. Não há uma segunda versão do hero: a prévia usa o mesmo HTML, fontes, imagens e layout da página final.

## Comportamento

- Timeline automática de aproximadamente 13,74 s no desktop/tablet e 11,45 s no mobile, após carregar GSAP e as fontes.
- Boot, digitação da estrutura e do JSX, montagem dos elementos reais do site, conexão dos serviços, build e expansão da mesma página até preencher a tela.
- Editor e prévia real aparecem lado a lado no desktop e empilhados no mobile. O editor permanece visível durante toda a digitação, com cursor, indicação da linha ativa, confirmação e contador dos elementos liberados.
- As linhas da interface são digitadas caractere por caractere. Ao concluir uma linha com alvo, a timeline revela apenas seu elemento real: cabeçalho, apresentação, título, descrição, botão de projetos, contato ou nota. Imports e estrutura JSX preparam o código sem liberar conteúdo antecipadamente.
- `intro/code.ts` relaciona cada linha a um identificador estável de `data-opening-part`. O texto exibido é uma demonstração visual em JSX; nenhum código é avaliado ou compilado no navegador. A prévia usa os elementos do site renderizados no servidor.
- A rolagem acompanha a linha ativa dentro do editor e não move a página. O editor sai uma única vez, após a última linha, antes do build e da expansão do site.
- Os indicadores de serviços e build ocupam o espaço liberado pelo editor, preservando a prévia sem elementos por cima.
- O conteúdo é renderizado no servidor. Durante a prévia, sua área animada fica limitada à altura da tela; o restante da página não aumenta a superfície transformada.
- Ao concluir, o overlay é ocultado antes de restaurar estilos e rolagem. A largura reservada à barra de rolagem permanece estável. A página não ganha pin, spacer ou percurso adicional de scroll.
- As animações de rolagem são inicializadas depois da abertura, com dois frames para permitir a pintura da página final. Replays interrompem essas animações e as reinicializam após a abertura.
- Estados: idle, playing, skipping, finishing e complete. Scroll e inert são restaurados no término, pulo, falha e desmontagem.
- Controles de som e pulo acessíveis, foco contido e Escape para pular. Após interação por teclado, o foco volta ao elemento anterior ou à seção inicial, sem contorno decorativo. O título não recebe foco programático. Links e botões preservam seus indicadores de foco.
- Reproduz em toda entrada/recarregamento da home. Âncoras são respeitadas após a abertura; o botão de replay retorna ao início.
- O boot vem visível no HTML do servidor. JavaScript desativado libera a home via noscript; caso a hidratação não inicie, o overlay idle perde visibilidade após 10 s.
- Reduced motion dispensa a sequência. Alterar essa preferência durante a execução também libera a página.
- Falhas no carregamento/animação liberam a homepage. O watchdog limita o carregamento a 10 s; quando a timeline começa, passa a usar sua duração mais 2 s de margem para evitar cortar cenas.

## Organização

- `intro.tsx`: hero real do portfólio.
- `intro/cinematic-intro.tsx`: ciclo de vida, foco, bloqueio e eventos de início/conclusão.
- `intro/scenes.tsx`: editor, cursor e cenas decorativas, com aria-hidden.
- `intro/code.ts`: sequência de código e correspondência com os elementos reais.
- `intro/timeline.ts`: direção temporal e transformação da página real.
- `motion.tsx`: animações de rolagem, medidas após a conclusão.
- `sound-control.tsx` e `audio.ts`: áudio compartilhado com o header, ativado somente pelo usuário.

## Verificação

`tests/e2e/opening.spec.ts` cobre 1440, 768, 390 e 320 px, conclusão automática, refresh, replay, teclado, áudio, âncoras, menu mobile, reduced motion, JavaScript desativado e navegação para projetos.

Os testes também comparam a geometria do título na prévia com a página final, verificam continuidade inferior a 1 px no frame de liberação, limitam a prévia à altura da tela e confirmam que nenhum estilo temporário, inert ou foco no título permanece. Capturas da prévia e da página final são produzidas nos testes de desktop e mobile.

Testes adicionais em desktop e mobile verificam a digitação parcial, o texto completo de cada linha, a liberação de cada elemento somente após completar sua linha, a separação entre editor e prévia e a preservação dos mesmos elementos até a página final. Também verificam a remoção dos estilos temporários, inclusive ao pular a abertura durante a digitação.

Execute com o servidor local iniciado: `TEST_BASE_URL=http://localhost:3100 npx playwright test tests/e2e/opening.spec.ts`.
