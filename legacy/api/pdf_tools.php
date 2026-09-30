<?php
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';
require __DIR__ . '/auth_lib.php';
require __DIR__ . '/pdf_lib.php';

send_security_headers();
require_api_auth();
pdf_cleanup_old_jobs();

$action = (string) ($_GET['action'] ?? $_POST['action'] ?? 'capabilities');

try {
    match ($action) {
        'capabilities' => handle_capabilities(),
        'merge' => handle_merge(),
        'split' => handle_split(),
        'images_to_pdf' => handle_images_to_pdf(),
        'file_to_pdf' => handle_file_to_pdf(),
        'pdf_to_images' => handle_pdf_to_images(),
        'pdf_to_txt' => handle_pdf_to_txt(),
        'pdf_to_docx' => handle_pdf_to_docx(),
        'compress' => handle_compress(),
        'protect' => handle_protect(),
        'unlock' => handle_unlock(),
        'watermark' => handle_watermark(),
        'ocr' => handle_ocr(),
        'download' => handle_download(),
        default => json_error('Ação inválida.', 400),
    };
} catch (Throwable $e) {
    json_error('Erro ao processar PDF.', 500);
}

function handle_capabilities(): void
{
    json_response(['ok' => true, 'capabilities' => pdf_capabilities()]);
}

function require_pdf_csrf(): void
{
    if (request_method() !== 'POST' && request_method() !== 'GET') {
        json_error('Método não permitido.', 405);
    }
    if (in_array(request_method(), ['POST', 'PUT', 'PATCH', 'DELETE'], true)) {
        require_csrf();
    }
}

function finish_download_payload(string $jobId, string $filePath, string $downloadName): void
{
    if (!is_file($filePath)) {
        json_error('Arquivo de resultado não encontrado.', 500);
    }
    start_app_session();
    $_SESSION['pdf_downloads'][$jobId] = [
        'path' => $filePath,
        'name' => $downloadName,
        'expires' => time() + 3600,
    ];
    json_response([
        'ok' => true,
        'jobId' => $jobId,
        'fileName' => $downloadName,
        'downloadUrl' => '../api/pdf_tools.php?action=download&job=' . rawurlencode($jobId),
    ]);
}

function handle_merge(): void
{
    require_pdf_csrf();
    if (request_method() !== 'POST') {
        json_error('Método não permitido.', 405);
    }
    $job = pdf_new_job();
    $paths = pdf_store_uploads($job['input'], 'files', ['pdf']);
    $out = $job['dir'] . '/unido.pdf';
    pdf_merge($paths, $out);
    finish_download_payload($job['id'], $out, 'pdfs-unidos.pdf');
}

function handle_split(): void
{
    require_pdf_csrf();
    if (request_method() !== 'POST') {
        json_error('Método não permitido.', 405);
    }
    $job = pdf_new_job();
    $paths = pdf_store_uploads($job['input'], 'file', ['pdf']);
    $ranges = trim((string) ($_POST['ranges'] ?? ''));
    $mode = (string) ($_POST['mode'] ?? 'all');
    $outDir = $job['dir'] . '/pages';
    mkdir($outDir, 0755, true);

    if ($mode === 'range' || $ranges !== '') {
        $files = pdf_split_ranges($paths[0], $ranges, $outDir);
        if (count($files) === 1) {
            finish_download_payload($job['id'], $files[0], 'paginas-selecionadas.pdf');
        }
    } else {
        $files = pdf_split_all($paths[0], $outDir);
    }

    if (count($files) === 1) {
        finish_download_payload($job['id'], $files[0], basename($files[0]));
    }

    $zip = $job['dir'] . '/paginas.zip';
    pdf_zip_files($files, $zip);
    finish_download_payload($job['id'], $zip, 'pdf-paginas.zip');
}

function handle_images_to_pdf(): void
{
    require_pdf_csrf();
    if (request_method() !== 'POST') {
        json_error('Método não permitido.', 405);
    }
    $job = pdf_new_job();
    $paths = pdf_store_uploads($job['input'], 'files', ['png', 'jpg', 'jpeg', 'webp', 'gif']);
    $out = $job['dir'] . '/imagens.pdf';
    pdf_images_to_pdf($paths, $out);
    finish_download_payload($job['id'], $out, 'imagens.pdf');
}

function handle_file_to_pdf(): void
{
    require_pdf_csrf();
    if (request_method() !== 'POST') {
        json_error('Método não permitido.', 405);
    }
    $job = pdf_new_job();
    $paths = pdf_store_uploads($job['input'], 'file', [
        'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'odt', 'ods', 'odp', 'txt', 'rtf', 'csv',
    ]);
    $out = pdf_file_to_pdf($paths[0], $job['dir']);
    finish_download_payload($job['id'], $out, pathinfo($out, PATHINFO_BASENAME));
}

function handle_pdf_to_images(): void
{
    require_pdf_csrf();
    if (request_method() !== 'POST') {
        json_error('Método não permitido.', 405);
    }
    $job = pdf_new_job();
    $paths = pdf_store_uploads($job['input'], 'file', ['pdf']);
    $format = (string) ($_POST['format'] ?? 'png');
    $outDir = $job['dir'] . '/images';
    mkdir($outDir, 0755, true);
    $files = pdf_to_images($paths[0], $outDir, $format);
    $zip = $job['dir'] . '/imagens.zip';
    pdf_zip_files($files, $zip);
    finish_download_payload($job['id'], $zip, 'pdf-imagens.zip');
}

