<?php
declare(strict_types=1);

/**
 * Helpers compartilhados de propostas (cálculo, mapeamento, fetch).
 */

const PROPOSAL_STATUSES = [
    'rascunho',
    'enviada',
    'visualizada',
    'aceita',
    'recusada',
    'expirada',
    'cancelada',
];

const PRODUCT_PRICE_TYPES = ['fixo', 'hora'];

function product_row_to_api(array $row): array
{
    return [
        'id' => (int) $row['id'],
        'name' => $row['nome'],
        'priceType' => $row['tipo_preco'],
        'price' => (float) $row['preco'],
        'description' => $row['descricao'] ?? '',
        'active' => (bool) (int) $row['ativo'],
        'order' => (int) $row['ordem'],
        'createdAt' => $row['criado_em'],
        'updatedAt' => $row['atualizado_em'],
    ];
}

function proposal_item_row_to_api(array $row): array
{
    return [
        'id' => (int) $row['id'],
        'proposalId' => (int) $row['proposta_id'],
        'productId' => $row['produto_id'] !== null ? (int) $row['produto_id'] : null,
        'name' => $row['nome_snapshot'],
        'description' => $row['descricao_snapshot'] ?? '',
        'priceType' => $row['tipo_preco'],
        'unitPrice' => (float) $row['preco_unitario'],
        'quantity' => (float) $row['quantidade'],
        'lineTotal' => (float) $row['total_linha'],
        'order' => (int) $row['ordem'],
    ];
}

function proposal_row_to_api(array $row, array $items = []): array
{
    $status = (string) $row['status'];
    $validUntil = $row['validade'] ?? null;
    $expired = proposal_is_expired($row);

    return [
        'id' => (int) $row['id'],
        'code' => $row['codigo'],
        'publicToken' => $row['token_publico'],
        'publicUrl' => '../proposta/?t=' . rawurlencode((string) $row['token_publico']),
        'clientId' => $row['cliente_id'] !== null ? (int) $row['cliente_id'] : null,
        'clientName' => $row['cliente_nome'] ?? null,
        'title' => $row['titulo'],
        'status' => $status,
        'validUntil' => $validUntil,
        'isExpired' => $expired,
        'discountValue' => (float) $row['desconto_valor'],
        'discountPercent' => (float) $row['desconto_percentual'],
        'subtotal' => (float) $row['subtotal'],
        'total' => (float) $row['total'],
        'conditions' => $row['condicoes'] ?? '',
        'scope' => $row['escopo'] ?? '',
        'viewedAt' => $row['visualizada_em'] ?? null,
        'respondedAt' => $row['respondida_em'] ?? null,
        'clientResponse' => $row['resposta_cliente'] ?? '',
        'viewers' => $row['viewers'] ?? [],
        'createdAt' => $row['criada_em'],
        'updatedAt' => $row['atualizada_em'],
        'items' => $items,
        'canPublicView' => !in_array($status, ['rascunho', 'cancelada'], true),
    ];
}

function proposal_is_expired(array $row): bool
{
    if (empty($row['validade'])) {
        return false;
    }
    if (in_array($row['status'], ['aceita', 'recusada', 'cancelada'], true)) {
        return false;
    }
    $today = (new DateTimeImmutable('today'))->format('Y-m-d');
    return (string) $row['validade'] < $today;
}

function proposal_line_total(string $priceType, float $unitPrice, float $quantity): float
{
    if ($unitPrice < 0 || $quantity < 0) {
        return 0.0;
    }
    return round($unitPrice * $quantity, 2);
}

/**
 * @param list<array{unitPrice:float,quantity:float,priceType?:string}> $lines
 * @return array{subtotal:float,discount:float,total:float,discountValue:float,discountPercent:float}
 */
