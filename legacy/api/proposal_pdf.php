<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/vendor/autoload.php';
require_once __DIR__ . '/proposals_lib.php';

use setasign\Fpdi\Fpdi;

function proposal_pdf_text(string $text): string
{
    $converted = @iconv('UTF-8', 'ISO-8859-1//TRANSLIT', $text);
    if ($converted === false || $converted === '') {
        return preg_replace('/[^\x20-\x7E\n\r]/', '?', $text) ?: '';
    }
    return $converted;
}

function proposal_pdf_money(float $value): string
{
    return 'R$ ' . number_format($value, 2, ',', '.');
}

function proposal_build_pdf_clean(array $row, array $items, ?string $outputPath = null, string $dest = 'I'): ?string
{
    $pdf = new Fpdi('P', 'mm', 'A4');
    $pdf->SetAutoPageBreak(true, 18);
    $pdf->AddPage();
    $pdf->SetMargins(16, 16, 16);

    $pdf->SetFont('Helvetica', 'B', 18);
    $pdf->SetTextColor(30, 34, 40);
    $pdf->Cell(0, 9, proposal_pdf_text('Kauê Ajure'), 0, 1);
    $pdf->SetFont('Helvetica', '', 10);
    $pdf->SetTextColor(110, 118, 128);
    $pdf->Cell(0, 5, proposal_pdf_text('Proposta comercial'), 0, 1);
    $pdf->Ln(3);
    $pdf->SetDrawColor(210, 214, 218);
    $pdf->Line(16, $pdf->GetY(), 194, $pdf->GetY());
    $pdf->Ln(7);

    $pdf->SetTextColor(30, 34, 40);
    $pdf->SetFont('Helvetica', 'B', 13);
    $pdf->MultiCell(0, 6, proposal_pdf_text((string) $row['titulo']));
    $pdf->Ln(2);

    $pdf->SetFont('Helvetica', '', 9);
    $pdf->SetTextColor(90, 98, 108);
    $pdf->Cell(0, 5, proposal_pdf_text('Código: ' . $row['codigo']), 0, 1);
    if (!empty($row['cliente_nome'])) {
        $pdf->Cell(0, 5, proposal_pdf_text('Cliente: ' . $row['cliente_nome']), 0, 1);
    }
    if (!empty($row['validade'])) {
        $d = DateTimeImmutable::createFromFormat('Y-m-d', (string) $row['validade']);
        $pdf->Cell(0, 5, proposal_pdf_text('Validade: ' . ($d ? $d->format('d/m/Y') : $row['validade'])), 0, 1);
    }
    $pdf->Ln(5);

    $pdf->SetFont('Helvetica', 'B', 8);
    $pdf->SetFillColor(236, 239, 242);
    $pdf->SetTextColor(30, 34, 40);
    $w = [72, 24, 22, 30, 30];
    $pdf->Cell($w[0], 7, proposal_pdf_text('Item'), 1, 0, 'L', true);
    $pdf->Cell($w[1], 7, proposal_pdf_text('Tipo'), 1, 0, 'C', true);
    $pdf->Cell($w[2], 7, proposal_pdf_text('Qtd/h'), 1, 0, 'C', true);
    $pdf->Cell($w[3], 7, proposal_pdf_text('Unitário'), 1, 0, 'R', true);
    $pdf->Cell($w[4], 7, proposal_pdf_text('Total'), 1, 1, 'R', true);

    $pdf->SetFont('Helvetica', '', 8);
    foreach ($items as $item) {
        if ($pdf->GetY() > 260) {
            $pdf->AddPage();
        }
        $name = mb_substr((string) $item['nome_snapshot'], 0, 55);
        $tipo = $item['tipo_preco'] === 'hora' ? 'Hora' : 'Fixo';
        $pdf->Cell($w[0], 6, proposal_pdf_text($name), 1);
        $pdf->Cell($w[1], 6, proposal_pdf_text($tipo), 1, 0, 'C');
        $pdf->Cell($w[2], 6, number_format((float) $item['quantidade'], 2, ',', '.'), 1, 0, 'C');
        $pdf->Cell($w[3], 6, proposal_pdf_text(proposal_pdf_money((float) $item['preco_unitario'])), 1, 0, 'R');
        $pdf->Cell($w[4], 6, proposal_pdf_text(proposal_pdf_money((float) $item['total_linha'])), 1, 1, 'R');
    }

    $pdf->Ln(4);
    $pdf->SetFont('Helvetica', '', 9);
    $pdf->SetTextColor(90, 98, 108);
    $pdf->Cell(148, 6, proposal_pdf_text('Subtotal'), 0, 0, 'R');
    $pdf->SetTextColor(30, 34, 40);
    $pdf->Cell(30, 6, proposal_pdf_text(proposal_pdf_money((float) $row['subtotal'])), 0, 1, 'R');

    $discPct = (float) $row['desconto_percentual'];
    $discVal = (float) $row['desconto_valor'];
    if ($discPct > 0 || $discVal > 0) {
        $label = $discPct > 0
            ? 'Desconto (' . number_format($discPct, 2, ',', '.') . '%)'
            : 'Desconto';
        $amount = $discPct > 0
            ? round((float) $row['subtotal'] * ($discPct / 100), 2)
            : $discVal;
        $pdf->SetTextColor(90, 98, 108);
        $pdf->Cell(148, 6, proposal_pdf_text($label), 0, 0, 'R');
        $pdf->SetTextColor(30, 34, 40);
        $pdf->Cell(30, 6, proposal_pdf_text('- ' . proposal_pdf_money($amount)), 0, 1, 'R');
    }

    $pdf->SetFont('Helvetica', 'B', 11);
    $pdf->Cell(148, 8, proposal_pdf_text('Total'), 0, 0, 'R');
    $pdf->Cell(30, 8, proposal_pdf_text(proposal_pdf_money((float) $row['total'])), 0, 1, 'R');

    if (!empty($row['escopo'])) {
        $pdf->Ln(6);
        $pdf->SetFont('Helvetica', 'B', 10);
        $pdf->Cell(0, 6, proposal_pdf_text('Escopo'), 0, 1);
        $pdf->SetFont('Helvetica', '', 9);
        $pdf->SetTextColor(60, 68, 76);
        $pdf->MultiCell(0, 5, proposal_pdf_text((string) $row['escopo']));
    }

    if (!empty($row['condicoes'])) {
        $pdf->Ln(4);
        $pdf->SetTextColor(30, 34, 40);
        $pdf->SetFont('Helvetica', 'B', 10);
        $pdf->Cell(0, 6, proposal_pdf_text('Condições'), 0, 1);
        $pdf->SetFont('Helvetica', '', 9);
        $pdf->SetTextColor(60, 68, 76);
        $pdf->MultiCell(0, 5, proposal_pdf_text((string) $row['condicoes']));
    }

    $filename = preg_replace('/[^\w.\-]+/', '_', (string) $row['codigo']) . '.pdf';
    if ($outputPath !== null) {
        $pdf->Output('F', $outputPath);
        return $outputPath;
    }

    $pdf->Output($dest, $filename);
    return null;
}

function handle_proposal_pdf_admin(): void
{
    $id = (int) ($_GET['id'] ?? 0);
    $row = fetch_proposal($id);
    if (!$row) {
        json_error('Proposta não encontrada.', 404);
    }
    $items = fetch_proposal_items($id);
    proposal_build_pdf_clean($row, $items, null, 'D');
    exit;
}

function handle_proposal_pdf_public(string $token): void
{
    $row = fetch_proposal_by_token($token);
    if (!$row) {
        http_response_code(404);
        header('Content-Type: text/plain; charset=utf-8');
        echo 'Proposta não encontrada.';
        exit;
    }
    $row = proposal_mark_expired_if_needed($row);
    if (in_array($row['status'], ['rascunho', 'cancelada'], true)) {
        http_response_code(404);
        header('Content-Type: text/plain; charset=utf-8');
        echo 'Proposta indisponível.';
        exit;
    }
    $items = fetch_proposal_items((int) $row['id']);
    proposal_build_pdf_clean($row, $items, null, 'D');
    exit;
}
