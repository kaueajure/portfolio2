<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/vendor/autoload.php';

use setasign\Fpdi\Fpdi;

function pdf_jobs_dir(): string
{
    $dir = dirname(__DIR__) . '/storage/pdf_jobs';
    if (!is_dir($dir) && !mkdir($dir, 0755, true) && !is_dir($dir)) {
        json_error('Não foi possível criar pasta temporária de PDF.', 500);
    }
    return $dir;
}

function pdf_new_job(): array
{
    $id = bin2hex(random_bytes(16));
    $dir = pdf_jobs_dir() . '/' . $id;
    if (!mkdir($dir, 0755, true) && !is_dir($dir)) {
        json_error('Falha ao criar job de PDF.', 500);
    }
    $input = $dir . '/input';
    mkdir($input, 0755, true);
    return ['id' => $id, 'dir' => $dir, 'input' => $input];
}

function pdf_cleanup_old_jobs(int $maxAgeSeconds = 3600): void
{
    $root = pdf_jobs_dir();
    $now = time();
    foreach (glob($root . '/*', GLOB_ONLYDIR) ?: [] as $dir) {
        $mtime = filemtime($dir) ?: $now;
        if (($now - $mtime) > $maxAgeSeconds) {
            pdf_rrmdir($dir);
        }
    }
}

function pdf_rrmdir(string $dir): void
{
    if (!is_dir($dir)) {
        return;
    }
    $items = scandir($dir) ?: [];
    foreach ($items as $item) {
        if ($item === '.' || $item === '..') {
            continue;
        }
        $path = $dir . '/' . $item;
        if (is_dir($path)) {
            pdf_rrmdir($path);
        } else {
            @unlink($path);
        }
    }
    @rmdir($dir);
}

function pdf_which(string $bin): ?string
{
    $path = trim((string) shell_exec('command -v ' . escapeshellarg($bin) . ' 2>/dev/null'));
    return $path !== '' ? $path : null;
}

function pdf_run(string $command, string $errorMessage): void
{
    $output = [];
    $code = 0;
    exec($command . ' 2>&1', $output, $code);
    if ($code !== 0) {
        json_error($errorMessage . ' ' . implode(' ', array_slice($output, 0, 4)));
    }
}

function pdf_zip_files(array $files, string $zipPath): void
{
    $zipBin = pdf_which('zip');
    if ($zipBin) {
        $list = '';
        foreach ($files as $file) {
            $list .= ' ' . escapeshellarg($file);
        }
        $cwd = dirname($zipPath);
        $cmd = 'cd ' . escapeshellarg($cwd) . ' && ' . escapeshellarg($zipBin) . ' -j -q ' . escapeshellarg($zipPath);
        foreach ($files as $file) {
            $cmd .= ' ' . escapeshellarg(basename($file));
        }
        // Better: zip with full paths using -j from file list in same dir
        $names = array_map('basename', $files);
        // copy to temp flat dir if needed - files may already be in same folder
        $cmd = escapeshellarg($zipBin) . ' -j -q ' . escapeshellarg($zipPath);
        foreach ($files as $file) {
            $cmd .= ' ' . escapeshellarg($file);
        }
        pdf_run($cmd, 'Falha ao compactar arquivos.');
        return;
    }

    if (class_exists('ZipArchive')) {
        $zip = new ZipArchive();
        if ($zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
            json_error('Falha ao criar ZIP.');
        }
        foreach ($files as $file) {
            $zip->addFile($file, basename($file));
        }
        $zip->close();
        return;
    }

    json_error('Compactação ZIP indisponível neste servidor.');
}

function pdf_merge(array $pdfPaths, string $outputPath): void
{
    if (count($pdfPaths) < 2) {
        json_error('Envie pelo menos 2 PDFs para unir.');
    }

    $pdf = new Fpdi();
    $pdf->SetCreator('Painel Kauê Ajure');

    foreach ($pdfPaths as $path) {
        $pageCount = $pdf->setSourceFile($path);
        for ($page = 1; $page <= $pageCount; $page++) {
            $tpl = $pdf->importPage($page);
            $size = $pdf->getTemplateSize($tpl);
            $pdf->AddPage($size['orientation'], [$size['width'], $size['height']]);
            $pdf->useTemplate($tpl);
        }
    }

    $pdf->Output('F', $outputPath);
}

