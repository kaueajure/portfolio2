<?php
declare(strict_types=1);

/**
 * Sessão, CSRF, rate limit e autenticação do painel.
 * Requer bootstrap.php (db, json_*, app_config).
 */

function start_app_session(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }

    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'secure' => (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off'),
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
    session_name('kaue_painel');
    session_start();
}

function client_ip(): string
{
    return (string) ($_SERVER['REMOTE_ADDR'] ?? '0.0.0.0');
}

function rate_limit_dir(): string
{
    $dir = dirname(__DIR__) . '/storage/rate_limit';
    if (!is_dir($dir) && !mkdir($dir, 0755, true) && !is_dir($dir)) {
        json_error('Falha interna de rate limit.', 500);
    }
    return $dir;
}

/** Bloqueia excesso de tentativas por IP + ação. */
function rate_limit(string $action, int $maxAttempts, int $windowSeconds): void
{
    $ip = client_ip();
    $file = rate_limit_dir() . '/' . hash('sha256', $action . '|' . $ip) . '.json';
    $now = time();
    $data = ['attempts' => []];

    if (is_file($file)) {
        $raw = file_get_contents($file);
        $parsed = is_string($raw) ? json_decode($raw, true) : null;
        if (is_array($parsed) && isset($parsed['attempts']) && is_array($parsed['attempts'])) {
            $data = $parsed;
        }
    }

    $data['attempts'] = array_values(array_filter(
        $data['attempts'],
        static fn($ts) => is_int($ts) && ($now - $ts) < $windowSeconds
    ));

    if (count($data['attempts']) >= $maxAttempts) {
        json_error('Muitas tentativas. Aguarde alguns minutos e tente novamente.', 429);
    }

    $data['attempts'][] = $now;
    file_put_contents($file, json_encode($data), LOCK_EX);
}

function csrf_token(): string
{
    start_app_session();
    if (empty($_SESSION['csrf_token']) || !is_string($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

function require_csrf(): void
{
    start_app_session();
    $expected = $_SESSION['csrf_token'] ?? '';
    $got = (string) ($_SERVER['HTTP_X_CSRF_TOKEN'] ?? $_POST['csrf'] ?? '');
    if (!is_string($expected) || $expected === '' || $got === '' || !hash_equals($expected, $got)) {
        json_error('Token de segurança inválido. Recarregue a página.', 403);
    }
}

function find_user_by_email(string $email): ?array
{
    $email = mb_strtolower(trim($email));
    if ($email === '') {
        return null;
    }

    $stmt = db()->prepare('SELECT * FROM usuarios WHERE email = :email LIMIT 1');
    $stmt->execute([':email' => $email]);
    $row = $stmt->fetch();
    return $row ?: null;
}

function find_user_by_id(int $id): ?array
{
    if ($id <= 0) {
        return null;
    }
    $stmt = db()->prepare('SELECT * FROM usuarios WHERE id = :id LIMIT 1');
    $stmt->execute([':id' => $id]);
    $row = $stmt->fetch();
    return $row ?: null;
}

function user_public(array $row): array
{
    return [
        'id' => (int) $row['id'],
        'name' => $row['nome'],
        'email' => $row['email'],
        'needsPasswordSetup' => empty($row['senha_hash']),
    ];
}

function current_user(): ?array
{
    start_app_session();
    $id = (int) ($_SESSION['usuario_id'] ?? 0);
    if ($id <= 0) {
        return null;
    }
    $row = find_user_by_id($id);
    if (!$row || empty($row['senha_hash'])) {
        return null;
    }
    return $row;
}

function login_user(array $row): void
{
    start_app_session();
    session_regenerate_id(true);
    $_SESSION['usuario_id'] = (int) $row['id'];
    $_SESSION['usuario_nome'] = $row['nome'];
    $_SESSION['usuario_email'] = $row['email'];
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));

    $stmt = db()->prepare(
        'UPDATE usuarios SET ultimo_acesso = :ultimo, atualizado_em = :atualizado WHERE id = :id'
    );
    $agora = (new DateTimeImmutable('now'))->format('Y-m-d H:i:s');
    $stmt->execute([
        ':ultimo' => $agora,
        ':atualizado' => $agora,
        ':id' => (int) $row['id'],
    ]);
}

function logout_user(): void
{
    start_app_session();
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'] ?? '', (bool) $params['secure'], (bool) $params['httponly']);
    }
    session_destroy();
}

function require_api_auth(): void
{
    if (!current_user()) {
        json_error('Não autenticado. Faça login para continuar.', 401);
    }
}

function require_page_auth(): void
{
    if (current_user()) {
        return;
    }
    header('Location: ../login/');
    exit;
}

function validate_password_strength(string $password): void
{
    if (mb_strlen($password) < 12) {
        json_error('A senha deve ter no mínimo 12 caracteres.');
    }
    if (mb_strlen($password) > 128) {
        json_error('Senha inválida.');
    }
}

function configured_setup_token(): string
{
    $c = app_config();
    return trim((string) ($c['setup_token'] ?? ''));
}

function require_valid_setup_token(?string $provided): void
{
    $expected = configured_setup_token();
    if ($expected === '') {
        json_error('Criação de senha desabilitada. Defina setup_token em config/database.php se precisar redefinir.', 403);
    }
    $provided = trim((string) $provided);
    if ($provided === '' || !hash_equals($expected, $provided)) {
        json_error('Token de configuração inválido.', 403);
    }
}
