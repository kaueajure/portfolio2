<?php
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';
require __DIR__ . '/auth_lib.php';

send_security_headers();
require_api_auth();

$method = request_method();
if (in_array($method, ['POST', 'PUT', 'PATCH', 'DELETE'], true)) {
    require_csrf();
}

try {
    match ($method) {
        'GET' => handle_list(),
        'POST' => handle_create(),
        'PUT', 'PATCH' => handle_update(),
        'DELETE' => handle_delete(),
        default => json_error('Método não permitido.', 405),
    };
} catch (Throwable $e) {
    json_error('Erro interno ao processar clientes.', 500);
}

function handle_list(): void
{
    $pdo = db();
    $stmt = $pdo->query('SELECT * FROM clientes ORDER BY atualizado_em DESC, id DESC');
    $rows = $stmt->fetchAll();
    $clients = array_map('client_row_to_api', $rows);
    json_response(['ok' => true, 'clients' => $clients]);
}

function read_client_payload(): array
{
    $name = trim((string) ($_POST['name'] ?? ''));
    $phone = trim((string) ($_POST['phone'] ?? ''));
    $email = trim((string) ($_POST['email'] ?? ''));
    $purchaseDate = trim((string) ($_POST['purchaseDate'] ?? ''));
    $budgetValue = (float) ($_POST['budgetValue'] ?? 0);
    $soldValue = (float) ($_POST['soldValue'] ?? 0);
    $status = (string) ($_POST['status'] ?? '');
    $paymentMethod = (string) ($_POST['paymentMethod'] ?? '');
    $maintenanceDays = (int) ($_POST['maintenanceDays'] ?? 0);
    $renewalDays = (int) ($_POST['renewalDays'] ?? 0);
    $notes = trim((string) ($_POST['notes'] ?? ''));

    if ($name === '' || mb_strlen($name) > 120) {
        json_error('Nome inválido.');
    }
    if ($phone !== '' && mb_strlen($phone) > 30) {
        json_error('Telefone inválido.');
    }
    if ($email !== '' && (!filter_var($email, FILTER_VALIDATE_EMAIL) || mb_strlen($email) > 120)) {
        json_error('E-mail inválido.');
    }
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $purchaseDate)) {
        json_error('Data da compra inválida.');
    }
    if ($budgetValue < 0 || $soldValue < 0) {
        json_error('Valores não podem ser negativos.');
    }
    if (!in_array($status, ALLOWED_STATUS, true)) {
        json_error('Status inválido.');
    }
    if (!in_array($paymentMethod, ALLOWED_PAYMENT, true)) {
        json_error('Forma de pagamento inválida.');
    }
    if ($maintenanceDays < 0 || $renewalDays < 0) {
        json_error('Períodos em dias inválidos.');
    }
    if (mb_strlen($notes) > 5000) {
        json_error('Observações muito longas.');
    }

    $cashPaymentDate = null;
    $monthlyValue = null;
    $dueDay = null;
    $monthlyStartDate = null;
    $installmentCount = null;
    $installmentValue = null;
    $firstInstallmentDate = null;
    $installmentsPaid = 0;

    if ($paymentMethod === 'a_vista') {
        $cashPaymentDate = nullable_date($_POST['cashPaymentDate'] ?? null);
    } elseif ($paymentMethod === 'mensal') {
        $monthlyValue = nullable_float($_POST['monthlyValue'] ?? null);
        $dueDay = nullable_int($_POST['dueDay'] ?? null);
        $monthlyStartDate = nullable_date($_POST['monthlyStartDate'] ?? null);

        if ($monthlyValue === null || $monthlyValue <= 0) {
            json_error('Informe o valor mensal.');
        }
        if ($dueDay === null || $dueDay < 1 || $dueDay > 28) {
            json_error('Dia de vencimento deve ser entre 1 e 28.');
        }
        if ($monthlyStartDate === null) {
            json_error('Informe a data de início da mensalidade.');
        }
    } elseif ($paymentMethod === 'parcelas') {
        $installmentCount = nullable_int($_POST['installmentCount'] ?? null);
        $installmentValue = nullable_float($_POST['installmentValue'] ?? null);
        $firstInstallmentDate = nullable_date($_POST['firstInstallmentDate'] ?? null);
        $installmentsPaid = max(0, (int) ($_POST['installmentsPaid'] ?? 0));

        if ($installmentCount === null || $installmentCount < 2) {
            json_error('Informe a quantidade de parcelas (mínimo 2).');
        }
        if ($installmentCount > 120) {
            json_error('Quantidade de parcelas inválida.');
        }
        if ($installmentValue === null || $installmentValue <= 0) {
            json_error('Informe o valor de cada parcela.');
        }
        if ($firstInstallmentDate === null) {
            json_error('Informe a data da primeira parcela.');
        }
        if ($installmentsPaid > $installmentCount) {
            json_error('Parcelas pagas não pode ser maior que o total.');
        }
    }

    $quoteValidUntil = null;
    $approvalDate = null;
    $deliveryForecast = null;
    $deliveryDate = null;
    $cancelReason = null;

    if ($status === 'orcamento') {
        $quoteValidUntil = nullable_date($_POST['quoteValidUntil'] ?? null);
        if ($quoteValidUntil === null) {
            json_error('Informe a validade do orçamento.');
        }
    } elseif ($status === 'aprovado') {
        $approvalDate = nullable_date($_POST['approvalDate'] ?? null);
        if ($approvalDate === null) {
            json_error('Informe a data de aprovação.');
        }
    } elseif ($status === 'em_andamento') {
        $deliveryForecast = nullable_date($_POST['deliveryForecast'] ?? null);
        if ($deliveryForecast === null) {
            json_error('Informe a previsão de entrega.');
        }
    } elseif ($status === 'entregue') {
        $deliveryDate = nullable_date($_POST['deliveryDate'] ?? null);
        if ($deliveryDate === null) {
            json_error('Informe a data de entrega.');
        }
    } elseif ($status === 'cancelado') {
        $cancelReason = trim((string) ($_POST['cancelReason'] ?? ''));
        if ($cancelReason === '' || mb_strlen($cancelReason) > 255) {
            json_error('Informe o motivo do cancelamento.');
        }
    }

    return [
        'nome' => $name,
        'telefone' => $phone !== '' ? $phone : null,
        'email' => $email !== '' ? $email : null,
        'data_compra' => $purchaseDate,
        'valor_orcamento' => $budgetValue,
        'valor_vendido' => $soldValue,
        'status' => $status,
        'forma_pagamento' => $paymentMethod,
        'data_pagamento_vista' => $cashPaymentDate,
        'valor_mensal' => $monthlyValue,
        'dia_vencimento' => $dueDay,
        'data_inicio_mensalidade' => $monthlyStartDate,
        'qtd_parcelas' => $installmentCount,
        'valor_parcela' => $installmentValue,
        'data_primeira_parcela' => $firstInstallmentDate,
        'parcelas_pagas' => $installmentsPaid,
        'validade_orcamento' => $quoteValidUntil,
        'data_aprovacao' => $approvalDate,
        'previsao_entrega' => $deliveryForecast,
        'data_entrega' => $deliveryDate,
        'motivo_cancelamento' => $cancelReason,
        'dias_manutencao' => $maintenanceDays,
        'dias_renovacao' => $renewalDays,
        'observacoes' => $notes !== '' ? $notes : null,
        'remover_documento' => isset($_POST['removeDocument']) && $_POST['removeDocument'] === '1',
    ];
}

