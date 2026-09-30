<?php
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';
require __DIR__ . '/auth_lib.php';

send_security_headers();
start_app_session();

$action = (string) ($_GET['action'] ?? $_POST['action'] ?? '');
if ($action === '' && request_method() === 'GET') {
    $action = 'me';
}

try {
    match ($action) {
        'me' => handle_me(),
        'login' => handle_login(),
        'setup' => handle_setup(),
        'logout' => handle_logout(),
        default => json_error('Ação inválida.', 400),
    };
} catch (Throwable $e) {
    json_error('Erro de autenticação.', 500);
}

function handle_me(): void
{
    $user = current_user();
    if (!$user) {
        json_response([
            'ok' => true,
            'authenticated' => false,
            'user' => null,
            'csrf' => csrf_token(),
        ]);
    }
    json_response([
        'ok' => true,
        'authenticated' => true,
        'user' => user_public($user),
        'csrf' => csrf_token(),
    ]);
}

function handle_setup(): void
{
    if (request_method() !== 'POST') {
        json_error('Método não permitido.', 405);
    }

    rate_limit('auth_setup', 5, 900);
    require_valid_setup_token($_POST['setupToken'] ?? null);

    $email = mb_strtolower(trim((string) ($_POST['email'] ?? '')));
    $password = (string) ($_POST['password'] ?? '');
    $confirm = (string) ($_POST['passwordConfirm'] ?? '');

    if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        json_error('Informe um e-mail válido.');
    }
    if ($password !== $confirm) {
        json_error('As senhas não coincidem.');
    }
    validate_password_strength($password);

    $user = find_user_by_email($email);
    if (!$user || !empty($user['senha_hash'])) {
        // Resposta genérica — não confirma existência/estado
        json_error('Não foi possível definir a senha.', 403);
    }

    $hash = password_hash($password, PASSWORD_DEFAULT);
    $agora = (new DateTimeImmutable('now'))->format('Y-m-d H:i:s');
    $stmt = db()->prepare(
        'UPDATE usuarios SET senha_hash = :hash, atualizado_em = :agora WHERE id = :id AND senha_hash IS NULL'
    );
    $stmt->execute([
        ':hash' => $hash,
        ':agora' => $agora,
        ':id' => (int) $user['id'],
    ]);

    if ($stmt->rowCount() < 1) {
        json_error('Não foi possível definir a senha.', 403);
    }

    $fresh = find_user_by_id((int) $user['id']);
    if (!$fresh) {
        json_error('Não foi possível definir a senha.', 403);
    }

    login_user($fresh);
    json_response([
        'ok' => true,
        'user' => user_public($fresh),
        'csrf' => csrf_token(),
        'redirect' => '../admin/dashboard.php',
    ]);
}

function handle_login(): void
{
    if (request_method() !== 'POST') {
        json_error('Método não permitido.', 405);
    }

    rate_limit('auth_login', 8, 900);

    $email = mb_strtolower(trim((string) ($_POST['email'] ?? '')));
    $password = (string) ($_POST['password'] ?? '');

    if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        json_error('Informe um e-mail válido.');
    }
    if ($password === '') {
        json_error('Informe a senha.');
    }

    $user = find_user_by_email($email);
    $genericFail = static function (): void {
        // Delay constante leve contra timing/oráculo
        usleep(200000);
        json_error('E-mail ou senha incorretos.', 401);
    };

    if (!$user || empty($user['senha_hash'])) {
        $genericFail();
    }
    if (!password_verify($password, $user['senha_hash'])) {
        $genericFail();
    }

    login_user($user);
    json_response([
        'ok' => true,
        'user' => user_public($user),
        'csrf' => csrf_token(),
        'redirect' => '../admin/dashboard.php',
    ]);
}

function handle_logout(): void
{
    if (request_method() !== 'POST') {
        json_error('Método não permitido. Use POST para sair.', 405);
    }

    // CSRF se ainda houver sessão; se sessão já expirou, apenas redireciona
    start_app_session();
    if (!empty($_SESSION['csrf_token'])) {
        require_csrf();
    }

    logout_user();

    $wantsJson = str_contains((string) ($_SERVER['HTTP_ACCEPT'] ?? ''), 'application/json')
        || (isset($_POST['format']) && $_POST['format'] === 'json');

    if ($wantsJson) {
        json_response(['ok' => true]);
    }

    header('Location: ../login/');
    exit;
}
