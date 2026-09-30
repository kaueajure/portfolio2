-- Instalação inicial apenas. Nenhuma exclusão de tabela ou registro.
CREATE TABLE IF NOT EXISTS clientes (
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