function store_upload(?array $existing = null): ?array
{
    if (!isset($_FILES['document']) || !is_array($_FILES['document'])) {
        return null;
    }

    $file = $_FILES['document'];
    if (($file['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) {
        return null;
    }
    if (($file['error'] ?? UPLOAD_ERR_OK) !== UPLOAD_ERR_OK) {
        json_error('Falha no upload do documento.');
    }
    if (($file['size'] ?? 0) <= 0 || $file['size'] > MAX_UPLOAD_BYTES) {
        json_error('Documento deve ter no máximo 20 MB.');
    }

    $original = basename((string) $file['name']);
    $original = preg_replace('/[^\w.\- ()áàâãéêíóôõúçÁÀÂÃÉÊÍÓÔÕÚÇ]+/u', '_', $original) ?: 'documento';
    $ext = strtolower(pathinfo($original, PATHINFO_EXTENSION));

    if ($ext === '' || in_array($ext, BLOCKED_UPLOAD_EXTENSIONS, true)) {
        json_error('Tipo de arquivo não permitido.');
    }
    if (!in_array($ext, ALLOWED_UPLOAD_EXTENSIONS, true)) {
        json_error('Tipo de arquivo não permitido. Use PDF, Excel, Word, imagem ou zip.');
    }

    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mime = $finfo->file($file['tmp_name']) ?: 'application/octet-stream';

    if (str_starts_with($mime, 'text/x-php') || $mime === 'application/x-httpd-php' || str_contains($mime, 'html')) {
        json_error('Tipo de arquivo não permitido.');
    }

    $safeExt = $ext !== '' ? '.' . $ext : '';
    $storedName = bin2hex(random_bytes(16)) . $safeExt;
    $dest = uploads_dir() . '/' . $storedName;

    if (!move_uploaded_file($file['tmp_name'], $dest)) {
        json_error('Não foi possível salvar o documento.', 500);
    }

    if ($existing && !empty($existing['documento_caminho'])) {
        delete_upload_file((string) $existing['documento_caminho']);
    }

    return [
        'documento_caminho' => $storedName,
        'documento_nome' => mb_substr($original, 0, 255),
        'documento_tipo' => $mime,
    ];
}

function delete_upload_file(string $relative): void
{
    if ($relative === '' || str_contains($relative, '..') || str_contains($relative, '/')) {
        return;
    }
    $full = uploads_dir() . '/' . $relative;
    if (is_file($full)) {
        @unlink($full);
    }
}

function bind_client_params(array $data, ?array $upload, string $now, bool $isCreate, ?array $existing = null): array
{
    $docPath = $isCreate ? null : ($existing['documento_caminho'] ?? null);
    $docName = $isCreate ? null : ($existing['documento_nome'] ?? null);
    $docMime = $isCreate ? null : ($existing['documento_tipo'] ?? null);

    if ($upload) {
        $docPath = $upload['documento_caminho'];
        $docName = $upload['documento_nome'];
        $docMime = $upload['documento_tipo'];
    } elseif (!$isCreate && ($data['remover_documento'] ?? false)) {
        if (!empty($existing['documento_caminho'])) {
            delete_upload_file((string) $existing['documento_caminho']);
        }
        $docPath = null;
        $docName = null;
        $docMime = null;
    } elseif ($isCreate) {
        $docPath = $upload['documento_caminho'] ?? null;
        $docName = $upload['documento_nome'] ?? null;
        $docMime = $upload['documento_tipo'] ?? null;
    }

    $params = [
        ':nome' => $data['nome'],
        ':telefone' => $data['telefone'],
        ':email' => $data['email'],
        ':data_compra' => $data['data_compra'],
        ':valor_orcamento' => $data['valor_orcamento'],
        ':valor_vendido' => $data['valor_vendido'],
        ':status' => $data['status'],
        ':forma_pagamento' => $data['forma_pagamento'],
        ':data_pagamento_vista' => $data['data_pagamento_vista'],
        ':valor_mensal' => $data['valor_mensal'],
        ':dia_vencimento' => $data['dia_vencimento'],
        ':data_inicio_mensalidade' => $data['data_inicio_mensalidade'],
        ':qtd_parcelas' => $data['qtd_parcelas'],
        ':valor_parcela' => $data['valor_parcela'],
        ':data_primeira_parcela' => $data['data_primeira_parcela'],
        ':parcelas_pagas' => $data['parcelas_pagas'],
        ':validade_orcamento' => $data['validade_orcamento'],
        ':data_aprovacao' => $data['data_aprovacao'],
        ':previsao_entrega' => $data['previsao_entrega'],
        ':data_entrega' => $data['data_entrega'],
        ':motivo_cancelamento' => $data['motivo_cancelamento'],
        ':dias_manutencao' => $data['dias_manutencao'],
        ':dias_renovacao' => $data['dias_renovacao'],
        ':observacoes' => $data['observacoes'],
        ':documento_caminho' => $docPath,
        ':documento_nome' => $docName,
        ':documento_tipo' => $docMime,
        ':atualizado_em' => $now,
    ];

    if ($isCreate) {
        $params[':criado_em'] = $now;
    }

    return $params;
}

function handle_create(): void
{
    $data = read_client_payload();
    $upload = store_upload();
    $now = (new DateTimeImmutable('now'))->format('Y-m-d H:i:s');
    $params = bind_client_params($data, $upload, $now, true);

    $pdo = db();
    $stmt = $pdo->prepare(
        'INSERT INTO clientes (
            nome, telefone, email, data_compra, valor_orcamento, valor_vendido, status, forma_pagamento,
            data_pagamento_vista, valor_mensal, dia_vencimento, data_inicio_mensalidade,
            qtd_parcelas, valor_parcela, data_primeira_parcela, parcelas_pagas,
            validade_orcamento, data_aprovacao, previsao_entrega, data_entrega, motivo_cancelamento,
            dias_manutencao, dias_renovacao, observacoes,
            documento_caminho, documento_nome, documento_tipo,
            criado_em, atualizado_em
        ) VALUES (
            :nome, :telefone, :email, :data_compra, :valor_orcamento, :valor_vendido, :status, :forma_pagamento,
            :data_pagamento_vista, :valor_mensal, :dia_vencimento, :data_inicio_mensalidade,
            :qtd_parcelas, :valor_parcela, :data_primeira_parcela, :parcelas_pagas,
            :validade_orcamento, :data_aprovacao, :previsao_entrega, :data_entrega, :motivo_cancelamento,
            :dias_manutencao, :dias_renovacao, :observacoes,
            :documento_caminho, :documento_nome, :documento_tipo,
            :criado_em, :atualizado_em
        )'
    );
    $stmt->execute($params);

    $id = (int) $pdo->lastInsertId();
    $row = fetch_client($id);
    json_response(['ok' => true, 'client' => client_row_to_api($row)], 201);
}

function handle_update(): void
{
    $id = (int) ($_POST['id'] ?? 0);
    if ($id <= 0) {
        json_error('ID inválido.');
    }

    $existing = fetch_client($id);
    if (!$existing) {
        json_error('Cliente não encontrado.', 404);
    }

    $data = read_client_payload();
    $upload = store_upload($existing);
    $now = (new DateTimeImmutable('now'))->format('Y-m-d H:i:s');
    $params = bind_client_params($data, $upload, $now, false, $existing);
    $params[':id'] = $id;

    $pdo = db();
    $stmt = $pdo->prepare(
        'UPDATE clientes SET
            nome = :nome,
            telefone = :telefone,
            email = :email,
            data_compra = :data_compra,
            valor_orcamento = :valor_orcamento,
            valor_vendido = :valor_vendido,
            status = :status,
            forma_pagamento = :forma_pagamento,
            data_pagamento_vista = :data_pagamento_vista,
            valor_mensal = :valor_mensal,
            dia_vencimento = :dia_vencimento,
            data_inicio_mensalidade = :data_inicio_mensalidade,
            qtd_parcelas = :qtd_parcelas,
            valor_parcela = :valor_parcela,
            data_primeira_parcela = :data_primeira_parcela,
            parcelas_pagas = :parcelas_pagas,
            validade_orcamento = :validade_orcamento,
            data_aprovacao = :data_aprovacao,
            previsao_entrega = :previsao_entrega,
            data_entrega = :data_entrega,
            motivo_cancelamento = :motivo_cancelamento,
            dias_manutencao = :dias_manutencao,
            dias_renovacao = :dias_renovacao,
            observacoes = :observacoes,
            documento_caminho = :documento_caminho,
            documento_nome = :documento_nome,
            documento_tipo = :documento_tipo,
            atualizado_em = :atualizado_em
         WHERE id = :id'
    );
    $stmt->execute($params);

    $row = fetch_client($id);
    json_response(['ok' => true, 'client' => client_row_to_api($row)]);
}

function handle_delete(): void
{
    $id = (int) ($_GET['id'] ?? $_POST['id'] ?? 0);
    if ($id <= 0) {
        json_error('ID inválido.');
    }

    $existing = fetch_client($id);
    if (!$existing) {
        json_error('Cliente não encontrado.', 404);
    }

    if (!empty($existing['documento_caminho'])) {
        delete_upload_file((string) $existing['documento_caminho']);
    }

    $pdo = db();
    $stmt = $pdo->prepare('DELETE FROM clientes WHERE id = :id');
    $stmt->execute([':id' => $id]);

    json_response(['ok' => true]);
}

function fetch_client(int $id): ?array
{
    $pdo = db();
    $stmt = $pdo->prepare('SELECT * FROM clientes WHERE id = :id LIMIT 1');
    $stmt->execute([':id' => $id]);
    $row = $stmt->fetch();
    return $row ?: null;
}
