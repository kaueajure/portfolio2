-- Notas do painel (idempotente).

CREATE TABLE IF NOT EXISTS notas (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  cliente_id INT UNSIGNED NULL DEFAULT NULL,
  titulo VARCHAR(160) NOT NULL,
  conteudo TEXT NOT NULL,
  criada_em DATETIME NOT NULL,
  atualizada_em DATETIME NOT NULL,
  PRIMARY KEY (id),
  KEY idx_notas_cliente (cliente_id),
  KEY idx_notas_atualizada (atualizada_em),
  CONSTRAINT fk_notas_cliente
    FOREIGN KEY (cliente_id) REFERENCES clientes(id)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
