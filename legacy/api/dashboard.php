<?php
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';
require __DIR__ . '/auth_lib.php';

send_security_headers();
require_api_auth();

try {
    $clients = db()->query('SELECT * FROM clientes ORDER BY atualizado_em DESC')->fetchAll();
    $notesCount = (int) db()->query('SELECT COUNT(*) FROM notas')->fetchColumn();

    $today = new DateTimeImmutable('today');
    $items = [];
    $urgent = 0;
    $overdue = 0;
    $pipeline = 0.0;
    $byStatus = [
        'orcamento' => 0,
        'aprovado' => 0,
        'em_andamento' => 0,
        'entregue' => 0,
        'cancelado' => 0,
    ];

    foreach ($clients as $row) {
        $client = client_row_to_api($row);
        $status = $client['status'];
        if (isset($byStatus[$status])) {
            $byStatus[$status]++;
        }
        if ($status !== 'cancelado') {
            $pipeline += (float) $client['soldValue'];
        }

        $purchase = DateTimeImmutable::createFromFormat('Y-m-d', (string) $client['purchaseDate']) ?: null;
        if ($purchase) {
            $maint = $purchase->modify('+' . (int) $client['maintenanceDays'] . ' days');
            $renew = $purchase->modify('+' . (int) $client['renewalDays'] . ' days');
            foreach (
                [
                    ['type' => 'manutencao', 'label' => 'Manutenção', 'date' => $maint],
                    ['type' => 'renovacao', 'label' => 'Renovação', 'date' => $renew],
                ] as $event
            ) {
                $days = (int) floor(($event['date']->getTimestamp() - $today->getTimestamp()) / 86400);
                $level = agenda_level($days);
                if ($level === 'overdue') {
                    $overdue++;
                }
                if ($level === 'overdue' || $level === '7') {
                    $urgent++;
                }
                $items[] = [
                    'clientId' => $client['id'],
                    'clientName' => $client['name'],
                    'type' => $event['type'],
                    'label' => $event['label'],
                    'date' => $event['date']->format('Y-m-d'),
                    'daysLeft' => $days,
                    'level' => $level,
                    'status' => $client['status'],
                    'phone' => $client['phone'],
                ];
            }

            if ($client['paymentMethod'] === 'parcelas' && $client['firstInstallmentDate'] && $client['installmentCount']) {
                $paid = (int) $client['installmentsPaid'];
                $total = (int) $client['installmentCount'];
                if ($paid < $total) {
                    $first = DateTimeImmutable::createFromFormat('Y-m-d', (string) $client['firstInstallmentDate']);
                    if ($first) {
                        $next = $first->modify('+' . $paid . ' months');
                        $days = (int) floor(($next->getTimestamp() - $today->getTimestamp()) / 86400);
                        $level = agenda_level($days);
                        if ($level === 'overdue') {
                            $overdue++;
                        }
                        if ($level === 'overdue' || $level === '7') {
                            $urgent++;
                        }
                        $items[] = [
                            'clientId' => $client['id'],
                            'clientName' => $client['name'],
                            'type' => 'parcela',
                            'label' => 'Parcela ' . ($paid + 1) . '/' . $total,
                            'date' => $next->format('Y-m-d'),
                            'daysLeft' => $days,
                            'level' => $level,
                            'status' => $client['status'],
                            'phone' => $client['phone'],
                            'value' => $client['installmentValue'],
                        ];
                    }
                }
            }
        }
    }

    usort($items, static function ($a, $b) {
        return strcmp($a['date'], $b['date']);
    });

    $upcoming = array_values(array_filter($items, static fn($i) => $i['daysLeft'] <= 30));

    json_response([
        'ok' => true,
        'dashboard' => [
            'clients' => count($clients),
            'notes' => $notesCount,
            'pipeline' => $pipeline,
            'urgent' => $urgent,
            'overdue' => $overdue,
            'byStatus' => $byStatus,
            'upcoming' => array_slice($upcoming, 0, 8),
        ],
        'agenda' => $items,
    ]);
} catch (Throwable $e) {
    json_error('Erro ao carregar dashboard/agenda.', 500);
}

function agenda_level(int $daysLeft): string
{
    if ($daysLeft < 0) {
        return 'overdue';
    }
    if ($daysLeft <= 7) {
        return '7';
    }
    if ($daysLeft <= 15) {
        return '15';
    }
    if ($daysLeft <= 30) {
        return '30';
    }
    return 'ok';
}
