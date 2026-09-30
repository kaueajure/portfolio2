# Relatório de segurança — Painel Portfolio

**Atualizado:** correções aplicadas em 2025-09-25.

## Status das correções

| ID | Problema | Status |
|----|----------|--------|
| C1 | Setup público de senha | Mitigado — exige `setup_token` em config (vazio = desligado) |
| C2 | Config na web root | Mitigado — `config/.htaccess` deny all (ainda: trocar senha MySQL se vazou) |
| A1 | CSRF | Corrigido — token de sessão + header/campo |
| A2 | Uploads públicos | Corrigido — `Require all denied` + só via `document.php` |
| A3 | Rate limit | Corrigido — login/setup limitados por IP |
| A4 | Enumeração no check | Corrigido — endpoint `check` removido |
| A5 | Upload amplo | Corrigido — allowlist (inclui xlsx) + nosniff |
| M1 | Logout GET | Corrigido — só POST + CSRF |
| M2 | Senha fraca | Corrigido — mín. 12 no setup |
| M3 | Headers | Corrigido — XFO, nosniff, referrer, CSP frame |
| M4 | config HTTP | Corrigido — deny all |

## Pendência operacional

Trocar a senha do MySQL na Hostinger se ela já foi exposta em chat/logs, e atualizar `config/database.php`.
