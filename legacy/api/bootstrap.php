<?php
declare(strict_types=1);

function app_config(): array
{
    static $config = null;
    if ($config !== null) {
        return $config;
    }

    $path = dirname(__DIR__) . '/config/database.php';
    if (!is_file($path)) {
        json_error(
            'Configuração do banco ausente. Copie config/database.example.php para config/database.php e preencha os dados da Hostinger.',
            500
        );
    }

    /** @var array $config */
    $config = require $path;
    return $config;
}

function db(): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $c = app_config();
    $dsn = sprintf(
        'mysql:host=%s;port=%d;dbname=%s;charset=%s',
        $c['host'],
        (int) ($c['port'] ?? 3306),
        $c['name'],
        $c['charset'] ?? 'utf8mb4'
    );

    try {
        $pdo = new PDO($dsn, $c['user'], $c['pass'], [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);
    } catch (PDOException $e) {
        json_error('Falha ao conectar no MySQL. Verifique host, banco, usuário e senha.', 500);
    }

    return $pdo;
}

function send_security_headers(): void
{
    if (headers_sent()) {
        return;
    }
    header('X-Frame-Options: DENY');
    header('X-Content-Type-Options: nosniff');
    header('Referrer-Policy: strict-origin-when-cross-origin');
    header('Permissions-Policy: camera=(), microphone=(), geolocation=()');
    header("Content-Security-Policy: frame-ancestors 'none'");
}

function json_response(mixed $data, int $status = 200): void
{
    send_security_headers();
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function json_error(string $message, int $status = 400, array $extra = []): void
{
    json_response(array_merge(['ok' => false, 'error' => $message], $extra), $status);
}

function request_method(): string
{
    $method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
    if ($method === 'POST' && isset($_POST['_method'])) {
        $override = strtoupper((string) $_POST['_method']);
        if (in_array($override, ['PUT', 'PATCH', 'DELETE'], true)) {
            return $override;
        }
    }
    return $method;
}

function uploads_dir(): string
{
    $dir = dirname(__DIR__) . '/uploads/clientes';
    if (!is_dir($dir) && !mkdir($dir, 0755, true) && !is_dir($dir)) {
        json_error('Não foi possível criar a pasta de uploads.', 500);
    }
    return $dir;
}

function nullable_date(?string $value): ?string
{
    $value = trim((string) $value);
    if ($value === '') {
        return null;
    }
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $value)) {
        json_error('Data inválida.');
    }
    return $value;
}

function nullable_float($value): ?float
{
    if ($value === null || $value === '') {
        return null;
    }
    return (float) $value;
}

function nullable_int($value): ?int
{
    if ($value === null || $value === '') {
        return null;
    }
    return (int) $value;
}

function client_row_to_api(array $row): array
{
    $hasDoc = !empty($row['documento_caminho']) && !empty($row['documento_nome']);

    return [
        'id' => (int) $row['id'],
        'name' => $row['nome'],
        'phone' => $row['telefone'],
        'email' => $row['email'],
        'purchaseDate' => $row['data_compra'],
        'budgetValue' => (float) $row['valor_orcamento'],
        'soldValue' => (float) $row['valor_vendido'],
        'status' => $row['status'],
        'paymentMethod' => $row['forma_pagamento'],
        'cashPaymentDate' => $row['data_pagamento_vista'],
        'monthlyValue' => $row['valor_mensal'] !== null ? (float) $row['valor_mensal'] : null,
        'dueDay' => $row['dia_vencimento'] !== null ? (int) $row['dia_vencimento'] : null,
        'monthlyStartDate' => $row['data_inicio_mensalidade'],
        'installmentCount' => $row['qtd_parcelas'] !== null ? (int) $row['qtd_parcelas'] : null,
        'installmentValue' => $row['valor_parcela'] !== null ? (float) $row['valor_parcela'] : null,
        'firstInstallmentDate' => $row['data_primeira_parcela'],
        'installmentsPaid' => (int) ($row['parcelas_pagas'] ?? 0),
        'quoteValidUntil' => $row['validade_orcamento'],
        'approvalDate' => $row['data_aprovacao'],
        'deliveryForecast' => $row['previsao_entrega'],
        'deliveryDate' => $row['data_entrega'],
        'cancelReason' => $row['motivo_cancelamento'],
        'maintenanceDays' => (int) $row['dias_manutencao'],
        'renewalDays' => (int) $row['dias_renovacao'],
        'notes' => $row['observacoes'],
        'document' => $hasDoc
            ? [
                'name' => $row['documento_nome'],
                'mime' => $row['documento_tipo'],
                'url' => '../api/document.php?id=' . (int) $row['id'],
            ]
            : null,
        'createdAt' => $row['criado_em'],
        'updatedAt' => $row['atualizado_em'],
    ];
}

const ALLOWED_STATUS = ['orcamento', 'aprovado', 'em_andamento', 'entregue', 'cancelado'];
const ALLOWED_PAYMENT = ['a_vista', 'mensal', 'parcelas'];

/** Extensões permitidas no upload de documentos. */
const ALLOWED_UPLOAD_EXTENSIONS = [
    'pdf', 'doc', 'docx', 'xls', 'xlsx', 'csv', 'ppt', 'pptx',
    'odt', 'ods', 'txt', 'rtf',
    'png', 'jpg', 'jpeg', 'webp', 'gif',
    'zip', 'rar', '7z',
];

const BLOCKED_UPLOAD_EXTENSIONS = [
    'php', 'phtml', 'php3', 'php4', 'php5', 'php7', 'php8', 'phar',
    'cgi', 'pl', 'py', 'rb', 'sh', 'bash', 'exe', 'bat', 'cmd', 'com',
    'msi', 'dll', 'so', 'jsp', 'asp', 'aspx', 'htaccess', 'htpasswd',
    'html', 'htm', 'shtml', 'svg', 'js', 'mjs', 'css',
];

const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;