function pdf_split_all(string $pdfPath, string $outputDir): array
{
    if (!is_dir($outputDir) && !mkdir($outputDir, 0755, true) && !is_dir($outputDir)) {
        json_error('Não foi possível criar pasta de páginas.', 500);
    }

    $probe = new Fpdi();
    $pageCount = $probe->setSourceFile($pdfPath);
    $files = [];

    for ($page = 1; $page <= $pageCount; $page++) {
        $out = new Fpdi();
        $out->setSourceFile($pdfPath);
        $tpl = $out->importPage($page);
        $size = $out->getTemplateSize($tpl);
        $out->AddPage($size['orientation'], [$size['width'], $size['height']]);
        $out->useTemplate($tpl);
        $file = $outputDir . '/pagina-' . str_pad((string) $page, 3, '0', STR_PAD_LEFT) . '.pdf';
        $out->Output('F', $file);
        $files[] = $file;
    }

    return $files;
}

function pdf_split_ranges(string $pdfPath, string $ranges, string $outputDir): array
{
    $ranges = trim($ranges);
    if ($ranges === '') {
        return pdf_split_all($pdfPath, $outputDir);
    }

    $pages = pdf_parse_page_ranges($ranges);
    if (!$pages) {
        json_error('Intervalo de páginas inválido. Ex.: 1-3,5,8-10');
    }

    $probe = new Fpdi();
    $total = $probe->setSourceFile($pdfPath);
    foreach ($pages as $p) {
        if ($p < 1 || $p > $total) {
            json_error("Página {$p} fora do intervalo (1–{$total}).");
        }
    }

    $out = new Fpdi();
    $out->setSourceFile($pdfPath);

    foreach ($pages as $page) {
        $tpl = $out->importPage($page);
        $size = $out->getTemplateSize($tpl);
        $out->AddPage($size['orientation'], [$size['width'], $size['height']]);
        $out->useTemplate($tpl);
    }

    $file = $outputDir . '/paginas-selecionadas.pdf';
    $out->Output('F', $file);
    return [$file];
}

/** @return list<int> */
function pdf_parse_page_ranges(string $ranges): array
{
    $pages = [];
    foreach (preg_split('/\s*,\s*/', $ranges) ?: [] as $part) {
        if ($part === '') {
            continue;
        }
        if (preg_match('/^(\d+)\s*-\s*(\d+)$/', $part, $m)) {
            $a = (int) $m[1];
            $b = (int) $m[2];
            if ($a > $b) {
                [$a, $b] = [$b, $a];
            }
            for ($i = $a; $i <= $b; $i++) {
                $pages[] = $i;
            }
            continue;
        }
        if (preg_match('/^\d+$/', $part)) {
            $pages[] = (int) $part;
            continue;
        }
        return [];
    }
    return array_values(array_unique($pages));
}

function pdf_images_to_pdf(array $imagePaths, string $outputPath): void
{
    if (!$imagePaths) {
        json_error('Envie ao menos uma imagem.');
    }

    $pdf = new Fpdi();
    $pdf->SetCreator('Painel Kauê Ajure');

    foreach ($imagePaths as $image) {
        $info = @getimagesize($image);
        if ($info === false) {
            json_error('Arquivo de imagem inválido: ' . basename($image));
        }
        [$pxW, $pxH] = $info;
        $mime = $info['mime'] ?? '';

        $pathForPdf = $image;
        if ($mime === 'image/webp') {
            $converted = dirname($outputPath) . '/conv_' . bin2hex(random_bytes(4)) . '.png';
            $im = @imagecreatefromwebp($image);
            if (!$im || !imagepng($im, $converted)) {
                json_error('Não foi possível processar WEBP: ' . basename($image));
            }
            imagedestroy($im);
            $pathForPdf = $converted;
            $info = getimagesize($pathForPdf) ?: $info;
            [$pxW, $pxH] = $info;
        }

        $orientation = $pxW >= $pxH ? 'L' : 'P';
        $pageW = $orientation === 'P' ? 210 : 297;
        $pageH = $orientation === 'P' ? 297 : 210;
        $pdf->AddPage($orientation, 'A4');

        $ratio = min($pageW / $pxW, $pageH / $pxH);
        $drawW = $pxW * $ratio;
        $drawH = $pxH * $ratio;
        $x = ($pageW - $drawW) / 2;
        $y = ($pageH - $drawH) / 2;
        $pdf->Image($pathForPdf, $x, $y, $drawW, $drawH);
    }

    $pdf->Output('F', $outputPath);
}

