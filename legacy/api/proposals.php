<?php
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';
require __DIR__ . '/auth_lib.php';
require __DIR__ . '/proposals_lib.php';

send_security_headers();
require_api_auth();

$method = request_method();
$action = (string) ($_GET['action'] ?? $_POST['action'] ?? '');

try {
    if ($action === 'list' || ($method === 'GET' && $action === '')) {
        handle_proposals_list();
    }
    if ($action === 'get' && $method === 'GET') {
        handle_proposals_get();
    }
    if ($method === 'POST' && ($action === '' || $action === 'create')) {
        require_csrf();
        handle_proposals_create();
    }
    if ($method === 'POST' && $action === 'update') {
        require_csrf();
        handle_proposals_update();
    }
    if ($method === 'POST' && $action === 'set_items') {
        require_csrf();
        handle_proposals_set_items();
    }
    if ($method === 'POST' && $action === 'delete') {
        require_csrf();
        handle_proposals_delete();
    }
    if ($method === 'POST' && $action === 'duplicate') {
        require_csrf();
        handle_proposals_duplicate();
    }
    if ($method === 'POST' && $action === 'send') {
        require_csrf();
        handle_proposals_send();
    }
    if ($method === 'POST' && $action === 'cancel') {
        require_csrf();
        handle_proposals_cancel();
    }
    if ($action === 'pdf' && $method === 'GET') {
        require __DIR__ . '/proposal_pdf.php';
        handle_proposal_pdf_admin();
    }
    json_error('Ação inválida.', 400);
} catch (Throwable $e) {
    json_error('Erro ao processar propostas.', 500);
}

function handle_proposals_list(): void
{
    $status = trim((string) ($_GET['status'] ?? ''));
    $q = trim((string) ($_GET['q'] ?? ''));
    $sql = 'SELECT p.*, c.nome AS cliente_nome
            FROM propostas p
            LEFT JOIN clientes c ON c.id = p.cliente_id
            WHERE 1=1';
    $params = [];
    if ($status !== '' && in_array($status, PROPOSAL_STATUSES, true)) {
        $sql .= ' AND p.status = :status';
        $params[':status'] = $status;
    }
    if ($q !== '') {
        $sql .= ' AND (p.titulo LIKE :q OR p.codigo LIKE :q OR c.nome LIKE :q)';
        $params[':q'] = '%' . $q . '%';
    }
    $sql .= ' ORDER BY p.atualizada_em DESC, p.id DESC';
    $stmt = db()->prepare($sql);
    $stmt->execute($params);
    $rows = $stmt->fetchAll();
    $out = [];
    foreach ($rows as $row) {
        $row = proposal_mark_expired_if_needed($row);
        $viewers = fetch_proposal_viewers((int) $row['id']);
        $row['viewers'] = $viewers;
        $api = proposal_row_to_api($row);
        $api['viewerCount'] = count($viewers);
        $api['lastViewer'] = $viewers[0]['name'] ?? null;
        $out[] = $api;
    }
    json_response(['ok' => true, 'proposals' => $out]);
}

function handle_proposals_get(): void
{
    $id = (int) ($_GET['id'] ?? 0);
    $full = proposal_full_api($id);
    if (!$full) {
        json_error('Proposta não encontrada.', 404);
    }
    $row = fetch_proposal($id);
    if ($row) {
        proposal_mark_expired_if_needed($row);
        $full = proposal_full_api($id);
    }
    json_response(['ok' => true, 'proposal' => $full]);
}

function parse_proposal_header(): array
{
    $title = trim((string) ($_POST['title'] ?? ''));
    $clientId = trim((string) ($_POST['clientId'] ?? ''));
    $clientId = $clientId === '' ? null : (int) $clientId;
    $validUntil = trim((string) ($_POST['validUntil'] ?? ''));
    $validUntil = $validUntil === '' ? null : $validUntil;
    $conditions = trim((string) ($_POST['conditions'] ?? ''));
    $scope = trim((string) ($_POST['scope'] ?? ''));
    $discountValue = round((float) ($_POST['discountValue'] ?? 0), 2);
    $discountPercent = round((float) ($_POST['discountPercent'] ?? 0), 2);

    if ($title === '' || mb_strlen($title) > 200) {
        json_error('Título inválido.');
    }
    if ($clientId !== null) {
        if ($clientId <= 0) {
            json_error('Cliente inválido.');
        }
        $check = db()->prepare('SELECT id FROM clientes WHERE id = :id LIMIT 1');
        $check->execute([':id' => $clientId]);
        if (!$check->fetch()) {
            json_error('Cliente não encontrado.', 404);
        }
    }
    if ($validUntil !== null) {
        $dt = DateTimeImmutable::createFromFormat('Y-m-d', $validUntil);
        if (!$dt || $dt->format('Y-m-d') !== $validUntil) {
            json_error('Validade inválida.');
        }
    }
    if (mb_strlen($conditions) > 20000 || mb_strlen($scope) > 20000) {
        json_error('Texto de condições/escopo muito longo.');
    }
    if ($discountValue < 0 || $discountPercent < 0 || $discountPercent > 100) {
        json_error('Desconto inválido.');
    }
    if ($discountPercent > 0 && $discountValue > 0) {
        // Percentual vence
        $discountValue = 0.0;
    }

    return compact(
        'title',
        'clientId',
        'validUntil',
        'conditions',
        'scope',
        'discountValue',
        'discountPercent'
    );
}

