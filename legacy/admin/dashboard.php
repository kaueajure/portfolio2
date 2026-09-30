<?php
declare(strict_types=1);
require __DIR__ . '/../api/bootstrap.php';
require __DIR__ . '/../api/auth_lib.php';
require_page_auth();
send_security_headers();
$csrf = htmlspecialchars(csrf_token(), ENT_QUOTES, 'UTF-8');
$userName = htmlspecialchars((string) ($_SESSION['usuario_nome'] ?? ''), ENT_QUOTES, 'UTF-8');
$activeNav = 'dashboard';
$pageTitle = 'Dashboard';
require __DIR__ . '/partials/shell-start.php';
?>

      <header class="panel-topbar">
        <div>
          <span class="section-tag">Painel</span>
          <h1>Dashboard</h1>
        </div>
      </header>

      <main id="conteudo" class="panel-content">
        <section class="panel-stats" id="dash-stats" aria-label="Resumo"></section>

        <section class="dash-panels">
          <article class="dash-panel">
            <header>
              <h2>Status dos clientes</h2>
            </header>
            <ul class="dash-status" id="dash-status"></ul>
          </article>
          <article class="dash-panel">
            <header>
              <h2>Próximos 30 dias</h2>
              <a href="agenda.php">Ver agenda</a>
            </header>
            <div id="dash-upcoming" class="agenda-list"></div>
          </article>
        </section>
      </main>

  <script type="module" src="js/dashboard.js"></script>
<?php require __DIR__ . '/partials/shell-end.php'; ?>
