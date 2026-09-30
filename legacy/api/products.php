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
        handle_products_list();
    }
    if ($method === 'POST' && ($action === '' || $action === 'create')) {
        require_csrf();
        handle_products_create();
    }
    if ($method === 'POST' && $action === 'update') {
        require_csrf();
        handle_products_update();
    }
    if ($method === 'POST' && $action === 'delete') {
        require_csrf();
        handle_products_delete();
    }
    if ($method === 'POST' && $action === 'reorder') {
        require_csrf();
        handle_products_reorder();
    }
    json_error('Ação inválida.', 400);
} catch (Throwable $e) {
    json_error('Erro ao processar produtos.', 500);
}

function handle_products_list(): void
{
    $all = ($_GET['all'] ?? '') === '1';
    $sql = 'SELECT * FROM produtos_servicos';
    if (!$all) {
        $sql .= ' WHERE ativo = 1';
    }
    $sql .= ' ORDER BY ordem ASC, nome ASC, id ASC';
    $rows = db()->query($sql)->fetchAll();
    json_response([
        'ok' => true,
        'products' => array_map('product_row_to_api', $rows),
    ]);
}

function parse_product_input(): array
{
    $name = trim((string) ($_POST['name'] ?? ''));
    $priceType = (string) ($_POST['priceType'] ?? 'fixo');
    $price = round((float) ($_POST['price'] ?? 0), 2);
    $description = trim((string) ($_POST['description'] ?? ''));
    $active = isset($_POST['active']) ? (($_POST['active'] === '1' || $_POST['active'] === 'true' || $_POST['active'] === true) ? 1 : 0) : 1;
    $order = (int) ($_POST['order'] ?? 0);

    if ($name === '' || mb_strlen($name) > 160) {
        json_error('Nome inválido.');
    }
    if (!in_array($priceType, PRODUCT_PRICE_TYPES, true)) {
        json_error('Tipo de preço inválido.');
    }
    if ($price < 0 || $price > 99999999.99) {
        json_error('Preço inválido.');
    }
    if (mb_strlen($description) > 5000) {
        json_error('Descrição muito longa.');
    }

    return compact('name', 'priceType', 'price', 'description', 'active', 'order');
}

function handle_products_create(): void
{
    $data = parse_product_input();
    $now = (new DateTimeImmutable('now'))->format('Y-m-d H:i:s');
    if ($data['order'] === 0) {
        $max = (int) db()->query('SELECT COALESCE(MAX(ordem), 0) FROM produtos_servicos')->fetchColumn();
        $data['order'] = $max + 10;
    }
    $stmt = db()->prepare(
        'INSERT INTO produtos_servicos
          (nome, tipo_preco, preco, descricao, ativo, ordem, criado_em, atualizado_em)
         VALUES
          (:nome, :tipo, :preco, :descricao, :ativo, :ordem, :criado, :atualizado)'
    );
    $stmt->execute([
        ':nome' => $data['name'],
        ':tipo' => $data['priceType'],
        ':preco' => $data['price'],
        ':descricao' => $data['description'] !== '' ? $data['description'] : null,
        ':ativo' => $data['active'],
        ':ordem' => $data['order'],
        ':criado' => $now,
        ':atualizado' => $now,
    ]);
    $id = (int) db()->lastInsertId();
    json_response(['ok' => true, 'product' => product_row_to_api(fetch_product($id))], 201);
}

function handle_products_update(): void
{
    $id = (int) ($_POST['id'] ?? 0);
    if ($id <= 0 || !fetch_product($id)) {
        json_error('Produto não encontrado.', 404);
    }
    $data = parse_product_input();
    $now = (new DateTimeImmutable('now'))->format('Y-m-d H:i:s');
    $stmt = db()->prepare(
        'UPDATE produtos_servicos SET
            nome = :nome,
            tipo_preco = :tipo,
            preco = :preco,
            descricao = :descricao,
            ativo = :ativo,
            ordem = :ordem,
            atualizado_em = :atualizado
         WHERE id = :id'
    );
    $stmt->execute([
        ':nome' => $data['name'],
        ':tipo' => $data['priceType'],
        ':preco' => $data['price'],
        ':descricao' => $data['description'] !== '' ? $data['description'] : null,
        ':ativo' => $data['active'],
        ':ordem' => $data['order'],
        ':atualizado' => $now,
        ':id' => $id,
    ]);
    json_response(['ok' => true, 'product' => product_row_to_api(fetch_product($id))]);
}

function handle_products_delete(): void
{
    $id = (int) ($_POST['id'] ?? 0);
    if ($id <= 0) {
        json_error('ID inválido.');
    }
    // Soft-delete: desativa para preservar histórico em itens
    $now = (new DateTimeImmutable('now'))->format('Y-m-d H:i:s');
    $stmt = db()->prepare(
        'UPDATE produtos_servicos SET ativo = 0, atualizado_em = :agora WHERE id = :id'
    );
    $stmt->execute([':agora' => $now, ':id' => $id]);
    json_response(['ok' => true]);
}

function handle_products_reorder(): void
{
    $raw = (string) ($_POST['ids'] ?? '[]');
    $ids = json_decode($raw, true);
    if (!is_array($ids) || !$ids) {
        json_error('Lista de ordem inválida.');
    }
    $now = (new DateTimeImmutable('now'))->format('Y-m-d H:i:s');
    $stmt = db()->prepare(
        'UPDATE produtos_servicos SET ordem = :ordem, atualizado_em = :agora WHERE id = :id'
    );
    $order = 10;
    foreach ($ids as $id) {
        $id = (int) $id;
        if ($id <= 0) {
            continue;
        }
        $stmt->execute([':ordem' => $order, ':agora' => $now, ':id' => $id]);
        $order += 10;
    }
    json_response(['ok' => true]);
}
