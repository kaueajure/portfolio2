<?php
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';
require __DIR__ . '/auth_lib.php';

send_security_headers();
require_api_auth();

$method = request_method();
$action = (string) ($_GET['action'] ?? $_POST['action'] ?? '');

try {
    if ($action === 'list' || ($method === 'GET' && $action === '')) {
        handle_notes_list();
    }
    if ($method === 'POST' && ($action === '' || $action === 'create')) {
        require_csrf();
        handle_notes_create();
    }
    if (in_array($method, ['PUT', 'PATCH'], true) || ($method === 'POST' && $action === 'update')) {
        require_csrf();
        handle_notes_update();
    }
    if ($method === 'DELETE' || ($method === 'POST' && $action === 'delete')) {
        require_csrf();
        handle_notes_delete();
    }
    json_error('Ação inválida.', 400);
} catch (Throwable $e) {
    json_error('Erro ao processar notas.', 500);
}

function note_row_to_api(array $row): array
{
    return [
        'id' => (int) $row['id'],
        'clientId' => $row['cliente_id'] !== null ? (int) $row['cliente_id'] : null,
        'clientName' => $row['cliente_nome'] ?? null,
        'title' => $row['titulo'],
        'content' => $row['conteudo'],
        'createdAt' => $row['criada_em'],
        'updatedAt' => $row['atualizada_em'],
    ];
}

function handle_notes_list(): void
{
    $pdo = db();
    $stmt = $pdo->query(
        'SELECT n.*, c.nome AS cliente_nome
         FROM notas n
         LEFT JOIN clientes c ON c.id = n.cliente_id
         ORDER BY n.atualizada_em DESC, n.id DESC'
    );
    $notes = array_map('note_row_to_api', $stmt->fetchAll());
    json_response(['ok' => true, 'notes' => $notes]);
}

function handle_notes_create(): void
{
    $title = trim((string) ($_POST['title'] ?? ''));
    $content = trim((string) ($_POST['content'] ?? ''));
    $clientId = trim((string) ($_POST['clientId'] ?? ''));
    $clientId = $clientId === '' ? null : (int) $clientId;

    if ($title === '' || mb_strlen($title) > 160) {
        json_error('Título inválido.');
    }
    if ($content === '' || mb_strlen($content) > 20000) {
        json_error('Conteúdo inválido.');
    }
    if ($clientId !== null && $clientId <= 0) {
        json_error('Cliente inválido.');
    }
    if ($clientId !== null) {
        $check = db()->prepare('SELECT id FROM clientes WHERE id = :id LIMIT 1');
        $check->execute([':id' => $clientId]);
        if (!$check->fetch()) {
            json_error('Cliente não encontrado.', 404);
        }
    }

    $now = (new DateTimeImmutable('now'))->format('Y-m-d H:i:s');
    $stmt = db()->prepare(
        'INSERT INTO notas (cliente_id, titulo, conteudo, criada_em, atualizada_em)
         VALUES (:cliente_id, :titulo, :conteudo, :criada, :atualizada)'
    );
    $stmt->execute([
        ':cliente_id' => $clientId,
        ':titulo' => $title,
        ':conteudo' => $content,
        ':criada' => $now,
        ':atualizada' => $now,
    ]);

    $id = (int) db()->lastInsertId();
    $row = fetch_note($id);
    json_response(['ok' => true, 'note' => note_row_to_api($row)], 201);
}

function handle_notes_update(): void
{
    $id = (int) ($_POST['id'] ?? 0);
    if ($id <= 0) {
        json_error('ID inválido.');
    }
    if (!fetch_note($id)) {
        json_error('Nota não encontrada.', 404);
    }

    $title = trim((string) ($_POST['title'] ?? ''));
    $content = trim((string) ($_POST['content'] ?? ''));
    $clientId = trim((string) ($_POST['clientId'] ?? ''));
    $clientId = $clientId === '' ? null : (int) $clientId;

    if ($title === '' || mb_strlen($title) > 160) {
        json_error('Título inválido.');
    }
    if ($content === '' || mb_strlen($content) > 20000) {
        json_error('Conteúdo inválido.');
    }

    $now = (new DateTimeImmutable('now'))->format('Y-m-d H:i:s');
    $stmt = db()->prepare(
        'UPDATE notas SET
            cliente_id = :cliente_id,
            titulo = :titulo,
            conteudo = :conteudo,
            atualizada_em = :atualizada
         WHERE id = :id'
    );
    $stmt->execute([
        ':cliente_id' => $clientId,
        ':titulo' => $title,
        ':conteudo' => $content,
        ':atualizada' => $now,
        ':id' => $id,
    ]);

    json_response(['ok' => true, 'note' => note_row_to_api(fetch_note($id))]);
}

function handle_notes_delete(): void
{
    $id = (int) ($_POST['id'] ?? $_GET['id'] ?? 0);
    if ($id <= 0) {
        json_error('ID inválido.');
    }
    $stmt = db()->prepare('DELETE FROM notas WHERE id = :id');
    $stmt->execute([':id' => $id]);
    json_response(['ok' => true]);
}

function fetch_note(int $id): ?array
{
    $stmt = db()->prepare(
        'SELECT n.*, c.nome AS cliente_nome
         FROM notas n
         LEFT JOIN clientes c ON c.id = n.cliente_id
         WHERE n.id = :id LIMIT 1'
    );
    $stmt->execute([':id' => $id]);
    $row = $stmt->fetch();
    return $row ?: null;
}
