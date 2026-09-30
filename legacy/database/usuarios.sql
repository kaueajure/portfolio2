-- Tabela de usuários do painel (idempotente).

CREATE TABLE IF NOT EXISTS usuarios (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nome VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL,
  senha_hash VARCHAR(255) NULL DEFAULT NULL,
  criado_em DATETIME NOT NULL,
  atualizado_em DATETIME NOT NULL,
  ultimo_acesso DATETIME NULL DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_usuarios_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO usuarios (nome, email, senha_hash, criado_em, atualizado_em)
SELECT 'Kauê Ajure', 'kaueajure@gmail.com', NULL, NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM usuarios WHERE email = 'kaueajure@gmail.com'
);
