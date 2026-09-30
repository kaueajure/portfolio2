-- Propostas: catálogo, propostas e itens (idempotente).
-- Após criar as tabelas, rode o seed de produtos (ou use o painel Catálogo).

CREATE TABLE IF NOT EXISTS produtos_servicos (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nome VARCHAR(160) NOT NULL,
  tipo_preco ENUM('fixo', 'hora') NOT NULL DEFAULT 'fixo',
  preco DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  descricao TEXT NULL,
  ativo TINYINT(1) NOT NULL DEFAULT 1,
  ordem INT NOT NULL DEFAULT 0,
  criado_em DATETIME NOT NULL,
  atualizado_em DATETIME NOT NULL,
  PRIMARY KEY (id),
  KEY idx_produtos_ativo_ordem (ativo, ordem)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS propostas (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  codigo VARCHAR(32) NOT NULL,
  token_publico CHAR(64) NOT NULL,
  cliente_id INT UNSIGNED NULL DEFAULT NULL,
  titulo VARCHAR(200) NOT NULL,
  status ENUM(
    'rascunho',
    'enviada',
    'visualizada',
    'aceita',
    'recusada',
    'expirada',
    'cancelada'
  ) NOT NULL DEFAULT 'rascunho',
  validade DATE NULL DEFAULT NULL,
  desconto_valor DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  desconto_percentual DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
  subtotal DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  total DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  condicoes TEXT NULL,
  escopo TEXT NULL,
  visualizada_em DATETIME NULL DEFAULT NULL,
  respondida_em DATETIME NULL DEFAULT NULL,
  resposta_cliente TEXT NULL,
  criada_em DATETIME NOT NULL,
  atualizada_em DATETIME NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_propostas_codigo (codigo),
  UNIQUE KEY uq_propostas_token (token_publico),
  KEY idx_propostas_status (status),
  KEY idx_propostas_cliente (cliente_id),
  KEY idx_propostas_atualizada (atualizada_em),
  CONSTRAINT fk_propostas_cliente
    FOREIGN KEY (cliente_id) REFERENCES clientes(id)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS proposta_itens (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  proposta_id INT UNSIGNED NOT NULL,
  produto_id INT UNSIGNED NULL DEFAULT NULL,
  nome_snapshot VARCHAR(160) NOT NULL,
  descricao_snapshot TEXT NULL,
  tipo_preco ENUM('fixo', 'hora') NOT NULL DEFAULT 'fixo',
  preco_unitario DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  quantidade DECIMAL(12, 2) NOT NULL DEFAULT 1.00,
  total_linha DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  ordem INT NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_itens_proposta (proposta_id, ordem),
  CONSTRAINT fk_itens_proposta
    FOREIGN KEY (proposta_id) REFERENCES propostas(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_itens_produto
    FOREIGN KEY (produto_id) REFERENCES produtos_servicos(id)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS proposta_visualizacoes (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  proposta_id INT UNSIGNED NOT NULL,
  nome VARCHAR(120) NOT NULL,
  visualizada_em DATETIME NOT NULL,
  PRIMARY KEY (id),
  KEY idx_viz_proposta (proposta_id, visualizada_em),
  CONSTRAINT fk_viz_proposta
    FOREIGN KEY (proposta_id) REFERENCES propostas(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