function pdf_file_to_pdf(string $inputPath, string $outputDir): string
{
    $soffice = pdf_which('soffice') ?: pdf_which('libreoffice');
    if (!$soffice) {
        json_error('Conversão de arquivos Office indisponível (LibreOffice não encontrado no servidor).');
    }

    $cmd = escapeshellarg($soffice)
        . ' --headless --nologo --nolockcheck --nodefault --nofirststartwizard'
        . ' --convert-to pdf --outdir ' . escapeshellarg($outputDir)
        . ' ' . escapeshellarg($inputPath);
    pdf_run($cmd, 'Falha ao converter arquivo para PDF.');

    $base = pathinfo($inputPath, PATHINFO_FILENAME);
    $out = $outputDir . '/' . $base . '.pdf';
    if (!is_file($out)) {
        // LibreOffice may sanitize name
        $pdfs = glob($outputDir . '/*.pdf') ?: [];
        if (!$pdfs) {
            json_error('Conversão concluída, mas o PDF não foi encontrado.');
        }
        $out = $pdfs[0];
    }
    return $out;
}

function pdf_to_images(string $pdfPath, string $outputDir, string $format = 'png'): array
{
    $format = strtolower($format) === 'jpg' ? 'jpg' : 'png';
    $gs = pdf_which('gs');
    if (!$gs) {
        json_error('Conversão PDF → imagem indisponível (Ghostscript não encontrado).');
    }

    if (!is_dir($outputDir) && !mkdir($outputDir, 0755, true) && !is_dir($outputDir)) {
        json_error('Não foi possível criar pasta de imagens.', 500);
    }

    $device = $format === 'jpg' ? 'jpeg' : 'png16m';
    $pattern = $outputDir . '/pagina-%03d.' . $format;
    $cmd = escapeshellarg($gs)
        . ' -dSAFER -dBATCH -dNOPAUSE -dQUIET'
        . ' -sDEVICE=' . escapeshellarg($device)
        . ' -r150'
        . ' -sOutputFile=' . escapeshellarg($pattern)
        . ' ' . escapeshellarg($pdfPath);
    pdf_run($cmd, 'Falha ao converter PDF em imagens.');

    $files = glob($outputDir . '/pagina-*.' . $format) ?: [];
    sort($files);
    if (!$files) {
        json_error('Nenhuma imagem gerada a partir do PDF.');
    }
    return $files;
}

function pdf_to_text(string $pdfPath, string $outputPath): void
{
    $bin = pdf_which('pdftotext');
    if (!$bin) {
        json_error('Extração de texto indisponível (pdftotext não encontrado).');
    }
    $cmd = escapeshellarg($bin) . ' -layout ' . escapeshellarg($pdfPath) . ' ' . escapeshellarg($outputPath);
    pdf_run($cmd, 'Falha ao extrair texto do PDF.');
}

function pdf_to_docx(string $pdfPath, string $outputDir): string
{
    $soffice = pdf_which('soffice') ?: pdf_which('libreoffice');
    if (!$soffice) {
        json_error('Conversão PDF → DOCX indisponível (LibreOffice não encontrado).');
    }
    $cmd = escapeshellarg($soffice)
        . ' --headless --nologo --nolockcheck --nodefault --nofirststartwizard'
        . ' --convert-to docx --outdir ' . escapeshellarg($outputDir)
        . ' ' . escapeshellarg($pdfPath);
    pdf_run($cmd, 'Falha ao converter PDF para DOCX.');

    $base = pathinfo($pdfPath, PATHINFO_FILENAME);
    $out = $outputDir . '/' . $base . '.docx';
    if (!is_file($out)) {
        $docs = glob($outputDir . '/*.docx') ?: [];
        if (!$docs) {
            json_error('DOCX não encontrado após conversão.');
        }
        $out = $docs[0];
    }
    return $out;
}