function proposal_compute_totals(array $lines, float $discountValue, float $discountPercent): array
{
    $subtotal = 0.0;
    foreach ($lines as $line) {
        $subtotal += proposal_line_total(
            (string) ($line['priceType'] ?? 'fixo'),
            (float) $line['unitPrice'],
            (float) $line['quantity']
        );
    }
    $subtotal = round($subtotal, 2);

    $discountValue = max(0.0, round($discountValue, 2));
    $discountPercent = max(0.0, min(100.0, round($discountPercent, 2)));

    // Nunca os dois ao mesmo tempo: percentual tem prioridade se > 0
    if ($discountPercent > 0) {
        $discountValue = 0.0;
        $discount = round($subtotal * ($discountPercent / 100), 2);
    } else {
        $discountPercent = 0.0;
        $discount = min($discountValue, $subtotal);
        $discountValue = $discount;
    }

    $total = max(0.0, round($subtotal - $discount, 2));

    return [
        'subtotal' => $subtotal,
        'discount' => $discount,
        'total' => $total,
        'discountValue' => $discountValue,
        'discountPercent' => $discountPercent,
    ];
}

function fetch_product(int $id): ?array
{
    $stmt = db()->prepare('SELECT * FROM produtos_servicos WHERE id = :id LIMIT 1');
    $stmt->execute([':id' => $id]);
    $row = $stmt->fetch();
    return $row ?: null;
}

function fetch_proposal(int $id): ?array
{
    $stmt = db()->prepare(
        'SELECT p.*, c.nome AS cliente_nome
         FROM propostas p
         LEFT JOIN clientes c ON c.id = p.cliente_id
         WHERE p.id = :id LIMIT 1'
    );
    $stmt->execute([':id' => $id]);
    $row = $stmt->fetch();
    return $row ?: null;
}

function fetch_proposal_by_token(string $token): ?array
{
    if (!preg_match('/^[a-f0-9]{64}$/', $token)) {
        return null;
    }
    $stmt = db()->prepare(
        'SELECT p.*, c.nome AS cliente_nome
         FROM propostas p
         LEFT JOIN clientes c ON c.id = p.cliente_id
         WHERE p.token_publico = :token LIMIT 1'
    );
    $stmt->execute([':token' => $token]);
    $row = $stmt->fetch();
    return $row ?: null;
}

/** @return list<array> */
function fetch_proposal_items(int $proposalId): array
{
    $stmt = db()->prepare(
        'SELECT * FROM proposta_itens WHERE proposta_id = :id ORDER BY ordem ASC, id ASC'
    );
    $stmt->execute([':id' => $proposalId]);
    return $stmt->fetchAll();
}

function proposal_full_api(int $id): ?array
{
    $row = fetch_proposal($id);
    if (!$row) {
        return null;
    }
    $row['viewers'] = fetch_proposal_viewers($id);
    $items = array_map('proposal_item_row_to_api', fetch_proposal_items($id));
    return proposal_row_to_api($row, $items);
}

/** @return list<array{name:string,viewedAt:string}> */
function fetch_proposal_viewers(int $proposalId): array
{
    $stmt = db()->prepare(
        'SELECT nome, visualizada_em
         FROM proposta_visualizacoes
         WHERE proposta_id = :id
         ORDER BY visualizada_em DESC, id DESC
         LIMIT 50'
    );
    $stmt->execute([':id' => $proposalId]);
    $out = [];
    foreach ($stmt->fetchAll() as $row) {
        $out[] = [
            'name' => (string) $row['nome'],
            'viewedAt' => (string) $row['visualizada_em'],
        ];
    }
    return $out;
}

