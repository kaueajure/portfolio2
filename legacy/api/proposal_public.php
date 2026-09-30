<?php
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';
require __DIR__ . '/auth_lib.php';
require __DIR__ . '/proposals_lib.php';

send_security_headers();

$method = request_method();
$action = (string) ($_GET['action'] ?? $_POST['action'] ?? 'preview');
$token = preg_replace('/[^a-f0-9]/', '', (string) ($_GET['t'] ?? $_POST['t'] ?? '')) ?? '';

try {
    if ($action === 'pdf' && $method === 'GET') {
        require __DIR__ . '/proposal_pdf.php';
        handle_proposal_pdf_public($token);
    }
    if ($action === 'preview' && $method === 'GET') {
        handle_public_preview($token);
    }
    if ($action === 'open' && $method === 'POST') {
        rate_limit('proposal_open', 40, 600);
        handle_public_open($token);
    }
    if ($action === 'get' && $method === 'GET') {
        // Compat: não libera conteúdo completo sem nome
        handle_public_preview($token);
    }
    if ($action === 'accept' && $method === 'POST') {
        rate_limit('proposal_respond', 20, 600);
        handle_public_respond($token, 'aceita');
    }
    if ($action === 'decline' && $method === 'POST') {
        rate_limit('proposal_respond', 20, 600);
        handle_public_respond($token, 'recusada');
    }
    json_error('Ação inválida.', 400);
} catch (Throwable $e) {
    json_error('Erro ao processar proposta.', 500);
}

function public_load_row(string $token): array
{
    $row = fetch_proposal_by_token($token);
    if (!$row) {
        json_error('Proposta não encontrada.', 404);
    }
    $row = proposal_mark_expired_if_needed($row);
    if (in_array($row['status'], ['rascunho', 'cancelada'], true)) {
        json_error('Proposta indisponível.', 404);
    }
    return $row;
}

function handle_public_preview(string $token): void
{
    $row = public_load_row($token);
    json_response([
        'ok' => true,
        'preview' => [
            'code' => $row['codigo'],
            'title' => $row['titulo'],
            'status' => $row['status'],
            'validUntil' => $row['validade'] ?? null,
            'isExpired' => proposal_is_expired($row),
            'needsName' => true,
        ],
    ]);
}

function handle_public_open(string $token): void
{
    $row = public_load_row($token);
    $name = trim((string) ($_POST['name'] ?? ''));
    $returning = (string) ($_POST['returning'] ?? '') === '1';

    if ($returning) {
        if ($name === '' || mb_strlen($name) < 2 || mb_strlen($name) > 120) {
            json_error('Informe seu nome (mínimo 2 caracteres).');
        }
        // Já registrou nesta sessão: só garante status visualizada se ainda for enviada
        if ($row['status'] === 'enviada') {
            proposal_register_view((int) $row['id'], $name);
        }
    } else {
        proposal_register_view((int) $row['id'], $name);
    }

    $row = fetch_proposal((int) $row['id']) ?: $row;
    $row = proposal_mark_expired_if_needed($row);
    $items = fetch_proposal_items((int) $row['id']);
    $payload = proposal_public_payload($row, $items);
    $payload['canRespond'] = in_array($row['status'], ['enviada', 'visualizada'], true)
        && !proposal_is_expired($row);
    $payload['pdfUrl'] = '../api/proposal_public.php?action=pdf&t=' . rawurlencode($token);
    $payload['viewerName'] = $name;

    json_response(['ok' => true, 'proposal' => $payload]);
}

function handle_public_respond(string $token, string $newStatus): void
{
    $row = public_load_row($token);

    if ($row['status'] === 'expirada' || proposal_is_expired($row)) {
        json_error('Esta proposta expirou.');
    }
    if (in_array($row['status'], ['aceita', 'recusada'], true)) {
        json_error('Esta proposta já foi respondida.');
    }
    if (!in_array($row['status'], ['enviada', 'visualizada'], true)) {
        json_error('Não é possível responder esta proposta.');
    }

    $message = trim((string) ($_POST['message'] ?? ''));
    if (mb_strlen($message) > 2000) {
        json_error('Mensagem muito longa.');
    }

    $now = (new DateTimeImmutable('now'))->format('Y-m-d H:i:s');
    $stmt = db()->prepare(
        'UPDATE propostas SET
            status = :status,
            respondida_em = :resp,
            resposta_cliente = :msg,
            atualizada_em = :agora
         WHERE id = :id'
    );
    $stmt->execute([
        ':status' => $newStatus,
        ':resp' => $now,
        ':msg' => $message !== '' ? $message : null,
        ':agora' => $now,
        ':id' => (int) $row['id'],
    ]);

    $row['status'] = $newStatus;
    $row['respondida_em'] = $now;
    $row['atualizada_em'] = $now;
    $row['resposta_cliente'] = $message !== '' ? $message : null;

    if ($newStatus === 'aceita') {
        proposal_sync_client_on_accept($row);
    }

    $items = fetch_proposal_items((int) $row['id']);
    $payload = proposal_public_payload($row, $items);
    $payload['canRespond'] = false;

    json_response(['ok' => true, 'proposal' => $payload]);
}
