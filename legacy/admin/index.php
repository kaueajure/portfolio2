<?php
declare(strict_types=1);
require __DIR__ . '/../api/bootstrap.php';
require __DIR__ . '/../api/auth_lib.php';
require_page_auth();
send_security_headers();
$csrf = htmlspecialchars(csrf_token(), ENT_QUOTES, 'UTF-8');
$userName = htmlspecialchars((string) ($_SESSION['usuario_nome'] ?? ''), ENT_QUOTES, 'UTF-8');
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="noindex, nofollow">
  <meta name="theme-color" content="#15181C">
  <meta name="csrf-token" content="<?= $csrf ?>">
  <title>Clientes — Painel Kauê Ajure</title>
  <link rel="icon" href="../assets/favicon.ico" sizes="any">
  <link rel="icon" type="image/png" href="../assets/favicon-32.png" sizes="32x32">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Syne:wght@600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../styles.css">
  <link rel="stylesheet" href="css/panel.css">
</head>
<body class="panel-body">
  <a class="skip-link" href="#conteudo">Ir para o conteúdo</a>
  <div class="noise" aria-hidden="true"></div>

  <div class="panel-layout">
    <aside class="panel-sidebar" aria-label="Navegação do painel">
      <a class="panel-brand" href="dashboard.php">
        <img src="../assets/logo-branca.png" alt="" width="32" height="32" decoding="async">
        <span>Painel</span>
      </a>

      <nav class="panel-nav">
        <a href="dashboard.php">Dashboard</a>
        <a class="is-active" href="./" aria-current="page">Clientes</a>
        <a href="propostas.php">Propostas</a>
        <a href="agenda.php">Agenda</a>
        <a href="notas.php">Notas</a>
        <a href="pdf.php">PDF</a>
      </nav>

      <div class="panel-sidebar-foot">
        <?php if ($userName !== ''): ?>
          <span class="panel-user"><?= $userName ?></span>
        <?php endif; ?>
        <a href="../">Portfólio</a>
        <form class="logout-form" method="post" action="../api/auth.php?action=logout">
          <input type="hidden" name="csrf" value="<?= $csrf ?>">
          <button type="submit">Sair</button>
        </form>
      </div>
    </aside>

    <div class="panel-main">
      <header class="panel-topbar">
        <div>
          <span class="section-tag">Painel</span>
          <h1>Clientes</h1>
        </div>
        <button class="btn btn-primary" type="button" data-open-client-form>
          Novo cliente
        </button>
      </header>

      <main id="conteudo" class="panel-content">
        <section class="panel-toolbar" aria-label="Filtros">
          <label class="field field-inline">
            <span class="visually-hidden">Buscar</span>
            <input type="search" id="client-search" placeholder="Buscar por nome ou telefone…" autocomplete="off">
          </label>
          <label class="field field-inline">
            <span class="visually-hidden">Status</span>
            <select id="client-filter-status">
              <option value="">Todos os status</option>
              <option value="orcamento">Orçamento</option>
              <option value="aprovado">Aprovado</option>
              <option value="em_andamento">Em andamento</option>
              <option value="entregue">Entregue</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </label>
        </section>

        <section class="panel-stats" id="client-stats" aria-label="Resumo"></section>

        <section class="client-list-wrap" aria-labelledby="list-title">
          <h2 id="list-title" class="visually-hidden">Lista de clientes</h2>
          <div id="client-list" class="client-list"></div>
          <p id="client-empty" class="panel-empty" hidden>Nenhum cliente ainda. Clique em <strong>Novo cliente</strong> para começar.</p>
        </section>
      </main>
    </div>
  </div>

  <dialog class="panel-dialog" id="client-dialog" aria-labelledby="client-dialog-title">
    <form id="client-form" class="panel-form panel-form-dialog" method="dialog">
      <header class="dialog-head">
        <div>
          <span class="section-tag">Cliente</span>
          <h2 id="client-dialog-title">Novo cliente</h2>
        </div>
        <button class="dialog-close" type="button" data-close-dialog aria-label="Fechar">×</button>
      </header>

      <input type="hidden" name="id" id="field-id">

      <div class="form-scroll">
        <fieldset class="form-section">
          <legend>Dados do cliente</legend>
          <div class="form-grid">
            <label class="field field-span-2">
              <span>Nome do cliente / empresa</span>
              <input type="text" name="name" id="field-name" required maxlength="120" placeholder="Ex.: Gestifique Ltda">
            </label>

            <label class="field">
              <span>Telefone <em>(opcional)</em></span>
              <input type="tel" name="phone" id="field-phone" maxlength="30" placeholder="(11) 99999-0000" autocomplete="tel">
            </label>

            <label class="field">
              <span>E-mail <em>(opcional)</em></span>
              <input type="email" name="email" id="field-email" maxlength="120" placeholder="contato@empresa.com" autocomplete="email">
            </label>

            <label class="field">
              <span>Data da compra</span>
              <input type="date" name="purchaseDate" id="field-purchase-date" required>
            </label>
          </div>
        </fieldset>

        <fieldset class="form-section">
          <legend>Valores</legend>
          <div class="form-grid">
            <label class="field">
              <span>Valor do orçamento (R$)</span>
              <input type="number" name="budgetValue" id="field-budget-value" min="0" step="0.01" required placeholder="0,00">
            </label>

            <label class="field">
              <span>Valor vendido (R$)</span>
              <input type="number" name="soldValue" id="field-sold-value" min="0" step="0.01" required placeholder="0,00">
              <small>Pode ser menor que o orçamento (desconto).</small>
            </label>
          </div>
        </fieldset>

        <fieldset class="form-section">
          <legend>Status do projeto</legend>
          <div class="form-grid">
            <label class="field field-span-2">
              <span>Status</span>
              <select name="status" id="field-status" required>
                <option value="orcamento">Orçamento</option>
                <option value="aprovado">Aprovado</option>
                <option value="em_andamento">Em andamento</option>
                <option value="entregue">Entregue</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </label>
          </div>

          <div class="reveal-block" data-reveal="status:orcamento" hidden>
            <div class="form-grid">
              <label class="field field-span-2">
                <span>Validade do orçamento</span>
                <input type="date" name="quoteValidUntil" id="field-quote-valid">
                <small>Até quando este orçamento vale.</small>
              </label>
            </div>
          </div>

          <div class="reveal-block" data-reveal="status:aprovado" hidden>
            <div class="form-grid">
              <label class="field field-span-2">
                <span>Data de aprovação</span>
                <input type="date" name="approvalDate" id="field-approval-date">
              </label>
            </div>
          </div>

          <div class="reveal-block" data-reveal="status:em_andamento" hidden>
            <div class="form-grid">
              <label class="field field-span-2">
                <span>Previsão de entrega</span>
                <input type="date" name="deliveryForecast" id="field-delivery-forecast">
              </label>
            </div>
          </div>

          <div class="reveal-block" data-reveal="status:entregue" hidden>
            <div class="form-grid">
              <label class="field field-span-2">
                <span>Data de entrega</span>
                <input type="date" name="deliveryDate" id="field-delivery-date">
              </label>
            </div>
          </div>

          <div class="reveal-block" data-reveal="status:cancelado" hidden>
            <div class="form-grid">
              <label class="field field-span-2">
                <span>Motivo do cancelamento</span>
                <input type="text" name="cancelReason" id="field-cancel-reason" maxlength="255" placeholder="Ex.: cliente desistiu / orçamento estourado">
              </label>
            </div>
          </div>
        </fieldset>

        <fieldset class="form-section">
          <legend>Pagamento</legend>
          <div class="form-grid">
            <label class="field field-span-2">
              <span>Forma de pagamento</span>
              <select name="paymentMethod" id="field-payment" required>
                <option value="a_vista">À vista</option>
                <option value="mensal">Mensal</option>
                <option value="parcelas">Parcelas</option>
              </select>
            </label>
          </div>

          <div class="reveal-block" data-reveal="payment:a_vista" hidden>
            <div class="form-grid">
              <label class="field field-span-2">
                <span>Data do pagamento <em>(opcional)</em></span>
                <input type="date" name="cashPaymentDate" id="field-cash-date">
                <small>Quando o pagamento à vista foi ou será feito.</small>
              </label>
            </div>
          </div>

          <div class="reveal-block" data-reveal="payment:mensal" hidden>
            <div class="form-grid">
              <label class="field">
                <span>Valor mensal (R$)</span>
                <input type="number" name="monthlyValue" id="field-monthly-value" min="0" step="0.01" placeholder="0,00">
              </label>
              <label class="field">
                <span>Dia do vencimento</span>
                <input type="number" name="dueDay" id="field-due-day" min="1" max="28" placeholder="Ex.: 10">
                <small>Dia do mês (1 a 28).</small>
              </label>
              <label class="field field-span-2">
                <span>Início da mensalidade</span>
                <input type="date" name="monthlyStartDate" id="field-monthly-start">
              </label>
            </div>
          </div>

          <div class="reveal-block" data-reveal="payment:parcelas" hidden>
            <div class="form-grid">
              <label class="field">
                <span>Quantidade de parcelas</span>
                <input type="number" name="installmentCount" id="field-installment-count" min="2" max="120" placeholder="Ex.: 12">
              </label>
              <label class="field">
                <span>Valor de cada parcela (R$)</span>
                <input type="number" name="installmentValue" id="field-installment-value" min="0" step="0.01" placeholder="0,00">
                <small id="installment-hint">Calculado automaticamente pelo valor vendido.</small>
              </label>
              <label class="field">
                <span>Data da 1ª parcela</span>
                <input type="date" name="firstInstallmentDate" id="field-first-installment">
              </label>
              <label class="field">
                <span>Parcelas já pagas</span>
                <input type="number" name="installmentsPaid" id="field-installments-paid" min="0" max="120" value="0">
              </label>
            </div>
          </div>
        </fieldset>

        <fieldset class="form-section">
          <legend>Manutenção e renovação</legend>
          <div class="form-grid">
            <label class="field">
              <span>Período manutenção (dias)</span>
              <input type="number" name="maintenanceDays" id="field-maintenance-days" min="0" step="1" required value="90">
            </label>

            <label class="field">
              <span>Período renovação (dias)</span>
              <input type="number" name="renewalDays" id="field-renewal-days" min="0" step="1" required value="365">
            </label>
          </div>
        </fieldset>

        <fieldset class="form-section">
          <legend>Documento e observações</legend>
          <div class="form-grid">
            <div class="field field-span-2">
              <span>Documento do orçamento</span>
              <div class="file-row">
                <input type="file" name="document" id="field-document">
                <div id="document-current" class="file-current" hidden></div>
              </div>
              <small>PDF, Excel (.xlsx), Word, imagens ou zip. Máx. 20 MB.</small>
            </div>

            <label class="field field-span-2">
              <span>Observações <em>(opcional)</em></span>
              <textarea name="notes" id="field-notes" rows="3" maxlength="5000" placeholder="Combinados, pendências, detalhes internos…"></textarea>
            </label>
          </div>
        </fieldset>
      </div>

      <footer class="dialog-foot">
        <button class="btn btn-ghost" type="button" data-close-dialog>Cancelar</button>
        <button class="btn btn-primary" type="submit">Salvar cliente</button>
      </footer>
    </form>
  </dialog>

  <script type="module" src="js/panel.js"></script>
</body>
</html>