function handle_proposals_create(): void
{
    $data = parse_proposal_header();
    $now = (new DateTimeImmutable('now'))->format('Y-m-d H:i:s');
    $code = proposal_next_code();
    $token = bin2hex(random_bytes(32));

    $stmt = db()->prepare(
        'INSERT INTO propostas
          (codigo, token_publico, cliente_id, titulo, status, validade,
           desconto_valor, desconto_percentual, subtotal, total,
           condicoes, escopo, criada_em, atualizada_em)
         VALUES
          (:codigo, :token, :cliente_id, :titulo, :status, :validade,
           :dv, :dp, 0, 0,
           :condicoes, :escopo, :criada, :atualizada)'
    );
    $stmt->execute([
        ':codigo' => $code,
        ':token' => $token,
        ':cliente_id' => $data['clientId'],
        ':titulo' => $data['title'],
        ':status' => 'rascunho',
        ':validade' => $data['validUntil'],
        ':dv' => $data['discountValue'],
        ':dp' => $data['discountPercent'],
        ':condicoes' => $data['conditions'] !== '' ? $data['conditions'] : null,
        ':escopo' => $data['scope'] !== '' ? $data['scope'] : null,
        ':criada' => $now,
        ':atualizada' => $now,
    ]);
    $id = (int) db()->lastInsertId();

    $itemsRaw = (string) ($_POST['items'] ?? '[]');
    $items = json_decode($itemsRaw, true);
    if (is_array($items) && $items) {
        proposal_replace_items($id, $items, $data['discountValue'], $data['discountPercent']);
    }

    json_response(['ok' => true, 'proposal' => proposal_full_api($id)], 201);
}

function handle_proposals_update(): void
{
    $id = (int) ($_POST['id'] ?? 0);
    $row = fetch_proposal($id);
    if (!$row) {
        json_error('Proposta não encontrada.', 404);
    }
    if (in_array($row['status'], ['aceita', 'cancelada'], true)) {
        json_error('Proposta não pode mais ser editada.');
    }

    $data = parse_proposal_header();
    $now = (new DateTimeImmutable('now'))->format('Y-m-d H:i:s');
    $stmt = db()->prepare(
        'UPDATE propostas SET
            cliente_id = :cliente_id,
            titulo = :titulo,
            validade = :validade,
            desconto_valor = :dv,
            desconto_percentual = :dp,
            condicoes = :condicoes,
            escopo = :escopo,
            atualizada_em = :atualizada
         WHERE id = :id'
    );
    $stmt->execute([
        ':cliente_id' => $data['clientId'],
        ':titulo' => $data['title'],
        ':validade' => $data['validUntil'],
        ':dv' => $data['discountValue'],
        ':dp' => $data['discountPercent'],
        ':condicoes' => $data['conditions'] !== '' ? $data['conditions'] : null,
        ':escopo' => $data['scope'] !== '' ? $data['scope'] : null,
        ':atualizada' => $now,
        ':id' => $id,
    ]);

    // Recalcula totais com desconto novo mantendo itens
    $items = fetch_proposal_items($id);
    $mapped = array_map(static function ($item) {
        return [
            'productId' => $item['produto_id'],
            'name' => $item['nome_snapshot'],
            'description' => $item['descricao_snapshot'] ?? '',
            'priceType' => $item['tipo_preco'],
            'unitPrice' => (float) $item['preco_unitario'],
            'quantity' => (float) $item['quantidade'],
        ];
    }, $items);
    proposal_replace_items($id, $mapped, $data['discountValue'], $data['discountPercent']);

    json_response(['ok' => true, 'proposal' => proposal_full_api($id)]);
}

function handle_proposals_set_items(): void
{
    $id = (int) ($_POST['id'] ?? 0);
    $row = fetch_proposal($id);
    if (!$row) {
        json_error('Proposta não encontrada.', 404);
    }
    if (in_array($row['status'], ['aceita', 'cancelada'], true)) {
        json_error('Proposta não pode mais ser editada.');
    }

    $itemsRaw = (string) ($_POST['items'] ?? '[]');
    $items = json_decode($itemsRaw, true);
    if (!is_array($items)) {
        json_error('Itens inválidos.');
    }

    $discountValue = round((float) ($_POST['discountValue'] ?? $row['desconto_valor']), 2);
    $discountPercent = round((float) ($_POST['discountPercent'] ?? $row['desconto_percentual']), 2);
    if ($discountPercent > 0) {
        $discountValue = 0.0;
    }

    proposal_replace_items($id, $items, $discountValue, $discountPercent);
    json_response(['ok' => true, 'proposal' => proposal_full_api($id)]);
}

