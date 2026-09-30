<?php
declare(strict_types=1);
require __DIR__ . '/../api/bootstrap.php';
require __DIR__ . '/../api/auth_lib.php';
require_page_auth();
send_security_headers();
$csrf = htmlspecialchars(csrf_token(), ENT_QUOTES, 'UTF-8');
$userName = htmlspecialchars((string) ($_SESSION['usuario_nome'] ?? ''), ENT_QUOTES, 'UTF-8');
$activeNav = 'notas';
$pageTitle = 'Notas';
require __DIR__ . '/partials/shell-start.php';
?>

      <header class="panel-topbar">
        <div>
          <span class="section-tag">Painel</span>
          <h1>Notas</h1>
        </div>
        <button class="btn btn-primary" type="button" data-open-note>Nova nota</button>
      </header>

      <main id="conteudo" class="panel-content">
        <div id="notes-list" class="notes-list"></div>
        <p id="notes-empty" class="panel-empty" hidden>Nenhuma nota ainda.</p>
      </main>

  <dialog class="panel-dialog" id="note-dialog" aria-labelledby="note-dialog-title">
    <form id="note-form" class="panel-form panel-form-dialog" method="dialog">
      <header class="dialog-head">
        <div>
          <span class="section-tag">Nota</span>
          <h2 id="note-dialog-title">Nova nota</h2>
        </div>
        <button class="dialog-close" type="button" data-close-note aria-label="Fechar">×</button>
      </header>
      <input type="hidden" name="id" id="note-id">
      <div class="form-grid">
        <label class="field field-span-2">
          <span>Título</span>
          <input type="text" name="title" id="note-title" required maxlength="160">
        </label>
        <label class="field field-span-2">
          <span>Cliente <em>(opcional)</em></span>
          <select name="clientId" id="note-client">
            <option value="">Sem cliente</option>
          </select>
        </label>
        <label class="field field-span-2">
          <span>Conteúdo</span>
          <textarea name="content" id="note-content" rows="6" required maxlength="20000"></textarea>
        </label>
      </div>
      <footer class="dialog-foot">
        <button class="btn btn-ghost" type="button" data-close-note>Cancelar</button>
        <button class="btn btn-primary" type="submit">Salvar</button>
      </footer>
    </form>
  </dialog>

  <script type="module" src="js/notes.js"></script>
<?php require __DIR__ . '/partials/shell-end.php'; ?>
