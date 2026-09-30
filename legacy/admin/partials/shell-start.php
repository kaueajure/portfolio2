<?php
declare(strict_types=1);

/**
 * @var string $activeNav
 * @var string $pageTitle
 * @var string $csrf
 * @var string $userName
 */
$activeNav = $activeNav ?? 'dashboard';
$pageTitle = $pageTitle ?? 'Painel';
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="noindex, nofollow">
  <meta name="theme-color" content="#15181C">
  <meta name="csrf-token" content="<?= $csrf ?>">
  <title><?= htmlspecialchars($pageTitle, ENT_QUOTES, 'UTF-8') ?> — Painel Kauê Ajure</title>
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
        <a href="dashboard.php" class="<?= $activeNav === 'dashboard' ? 'is-active' : '' ?>" <?= $activeNav === 'dashboard' ? 'aria-current="page"' : '' ?>>Dashboard</a>
        <a href="./" class="<?= $activeNav === 'clientes' ? 'is-active' : '' ?>" <?= $activeNav === 'clientes' ? 'aria-current="page"' : '' ?>>Clientes</a>
        <a href="propostas.php" class="<?= $activeNav === 'propostas' ? 'is-active' : '' ?>" <?= $activeNav === 'propostas' ? 'aria-current="page"' : '' ?>>Propostas</a>
        <a href="agenda.php" class="<?= $activeNav === 'agenda' ? 'is-active' : '' ?>" <?= $activeNav === 'agenda' ? 'aria-current="page"' : '' ?>>Agenda</a>
        <a href="notas.php" class="<?= $activeNav === 'notas' ? 'is-active' : '' ?>" <?= $activeNav === 'notas' ? 'aria-current="page"' : '' ?>>Notas</a>
        <a href="pdf.php" class="<?= $activeNav === 'pdf' ? 'is-active' : '' ?>" <?= $activeNav === 'pdf' ? 'aria-current="page"' : '' ?>>PDF</a>
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
