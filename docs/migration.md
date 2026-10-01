# Migração de dados para Supabase

A migration PostgreSQL em `supabase/migrations` prepara uma instalação vazia. Ela mantém nomes lógicos de tabelas e colunas, índices, chaves estrangeiras e valores numéricos `numeric(12,2)`. IDs inteiros usam `IDENTITY` e inserts retornam o ID com `RETURNING`. A sequência anual de propostas continua transacional.

Para migrar uma instalação existente, faça primeiro um backup verificável dos dados e documentos. Exporte as tabelas de negócio em formato intermediário como CSV, carregue no PostgreSQL respeitando a ordem de chaves estrangeiras (`clientes`, `usuarios`, `produtos_servicos`, `notas`, `propostas`, `proposta_itens`, `proposta_visualizacoes`) e ajuste as sequences `IDENTITY` com `setval` após inserir IDs históricos. Preserve `token_publico`, `codigo`, hashes de senha e valores de datas. As tabelas de sessão e rate limit podem começar vazias; usuários precisarão entrar novamente. Valide contagens, totais, relações e propostas antes de habilitar a aplicação.

Para documentos, envie cada objeto para o bucket privado `private-documents` com a chave já registrada em `clientes.documento_caminho`. A chave deve conter apenas letras, números, `_`, `-` e `.` e não pode conter `..`. Confira um download administrativo de cada tipo de arquivo. Não publique o bucket ou gere links públicos.

A migração de dados históricos depende de acesso à origem e não é feita pelo `npm run db:migrate`, que aplica somente o schema. Suspenda escritas na origem durante a exportação final para evitar divergências.
