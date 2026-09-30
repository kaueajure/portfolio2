<?php
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';
require __DIR__ . '/auth_lib.php';

send_security_headers();
require_api_auth();

$id = (int) ($_GET['id'] ?? 0);
if ($id <= 0) {
    http_response_code(400);
    header('Content-Type: text/plain; charset=utf-8');
    echo 'ID inválido.';
    exit;
}

try {
    $pdo = db();
    $stmt = $pdo->prepare(
        'SELECT documento_caminho, documento_nome, documento_tipo FROM clientes WHERE id = :id LIMIT 1'
    );
    $stmt->execute([':id' => $id]);
    $row = $stmt->fetch();
} catch (Throwable $e) {
    http_response_code(500);
    header('Content-Type: text/plain; charset=utf-8');
    echo 'Erro ao buscar documento.';
    exit;
}

if (!$row || empty($row['documento_caminho']) || empty($row['documento_nome'])) {
    http_response_code(404);
    header('Content-Type: text/plain; charset=utf-8');
    echo 'Documento não encontrado.';
    exit;
}

$relative = (string) $row['documento_caminho'];
if (str_contains($relative, '..') || str_contains($relative, '/')) {
    http_response_code(400);
    exit;
}

$path = uploads_dir() . '/' . $relative;
if (!is_file($path)) {
    http_response_code(404);
    header('Content-Type: text/plain; charset=utf-8');
    echo 'Arquivo ausente no servidor.';
    exit;
}

$mime = $row['documento_tipo'] ?: 'application/octet-stream';
$name = str_replace(['"', "\r", "\n"], '', (string) $row['documento_nome']);

header('Content-Type: ' . $mime);
header('X-Content-Type-Options: nosniff');
header('Content-Length: ' . (string) filesize($path));
header('Content-Disposition: attachment; filename="' . $name . '"');
header('Cache-Control: private, no-store');
header('X-Download-Options: noopen');
readfile($path);
exit;