function pdf_store_uploads(string $inputDir, string $field, array $allowedExt): array
{
    if (!isset($_FILES[$field])) {
        json_error('Nenhum arquivo enviado.');
    }

    $files = $_FILES[$field];
    $paths = [];

    // Normalize single/multiple
    if (is_array($files['name'])) {
        $count = count($files['name']);
        for ($i = 0; $i < $count; $i++) {
            if (($files['error'][$i] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) {
                continue;
            }
            if (($files['error'][$i] ?? UPLOAD_ERR_OK) !== UPLOAD_ERR_OK) {
                json_error('Falha no upload de um dos arquivos.');
            }
            $paths[] = pdf_move_one(
                (string) $files['tmp_name'][$i],
                (string) $files['name'][$i],
                (int) $files['size'][$i],
                $inputDir,
                $allowedExt
            );
        }
    } else {
        if (($files['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) {
            json_error('Nenhum arquivo enviado.');
        }
        if (($files['error'] ?? UPLOAD_ERR_OK) !== UPLOAD_ERR_OK) {
            json_error('Falha no upload.');
        }
        $paths[] = pdf_move_one(
            (string) $files['tmp_name'],
            (string) $files['name'],
            (int) $files['size'],
            $inputDir,
            $allowedExt
        );
    }

    if (!$paths) {
        json_error('Nenhum arquivo válido enviado.');
    }
    return $paths;
}

function pdf_move_one(string $tmp, string $name, int $size, string $inputDir, array $allowedExt): string
{
    if ($size <= 0 || $size > 25 * 1024 * 1024) {
        json_error('Cada arquivo deve ter no máximo 25 MB.');
    }
    $safe = preg_replace('/[^\w.\- ()áàâãéêíóôõúçÁÀÂÃÉÊÍÓÔÕÚÇ]+/u', '_', basename($name)) ?: 'arquivo';
    $ext = strtolower(pathinfo($safe, PATHINFO_EXTENSION));
    if ($ext === '' || !in_array($ext, $allowedExt, true)) {
        json_error('Tipo não permitido: .' . $ext);
    }
    $dest = $inputDir . '/' . bin2hex(random_bytes(8)) . '_' . $safe;
    if (!move_uploaded_file($tmp, $dest)) {
        json_error('Não foi possível salvar o upload.', 500);
    }
    return $dest;
}

function pdf_capabilities(): array
{
    $gs = (bool) pdf_which('gs');
    $tess = (bool) pdf_which('tesseract');

    return [
        'merge' => true,
        'split' => true,
        'imagesToPdf' => true,
        'fileToPdf' => (bool) (pdf_which('soffice') ?: pdf_which('libreoffice')),
        'pdfToImages' => $gs,
        'pdfToTxt' => (bool) pdf_which('pdftotext'),
        'pdfToDocx' => (bool) (pdf_which('soffice') ?: pdf_which('libreoffice')),
        'compress' => $gs,
        'protect' => $gs,
        'unlock' => $gs,
        'watermark' => true,
        'ocr' => $gs && $tess,
    ];
}

function pdf_compress(string $inputPath, string $outputPath): void
{
    $gs = pdf_which('gs');
    if (!$gs) {
        json_error('Compressão indisponível (Ghostscript não encontrado).');
    }
    $cmd = escapeshellarg($gs)
        . ' -dSAFER -dBATCH -dNOPAUSE -dQUIET'
        . ' -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=/ebook'
        . ' -sOutputFile=' . escapeshellarg($outputPath)
        . ' ' . escapeshellarg($inputPath);
    pdf_run($cmd, 'Falha ao comprimir PDF.');
}

function pdf_protect(string $inputPath, string $outputPath, string $password): void
{
    $gs = pdf_which('gs');
    if (!$gs) {
        json_error('Proteção indisponível (Ghostscript não encontrado).');
    }
    if (mb_strlen($password) < 4) {
        json_error('Senha deve ter no mínimo 4 caracteres.');
    }
    $pass = escapeshellarg($password);
    $cmd = escapeshellarg($gs)
        . ' -dSAFER -dBATCH -dNOPAUSE -dQUIET'
        . ' -sDEVICE=pdfwrite'
        . ' -sOwnerPassword=' . $pass
        . ' -sUserPassword=' . $pass
        . ' -dEncryptionR=3 -dKeyLength=128'
        . ' -sOutputFile=' . escapeshellarg($outputPath)
        . ' ' . escapeshellarg($inputPath);
    pdf_run($cmd, 'Falha ao proteger PDF.');
}

function pdf_unlock(string $inputPath, string $outputPath, string $password): void
{
    $gs = pdf_which('gs');
    if (!$gs) {
        json_error('Remoção de senha indisponível (Ghostscript não encontrado).');
    }
    $cmd = escapeshellarg($gs)
        . ' -dSAFER -dBATCH -dNOPAUSE -dQUIET'
        . ' -sPDFPassword=' . escapeshellarg($password)
        . ' -sDEVICE=pdfwrite'
        . ' -sOutputFile=' . escapeshellarg($outputPath)
        . ' ' . escapeshellarg($inputPath);
    pdf_run($cmd, 'Falha ao remover senha. Verifique se a senha está correta.');
}

function pdf_watermark(string $inputPath, string $outputPath, string $text): void
{
    $text = trim($text);
    if ($text === '' || mb_strlen($text) > 80) {
        json_error('Texto da marca d\'água inválido.');
    }

    $pdf = new Fpdi();
    $pageCount = $pdf->setSourceFile($inputPath);

    for ($page = 1; $page <= $pageCount; $page++) {
        $tpl = $pdf->importPage($page);
        $size = $pdf->getTemplateSize($tpl);
        $pdf->AddPage($size['orientation'], [$size['width'], $size['height']]);
        $pdf->useTemplate($tpl);

        $pdf->SetFont('Helvetica', 'B', 28);
        $pdf->SetTextColor(180, 180, 180);
        $raw = mb_substr($text, 0, 40);
        $label = iconv('UTF-8', 'ISO-8859-1//TRANSLIT', $raw);
        if ($label === false || $label === '') {
            $label = preg_replace('/[^\x20-\x7E]/', '?', $raw) ?: 'MARCA';
        }
        // Repete a marca em pontos da página (FPDF sem rotação nativa)
        $pdf->Text($size['width'] * 0.18, $size['height'] * 0.35, $label);
        $pdf->Text($size['width'] * 0.28, $size['height'] * 0.55, $label);
        $pdf->Text($size['width'] * 0.18, $size['height'] * 0.75, $label);
    }

    $pdf->Output('F', $outputPath);
}

function pdf_ocr(string $inputPath, string $outputPath): void
{
    $gs = pdf_which('gs');
    $tess = pdf_which('tesseract');
    if (!$gs || !$tess) {
        json_error('OCR indisponível (precisa Ghostscript + Tesseract).');
    }

    $tmpDir = dirname($outputPath) . '/ocr_pages';
    if (!is_dir($tmpDir) && !mkdir($tmpDir, 0755, true) && !is_dir($tmpDir)) {
        json_error('Falha ao criar pasta temporária de OCR.', 500);
    }

    $images = pdf_to_images($inputPath, $tmpDir, 'png');
    $chunks = [];
    $tessdata = dirname(__DIR__) . '/storage/tessdata';
    $lang = is_file($tessdata . '/por.traineddata') ? 'por+eng' : 'eng';

    foreach ($images as $i => $image) {
        $base = $tmpDir . '/page-' . ($i + 1);
        $cmd = escapeshellarg($tess) . ' ' . escapeshellarg($image) . ' ' . escapeshellarg($base)
            . ' -l ' . escapeshellarg($lang);
        if (is_dir($tessdata)) {
            $cmd .= ' --tessdata-dir ' . escapeshellarg($tessdata);
        }
        pdf_run($cmd, 'Falha no OCR da página ' . ($i + 1) . '.');
        $txtFile = $base . '.txt';
        $chunks[] = is_file($txtFile) ? (string) file_get_contents($txtFile) : '';
    }

    $text = trim(implode("\n\n----\n\n", array_filter($chunks, static fn($c) => trim($c) !== '')));
    if ($text === '') {
        json_error('OCR não encontrou texto legível.');
    }
    if (file_put_contents($outputPath, $text) === false) {
        json_error('Não foi possível salvar o texto OCR.', 500);
    }
}

