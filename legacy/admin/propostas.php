<?php
declare(strict_types=1);
require __DIR__ . '/../api/bootstrap.php';
require __DIR__ . '/../api/auth_lib.php';
require_page_auth();
send_security_headers();
$csrf = htmlspecialchars(csrf_token(), ENT_QUOTES, 'UTF-8');
$userName = htmlspecialchars((string) ($_SESSION['usuario_nome'] ?? ''), ENT_QUOTES, 'UTF-8');
$activeNav = 'propostas';
$pageTitle = 'Propostas';
require __DIR__ . '/partials/shell-start.php';
?>

      <header class="panel-topbar">
        <div>
          <span class="section-tag">Painel</span>
          <h1>Propostas</h1>
        </div>
        <div class="panel-topbar-actions">
          <button class="btn btn-ghost" type="button" data-open-products>Catálogo</button>
          <a class="btn btn-primary" href="proposta-editar.php">Nova proposta</a>
        </div>
      </header>

      <main id="conteudo" class="panel-content">
        <section class="panel-toolbar">
          <label class="field field-inline">
            <span class="visually-hidden">Buscar</span>
            <input type="search" id="proposal-search" placeholder="Buscar código, título ou cliente…" autocomplete="off">
          </label>
          <label class="field field-inline">
            <span class="visually-hidden">Status</span>
            <select id="proposal-filter-status">
              <option value="">Todos os status</option>
              <option value="rascunho">Rascunho</option>
              <option value="enviada">Enviada</option>
              <option value="visualizada">Visualizada</option>
              <option value="aceita">Aceita</option>
              <option value="recusada">Recusada</option>
              <option value="expirada">Expirada</option>
              <option value="cancelada">Cancelada</option>
            </select>
          </label>
        </section>

        <div id="proposals-list" class="proposals-list"></div>
        <p id="proposals-empty" class="panel-empty" hidden>Nenhuma proposta ainda.</p>
      </main>

  <dialog class="panel-dialog" id="products-dialog" aria-labelledby="products-dialog-title">
    <div class="panel-form panel-form-dialog products-dialog-inner">
      <header class="dialog-head">
        <div>
          <span class="section-tag">Catálogo</span>
          <h2 id="products-dialog-title">Produtos e serviços</h2>
        </div>
        <button class="dialog-close" type="button" data-close-products aria-label="Fechar">×</button>
      </header>

      <form id="product-form" class="product-form-inline">
        <input type="hidden" name="id" id="product-id">
        <div class="form-grid">
          <label class="field">
            <span>Nome</span>
            <input type="text" name="name" id="product-name" required maxlength="160">
          </label>
          <label class="field">
            <span>Tipo</span>
            <select name="priceType" id="product-price-type">
              <option value="fixo">Preço fixo</option>
              <option value="hora">Por hora</option>
            </select>
          </label>
          <label class="field">
            <span>Preço (R$)</span>
            <input type="number" name="price" id="product-price" min="0" step="0.01" required>
          </label>
          <label class="field field-span-2">
            <span>Descrição</span>
            <input type="text" name="description" id="product-description" maxlength="5000">
          </label>
        </div>
        <div class="dialog-foot" style="padding-inline:0;border:0;margin-top:0.5rem">
          <button class="btn btn-ghost" type="button" id="product-form-reset">Limpar</button>
          <button class="btn btn-primary" type="submit">Salvar produto</button>
        </div>
      </form>

      <div id="products-admin-list" class="products-admin-list"></div>
    </div>
  </dialog>

  <script type="module" src="js/proposals.js"></script>

<?php require __DIR__ . '/partials/shell-end.php'; ?>
