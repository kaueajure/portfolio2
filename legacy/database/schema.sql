-- Schema do painel (português) — estrutura completa.

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS clients;
DROP TABLE IF EXISTS clientes;

SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE clientes (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nome VARCHAR(120) NOT NULL,
  telefone VARCHAR(30) NULL DEFAULT NULL,
  email VARCHAR(120) NULL DEFAULT NULL,
  data_compra DATE NOT NULL,
  valor_orcamento DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  valor_vendido DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  status ENUM(
    'orcamento',
    'aprovado',
    'em_andamento',
    'entregue',
    'cancelado'
  ) NOT NULL DEFAULT 'orcamento',
  forma_pagamento ENUM('a_vista', 'mensal', 'parcelas') NOT NULL DEFAULT 'a_vista',

  -- À vista
  data_pagamento_vista DATE NULL DEFAULT NULL,

  -- Mensal
  valor_mensal DECIMAL(12, 2) NULL DEFAULT NULL,
  dia_vencimento TINYINT UNSIGNED NULL DEFAULT NULL,
  data_inicio_mensalidade DATE NULL DEFAULT NULL,

  -- Parcelas
  qtd_parcelas INT UNSIGNED NULL DEFAULT NULL,
  valor_parcela DECIMAL(12, 2) NULL DEFAULT NULL,
  data_primeira_parcela DATE NULL DEFAULT NULL,
  parcelas_pagas INT UNSIGNED NULL DEFAULT 0,

  -- Status
  validade_orcamento DATE NULL DEFAULT NULL,
  data_aprovacao DATE NULL DEFAULT NULL,
  previsao_entrega DATE NULL DEFAULT NULL,
  data_entrega DATE NULL DEFAULT NULL,
  motivo_cancelamento VARCHAR(255) NULL DEFAULT NULL,

  dias_manutencao INT UNSIGNED NOT NULL DEFAULT 90,
  dias_renovacao INT UNSIGNED NOT NULL DEFAULT 365,
  observacoes TEXT NULL DEFAULT NULL,
  documento_caminho VARCHAR(255) NULL DEFAULT NULL,
  documento_nome VARCHAR(255) NULL DEFAULT NULL,
  documento_tipo VARCHAR(120) NULL DEFAULT NULL,
  criado_em DATETIME NOT NULL,
  atualizado_em DATETIME NOT NULL,
  PRIMARY KEY (id),
  KEY idx_clientes_status (status),
  KEY idx_clientes_data_compra (data_compra),
  KEY idx_clientes_nome (nome),
  KEY idx_clientes_forma_pagamento (forma_pagamento)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