function handle_pdf_to_txt(): void
{
    require_pdf_csrf();
    if (request_method() !== 'POST') {
        json_error('Método não permitido.', 405);
    }
    $job = pdf_new_job();
    $paths = pdf_store_uploads($job['input'], 'file', ['pdf']);
    $out = $job['dir'] . '/texto.txt';
    pdf_to_text($paths[0], $out);
    finish_download_payload($job['id'], $out, 'texto-extraido.txt');
}

function handle_pdf_to_docx(): void
{
    require_pdf_csrf();
    if (request_method() !== 'POST') {
        json_error('Método não permitido.', 405);
    }
    $job = pdf_new_job();
    $paths = pdf_store_uploads($job['input'], 'file', ['pdf']);
    $out = pdf_to_docx($paths[0], $job['dir']);
    finish_download_payload($job['id'], $out, pathinfo($out, PATHINFO_BASENAME));
}

function handle_compress(): void
{
    require_pdf_csrf();
    if (request_method() !== 'POST') {
        json_error('Método não permitido.', 405);
    }
    $job = pdf_new_job();
    $paths = pdf_store_uploads($job['input'], 'file', ['pdf']);
    $out = $job['dir'] . '/comprimido.pdf';
    pdf_compress($paths[0], $out);
    finish_download_payload($job['id'], $out, 'pdf-comprimido.pdf');
}

function handle_protect(): void
{
    require_pdf_csrf();
    if (request_method() !== 'POST') {
        json_error('Método não permitido.', 405);
    }
    $password = (string) ($_POST['password'] ?? '');
    $job = pdf_new_job();
    $paths = pdf_store_uploads($job['input'], 'file', ['pdf']);
    $out = $job['dir'] . '/protegido.pdf';
    pdf_protect($paths[0], $out, $password);
    finish_download_payload($job['id'], $out, 'pdf-protegido.pdf');
}

function handle_unlock(): void
{
    require_pdf_csrf();
    if (request_method() !== 'POST') {
        json_error('Método não permitido.', 405);
    }
    $password = (string) ($_POST['password'] ?? '');
    if ($password === '') {
        json_error('Informe a senha atual do PDF.');
    }
    $job = pdf_new_job();
    $paths = pdf_store_uploads($job['input'], 'file', ['pdf']);
    $out = $job['dir'] . '/sem-senha.pdf';
    pdf_unlock($paths[0], $out, $password);
    finish_download_payload($job['id'], $out, 'pdf-sem-senha.pdf');
}

function handle_watermark(): void
{
    require_pdf_csrf();
    if (request_method() !== 'POST') {
        json_error('Método não permitido.', 405);
    }
    $text = (string) ($_POST['text'] ?? '');
    $job = pdf_new_job();
    $paths = pdf_store_uploads($job['input'], 'file', ['pdf']);
    $out = $job['dir'] . '/marca-dagua.pdf';
    pdf_watermark($paths[0], $out, $text);
    finish_download_payload($job['id'], $out, 'pdf-marca-dagua.pdf');
}

function handle_ocr(): void
{
    require_pdf_csrf();
    if (request_method() !== 'POST') {
        json_error('Método não permitido.', 405);
    }
    $job = pdf_new_job();
    $paths = pdf_store_uploads($job['input'], 'file', ['pdf']);
    $out = $job['dir'] . '/ocr.txt';
    pdf_ocr($paths[0], $out);
    finish_download_payload($job['id'], $out, 'pdf-ocr.txt');
}

function handle_download(): void
{
    if (request_method() !== 'GET') {
        json_error('Método não permitido.', 405);
    }
    start_app_session();
    $job = preg_replace('/[^a-f0-9]/', '', (string) ($_GET['job'] ?? '')) ?? '';
    if ($job === '' || empty($_SESSION['pdf_downloads'][$job])) {
        http_response_code(404);
        header('Content-Type: text/plain; charset=utf-8');
        echo 'Download não encontrado ou expirado.';
        exit;
    }

    $meta = $_SESSION['pdf_downloads'][$job];
    if (($meta['expires'] ?? 0) < time() || empty($meta['path']) || !is_file($meta['path'])) {
        unset($_SESSION['pdf_downloads'][$job]);
        http_response_code(404);
        header('Content-Type: text/plain; charset=utf-8');
        echo 'Download expirado.';
        exit;
    }

    $path = (string) $meta['path'];
    $name = str_replace(['"', "\r", "\n"], '', (string) $meta['name']);
    $mime = 'application/octet-stream';
    $ext = strtolower(pathinfo($path, PATHINFO_EXTENSION));
    $map = [
        'pdf' => 'application/pdf',
        'zip' => 'application/zip',
        'txt' => 'text/plain; charset=utf-8',
        'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'png' => 'image/png',
        'jpg' => 'image/jpeg',
    ];
    if (isset($map[$ext])) {
        $mime = $map[$ext];
    }

    header('Content-Type: ' . $mime);
    header('X-Content-Type-Options: nosniff');
    header('Content-Length: ' . (string) filesize($path));
    header('Content-Disposition: attachment; filename="' . $name . '"');
    header('Cache-Control: private, no-store');
    readfile($path);
    exit;
}