function handle_proposals_delete(): void
{
    $id = (int) ($_POST['id'] ?? 0);
    $row = fetch_proposal($id);
    if (!$row) {
        json_error('Proposta não encontrada.', 404);
    }
    if (!in_array($row['status'], ['rascunho', 'cancelada'], true)) {
        json_error('Só é possível excluir rascunhos ou canceladas. Cancele antes.');
    }
    $stmt = db()->prepare('DELETE FROM propostas WHERE id = :id');
    $stmt->execute([':id' => $id]);
    json_response(['ok' => true]);
}

function handle_proposals_duplicate(): void
{
    $id = (int) ($_POST['id'] ?? 0);
    $row = fetch_proposal($id);
    if (!$row) {
        json_error('Proposta não encontrada.', 404);
    }
    $items = fetch_proposal_items($id);
    $now = (new DateTimeImmutable('now'))->format('Y-m-d H:i:s');
    $code = proposal_next_code();
    $token = bin2hex(random_bytes(32));

    $stmt = db()->prepare(
        'INSERT INTO propostas
          (codigo, token_publico, cliente_id, titulo, status, validade,
           desconto_valor, desconto_percentual, subtotal, total,
           condicoes, escopo, criada_em, atualizada_em)
         VALUES
          (:codigo, :token, :cliente_id, :titulo, :status, :validade,
           :dv, :dp, 0, 0,
           :condicoes, :escopo, :criada, :atualizada)'
    );
    $stmt->execute([
        ':codigo' => $code,
        ':token' => $token,
        ':cliente_id' => $row['cliente_id'],
        ':titulo' => $row['titulo'] . ' (cópia)',
        ':status' => 'rascunho',
        ':validade' => $row['validade'],
        ':dv' => $row['desconto_valor'],
        ':dp' => $row['desconto_percentual'],
        ':condicoes' => $row['condicoes'],
        ':escopo' => $row['escopo'],
        ':criada' => $now,
        ':atualizada' => $now,
    ]);
    $newId = (int) db()->lastInsertId();
    $mapped = array_map(static function ($item) {
        return [
            'productId' => $item['produto_id'],
            'name' => $item['nome_snapshot'],
            'description' => $item['descricao_snapshot'] ?? '',
            'priceType' => $item['tipo_preco'],
            'unitPrice' => (float) $item['preco_unitario'],
            'quantity' => (float) $item['quantidade'],
        ];
    }, $items);
    proposal_replace_items(
        $newId,
        $mapped,
        (float) $row['desconto_valor'],
        (float) $row['desconto_percentual']
    );

    json_response(['ok' => true, 'proposal' => proposal_full_api($newId)], 201);
}

function handle_proposals_send(): void
{
    $id = (int) ($_POST['id'] ?? 0);
    $row = fetch_proposal($id);
    if (!$row) {
        json_error('Proposta não encontrada.', 404);
    }
    if (!in_array($row['status'], ['rascunho', 'enviada', 'visualizada', 'recusada', 'expirada'], true)) {
        json_error('Status atual não permite envio.');
    }
    $items = fetch_proposal_items($id);
    if (!$items) {
        json_error('Adicione ao menos um item antes de enviar.');
    }
    if ((float) $row['total'] <= 0) {
        json_error('Total da proposta deve ser maior que zero.');
    }

    $now = (new DateTimeImmutable('now'))->format('Y-m-d H:i:s');
    $stmt = db()->prepare(
        'UPDATE propostas SET
            status = :status,
            visualizada_em = NULL,
            respondida_em = NULL,
            resposta_cliente = NULL,
            atualizada_em = :agora
         WHERE id = :id'
    );
    $stmt->execute([
        ':status' => 'enviada',
        ':agora' => $now,
        ':id' => $id,
    ]);

    $full = proposal_full_api($id);
    json_response(['ok' => true, 'proposal' => $full]);
}

function handle_proposals_cancel(): void
{
    $id = (int) ($_POST['id'] ?? 0);
    $row = fetch_proposal($id);
    if (!$row) {
        json_error('Proposta não encontrada.', 404);
    }
    if ($row['status'] === 'aceita') {
        json_error('Proposta aceita não pode ser cancelada.');
    }
    $now = (new DateTimeImmutable('now'))->format('Y-m-d H:i:s');
    $stmt = db()->prepare(
        'UPDATE propostas SET status = :status, atualizada_em = :agora WHERE id = :id'
    );
    $stmt->execute([':status' => 'cancelada', ':agora' => $now, ':id' => $id]);
    json_response(['ok' => true, 'proposal' => proposal_full_api($id)]);
}
