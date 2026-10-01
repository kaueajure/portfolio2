# Ferramentas PDF na Vercel

| Ferramenta | Estado | Implementação ou alternativa |
|---|---|---|
| Unir, separar, marca d'água | Disponível | `pdf-lib`, em memória. |
| Imagens para PDF | Disponível | `sharp` e `pdf-lib`, em memória. |
| PDF de proposta | Disponível | `pdf-lib` com fonte incluída no repositório. |
| Arquivo Office para PDF | Indisponível | Requer motor de conversão equivalente ao LibreOffice em serviço externo. |
| PDF para imagens | Indisponível | Requer rasterizador como Poppler/Ghostscript em serviço externo. |
| PDF para texto / Word | Disponível para texto selecionável | `pdfjs-dist` extrai texto; `docx` gera Word simples. Não preserva layout. PDFs digitalizados precisam de OCR externo. |
| Compressão | Indisponível | Requer otimização de imagens/fontes e regravação confiável, por exemplo serviço externo. |
| Proteger / desbloquear | Indisponível | Requer implementação AES-256 interoperável equivalente a qpdf em serviço externo. |
| OCR | Indisponível | Requer rasterização e reconhecimento de português/inglês em serviço externo. |

A API anuncia somente as seis operações disponíveis. O painel mostra explicitamente as demais como indisponíveis. Nenhuma operação executa binários do sistema. Resultados ficam por uma hora em `private-pdf-jobs`, acessíveis apenas ao usuário que os gerou. A limpeza usa o cron da Vercel. Cada entrada e saída fica limitada a 4 MB pela passagem através da Function; PDFs de até 300 páginas são aceitos dentro desse limite.

Para restaurar as seis operações restantes, integre um serviço externo com API autenticada, isolamento por job e processamento assíncrono. Não coloque conversões demoradas dentro de uma Function síncrona.
