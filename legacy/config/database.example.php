<?php
/**
 * Copie este arquivo para database.php e preencha com os dados do MySQL (Hostinger).
 * database.php NÃO deve ir para o Git.
 */
return [
    'host' => 'localhost',
    'port' => 3306,
    'name' => 'nome_do_banco',
    'user' => 'usuario_mysql',
    'pass' => 'senha_mysql',
    'charset' => 'utf8mb4',
    // Só preencha se precisar recriar senha de um usuário (URL /login/?setup=TOKEN).
    // Deixe vazio em produção normal — desativa o endpoint de setup.
    'setup_token' => '',
];
