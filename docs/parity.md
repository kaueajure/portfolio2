# Estado funcional

Site público, painel, login, clientes, agenda, notas, catálogo, propostas, itens, histórico, visualização e aceite público, uploads e downloads privados e PDF de propostas permanecem implementados. Transações de proposta e sessão usam PostgreSQL. Os arquivos privados ficam em Supabase Storage.

A bancada PDF oferece seis operações nativas: unir, separar, imagens para PDF, PDF para texto/Word e marca d'água. Seis operações dependentes de conversores ou criptografia externos estão indisponíveis e descritas em [pdf.md](pdf.md). Uploads e respostas pela Vercel têm limite de 4 MB.

Validação de deploy e migração de dados reais exige credenciais e ambiente externos; o build local sozinho não testa esses serviços.
