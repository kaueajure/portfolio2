<?php
declare(strict_types=1);
require __DIR__ . '/../api/bootstrap.php';
require __DIR__ . '/../api/auth_lib.php';
require_page_auth();
send_security_headers();
$csrf = htmlspecialchars(csrf_token(), ENT_QUOTES, 'UTF-8');
$userName = htmlspecialchars((string) ($_SESSION['usuario_nome'] ?? ''), ENT_QUOTES, 'UTF-8');
$activeNav = 'propostas';
$id = (int) ($_GET['id'] ?? 0);
$pageTitle = $id > 0 ? 'Editar proposta' : 'Nova proposta';
require __DIR__ . '/partials/shell-start.php';
?>

      <header class="panel-topbar">
        <div>
          <span class="section-tag">Propostas</span>
          <h1 id="edit-page-title"><?= $id > 0 ? 'Editar proposta' : 'Nova proposta' ?></h1>
          <p class="proposal-edit-code" id="edit-code" hidden></p>
        </div>
        <div class="panel-topbar-actions">
          <a class="btn btn-ghost" href="propostas.php">Voltar</a>
          <button class="btn btn-ghost" type="button" id="btn-pdf" hidden>PDF</button>
          <button class="btn btn-ghost" type="button" id="btn-copy-link">Copiar link</button>
          <button class="btn btn-primary" type="button" id="btn-save">Salvar</button>
        </div>
      </header>

      <main id="conteudo" class="panel-content proposal-edit">
        <p id="edit-status" class="panel-empty" role="status"></p>

        <section class="proposal-edit-grid">
          <div class="proposal-edit-main">
            <form id="proposal-form" class="panel-form">
              <input type="hidden" id="proposal-id" value="<?= $id > 0 ? (string) $id : '' ?>">
              <div class="form-grid">
                <label class="field field-span-2">
                  <span>Título</span>
                  <input type="text" id="field-title" required maxlength="200" placeholder="Ex.: Site institucional + SEO">
                </label>
                <label class="field">
                  <span>Cliente <em>(opcional)</em></span>
                  <select id="field-client">
                    <option value="">Sem cliente</option>
                  </select>
                </label>
                <label class="field">
                  <span>Validade</span>
                  <input type="date" id="field-valid-until">
                </label>
                <label class="field field-span-2">
                  <span>Escopo</span>
                  <textarea id="field-scope" rows="4" maxlength="20000" placeholder="O que está incluso…"></textarea>
                </label>
                <label class="field field-span-2">
                  <span>Condições</span>
                  <textarea id="field-conditions" rows="3" maxlength="20000" placeholder="Pagamento, prazo, observações…"></textarea>
                </label>
              </div>
            </form>

            <section class="proposal-items-panel">
              <header class="proposal-items-head">
                <h2>Itens</h2>
                <button class="btn btn-ghost" type="button" id="btn-add-custom">Item avulso</button>
              </header>
              <div id="items-list" class="proposal-items-list"></div>
              <p id="items-empty" class="panel-empty">Nenhum item. Adicione do catálogo ou um item avulso.</p>
            </section>
          </div>

          <aside class="proposal-edit-side">
            <section class="proposal-side-block">
              <h2>Catálogo</h2>
              <div id="catalog-list" class="catalog-list"></div>
            </section>

            <section class="proposal-side-block proposal-totals-box">
              <h2>Totais</h2>
              <label class="field">
                <span>Desconto %</span>
                <input type="number" id="field-discount-percent" min="0" max="100" step="0.01" value="0">
              </label>
              <label class="field">
                <span>Desconto R$</span>
                <input type="number" id="field-discount-value" min="0" step="0.01" value="0">
              </label>
              <p class="proposal-hint">Use % ou R$ — se os dois tiverem valor, o % prevalece.</p>
              <div class="proposal-totals-rows">
                <div><span>Subtotal</span><strong id="live-subtotal">R$ 0,00</strong></div>
                <div><span>Desconto</span><strong id="live-discount">R$ 0,00</strong></div>
                <div class="is-grand"><span>Total</span><strong id="live-total">R$ 0,00</strong></div>
              </div>
              <p class="proposal-status-pill" id="live-status">rascunho</p>
              <div class="proposal-viewers" id="proposal-viewers" hidden>
                <h3>Quem viu</h3>
                <ul id="proposal-viewers-list"></ul>
              </div>
            </section>
          </aside>
        </section>
      </main>

  <script type="module" src="js/proposal-edit.js"></script>

<?php require __DIR__ . '/partials/shell-end.php'; ?>