function proposal_register_view(int $proposalId, string $name): void
{
    $name = trim($name);
    if ($name === '' || mb_strlen($name) < 2 || mb_strlen($name) > 120) {
        json_error('Informe seu nome (mínimo 2 caracteres).');
    }
    $now = (new DateTimeImmutable('now'))->format('Y-m-d H:i:s');
    $ins = db()->prepare(
        'INSERT INTO proposta_visualizacoes (proposta_id, nome, visualizada_em)
         VALUES (:proposta_id, :nome, :quando)'
    );
    $ins->execute([
        ':proposta_id' => $proposalId,
        ':nome' => $name,
        ':quando' => $now,
    ]);

    $row = fetch_proposal($proposalId);
    if (!$row) {
        return;
    }
    if ($row['status'] === 'enviada') {
        $upd = db()->prepare(
            'UPDATE propostas SET
                status = :status,
                visualizada_em = :vista,
                atualizada_em = :agora
             WHERE id = :id'
        );
        $upd->execute([
            ':status' => 'visualizada',
            ':vista' => $now,
            ':agora' => $now,
            ':id' => $proposalId,
        ]);
    } elseif (empty($row['visualizada_em'])) {
        $upd = db()->prepare(
            'UPDATE propostas SET visualizada_em = :vista, atualizada_em = :agora WHERE id = :id'
        );
        $upd->execute([
            ':vista' => $now,
            ':agora' => $now,
            ':id' => $proposalId,
        ]);
    }
}

function proposal_next_code(): string
{
    $year = (new DateTimeImmutable('now'))->format('Y');
    $prefix = 'PROP-' . $year . '-';
    $stmt = db()->prepare(
        'SELECT codigo FROM propostas WHERE codigo LIKE :pfx ORDER BY id DESC LIMIT 1'
    );
    $stmt->execute([':pfx' => $prefix . '%']);
    $last = $stmt->fetchColumn();
    $n = 1;
    if (is_string($last) && preg_match('/PROP-\d{4}-(\d+)$/', $last, $m)) {
        $n = (int) $m[1] + 1;
    }
    return $prefix . str_pad((string) $n, 3, '0', STR_PAD_LEFT);
}

function proposal_mark_expired_if_needed(array $row): array
{
    if (!proposal_is_expired($row)) {
        return $row;
    }
    if ($row['status'] === 'expirada') {
        return $row;
    }
    if (in_array($row['status'], ['aceita', 'recusada', 'cancelada', 'rascunho'], true)) {
        return $row;
    }
    $now = (new DateTimeImmutable('now'))->format('Y-m-d H:i:s');
    $stmt = db()->prepare(
        'UPDATE propostas SET status = :status, atualizada_em = :agora WHERE id = :id'
    );
    $stmt->execute([
        ':status' => 'expirada',
        ':agora' => $now,
        ':id' => (int) $row['id'],
    ]);
    $row['status'] = 'expirada';
    $row['atualizada_em'] = $now;
    return $row;
}

function proposal_sync_client_on_accept(array $proposal): void
{
    $clientId = $proposal['cliente_id'] !== null ? (int) $proposal['cliente_id'] : null;
    if ($clientId === null || $clientId <= 0) {
        return;
    }
    $today = (new DateTimeImmutable('today'))->format('Y-m-d');
    $now = (new DateTimeImmutable('now'))->format('Y-m-d H:i:s');
    $total = (float) $proposal['total'];
    $validUntil = $proposal['validade'] ?? null;

    $stmt = db()->prepare(
        'UPDATE clientes SET
            valor_orcamento = :orcamento,
            valor_vendido = :vendido,
            status = :status,
            data_aprovacao = :aprovacao,
            validade_orcamento = COALESCE(:validade, validade_orcamento),
            atualizado_em = :agora
         WHERE id = :id'
    );
    $stmt->execute([
        ':orcamento' => $total,
        ':vendido' => $total,
        ':status' => 'aprovado',
        ':aprovacao' => $today,
        ':validade' => $validUntil,
        ':agora' => $now,
        ':id' => $clientId,
    ]);
}

/**
 * Normaliza e persiste itens + totais.
 * @param list<array> $rawItems
 */
