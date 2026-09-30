<?php
declare(strict_types=1);
require __DIR__ . '/../api/bootstrap.php';
require __DIR__ . '/../api/auth_lib.php';
require_page_auth();
send_security_headers();
$csrf = htmlspecialchars(csrf_token(), ENT_QUOTES, 'UTF-8');
$userName = htmlspecialchars((string) ($_SESSION['usuario_nome'] ?? ''), ENT_QUOTES, 'UTF-8');
$activeNav = 'agenda';
$pageTitle = 'Agenda';
require __DIR__ . '/partials/shell-start.php';
?>

      <header class="panel-topbar">
        <div>
          <span class="section-tag">Painel</span>
          <h1>Agenda</h1>
        </div>
      </header>

      <main id="conteudo" class="panel-content">
        <section class="panel-toolbar">
          <label class="field field-inline">
            <span class="visually-hidden">Filtro</span>
            <select id="agenda-filter">
              <option value="30">Próximos 30 dias + atrasados</option>
              <option value="7">Próximos 7 dias + atrasados</option>
              <option value="all">Todos</option>
              <option value="overdue">Só atrasados</option>
            </select>
          </label>
        </section>
        <div id="agenda-list" class="agenda-list"></div>
        <p id="agenda-empty" class="panel-empty" hidden>Nenhum evento neste filtro.</p>
      </main>

  <script type="module" src="js/agenda.js"></script>
<?php require __DIR__ . '/partials/shell-end.php'; ?>