function proposal_replace_items(int $proposalId, array $rawItems, float $discountValue, float $discountPercent): void
{
    $normalized = [];
    $order = 0;
    foreach ($rawItems as $raw) {
        if (!is_array($raw)) {
            continue;
        }
        $name = trim((string) ($raw['name'] ?? $raw['nome'] ?? ''));
        if ($name === '' || mb_strlen($name) > 160) {
            json_error('Nome do item inválido.');
        }
        $priceType = (string) ($raw['priceType'] ?? $raw['tipo_preco'] ?? 'fixo');
        if (!in_array($priceType, PRODUCT_PRICE_TYPES, true)) {
            json_error('Tipo de preço inválido.');
        }
        $unitPrice = round((float) ($raw['unitPrice'] ?? $raw['preco_unitario'] ?? 0), 2);
        $quantity = round((float) ($raw['quantity'] ?? $raw['quantidade'] ?? 1), 2);
        if ($unitPrice < 0 || $quantity <= 0) {
            json_error('Preço ou quantidade inválidos.');
        }
        $productId = $raw['productId'] ?? $raw['produto_id'] ?? null;
        $productId = $productId === null || $productId === '' ? null : (int) $productId;
        if ($productId !== null && $productId <= 0) {
            $productId = null;
        }
        $description = trim((string) ($raw['description'] ?? $raw['descricao'] ?? ''));
        if (mb_strlen($description) > 5000) {
            json_error('Descrição do item muito longa.');
        }
        $lineTotal = proposal_line_total($priceType, $unitPrice, $quantity);
        $normalized[] = [
            'productId' => $productId,
            'name' => $name,
            'description' => $description,
            'priceType' => $priceType,
            'unitPrice' => $unitPrice,
            'quantity' => $quantity,
            'lineTotal' => $lineTotal,
            'order' => $order++,
        ];
    }

    if (count($normalized) > 100) {
        json_error('Máximo de 100 itens por proposta.');
    }

    $totals = proposal_compute_totals($normalized, $discountValue, $discountPercent);
    $now = (new DateTimeImmutable('now'))->format('Y-m-d H:i:s');
    $pdo = db();
    $pdo->beginTransaction();
    try {
        $pdo->prepare('DELETE FROM proposta_itens WHERE proposta_id = :id')->execute([':id' => $proposalId]);
        $ins = $pdo->prepare(
            'INSERT INTO proposta_itens
              (proposta_id, produto_id, nome_snapshot, descricao_snapshot, tipo_preco, preco_unitario, quantidade, total_linha, ordem)
             VALUES
              (:proposta_id, :produto_id, :nome, :descricao, :tipo, :preco, :qtd, :total, :ordem)'
        );
        foreach ($normalized as $item) {
            $ins->execute([
                ':proposta_id' => $proposalId,
                ':produto_id' => $item['productId'],
                ':nome' => $item['name'],
                ':descricao' => $item['description'] !== '' ? $item['description'] : null,
                ':tipo' => $item['priceType'],
                ':preco' => $item['unitPrice'],
                ':qtd' => $item['quantity'],
                ':total' => $item['lineTotal'],
                ':ordem' => $item['order'],
            ]);
        }
        $upd = $pdo->prepare(
            'UPDATE propostas SET
                desconto_valor = :dv,
                desconto_percentual = :dp,
                subtotal = :sub,
                total = :total,
                atualizada_em = :agora
             WHERE id = :id'
        );
        $upd->execute([
            ':dv' => $totals['discountValue'],
            ':dp' => $totals['discountPercent'],
            ':sub' => $totals['subtotal'],
            ':total' => $totals['total'],
            ':agora' => $now,
            ':id' => $proposalId,
        ]);
        $pdo->commit();
    } catch (Throwable $e) {
        $pdo->rollBack();
        throw $e;
    }
}

function proposal_public_payload(array $row, array $items): array
{
    $api = proposal_row_to_api($row, array_map('proposal_item_row_to_api', $items));
    // Não expor token de novo no corpo além do necessário; URL já conhecida
    unset($api['publicToken']);
    $api['publicUrl'] = null;
    return $api;
}
