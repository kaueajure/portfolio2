<?php
declare(strict_types=1);
require __DIR__ . '/../api/bootstrap.php';
require __DIR__ . '/../api/auth_lib.php';
require_page_auth();
send_security_headers();
$csrf = htmlspecialchars(csrf_token(), ENT_QUOTES, 'UTF-8');
$userName = htmlspecialchars((string) ($_SESSION['usuario_nome'] ?? ''), ENT_QUOTES, 'UTF-8');
$activeNav = 'pdf';
$pageTitle = 'PDF';
require __DIR__ . '/partials/shell-start.php';
?>

      <header class="panel-topbar">
        <div>
          <span class="section-tag">Ferramentas</span>
          <h1>PDF</h1>
        </div>
      </header>

      <main id="conteudo" class="panel-content panel-content--pdf">
        <div class="pdf-grid" id="pdf-tools">
          <article class="pdf-card" data-tool="merge">
            <header class="pdf-card-head">
              <h2>Unir</h2>
              <span>Vários PDFs → 1 arquivo</span>
            </header>
            <form class="pdf-form" data-action="merge">
              <div class="pdf-form-body">
                <label class="file-picker">
                  <input type="file" name="files[]" accept=".pdf,application/pdf" multiple required>
                  <span class="file-picker-btn btn btn-ghost" aria-hidden="true">Escolher PDFs</span>
                  <span class="file-picker-name">Nenhum arquivo</span>
                </label>
              </div>
              <button class="btn btn-primary pdf-submit" type="submit">Unir</button>
            </form>
          </article>

          <article class="pdf-card" data-tool="split">
            <header class="pdf-card-head">
              <h2>Separar</h2>
              <span>Páginas ou intervalo</span>
            </header>
            <form class="pdf-form" data-action="split">
              <div class="pdf-form-body">
                <label class="file-picker">
                  <input type="file" name="file" accept=".pdf,application/pdf" required>
                  <span class="file-picker-btn btn btn-ghost" aria-hidden="true">Escolher PDF</span>
                  <span class="file-picker-name">Nenhum arquivo</span>
                </label>
                <select name="mode" aria-label="Modo">
                  <option value="all">Todas (ZIP)</option>
                  <option value="range">Intervalo</option>
                </select>
                <input type="text" name="ranges" data-split-ranges hidden placeholder="Ex.: 1-3,5" aria-label="Páginas">
              </div>
              <button class="btn btn-primary pdf-submit" type="submit">Separar</button>
            </form>
          </article>

          <article class="pdf-card" data-tool="imagesToPdf">
            <header class="pdf-card-head">
              <h2>Imagens → PDF</h2>
              <span>PNG · JPG · WEBP · GIF</span>
            </header>
            <form class="pdf-form" data-action="images_to_pdf">
              <div class="pdf-form-body">
                <label class="file-picker">
                  <input type="file" name="files[]" accept=".png,.jpg,.jpeg,.webp,.gif,image/*" multiple required>
                  <span class="file-picker-btn btn btn-ghost" aria-hidden="true">Escolher imagens</span>
                  <span class="file-picker-name">Nenhum arquivo</span>
                </label>
              </div>
              <button class="btn btn-primary pdf-submit" type="submit">Gerar</button>
            </form>
          </article>

          <article class="pdf-card" data-tool="fileToPdf">
            <header class="pdf-card-head">
              <h2>Arquivo → PDF</h2>
              <span>Word · Excel · PPT · TXT</span>
            </header>
            <form class="pdf-form" data-action="file_to_pdf">
              <div class="pdf-form-body">
                <label class="file-picker">
                  <input type="file" name="file" accept=".doc,.docx,.xls,.xlsx,.ppt,.pptx,.odt,.ods,.odp,.txt,.rtf,.csv" required>
                  <span class="file-picker-btn btn btn-ghost" aria-hidden="true">Escolher arquivo</span>
                  <span class="file-picker-name">Nenhum arquivo</span>
                </label>
                <p class="pdf-cap" data-cap="fileToPdf" hidden>Indisponível (LibreOffice)</p>
              </div>
              <button class="btn btn-primary pdf-submit" type="submit">Converter</button>
            </form>
          </article>

          <article class="pdf-card" data-tool="pdfToImages">
            <header class="pdf-card-head">
              <h2>PDF → Imagens</h2>
              <span>Páginas em ZIP</span>
            </header>
            <form class="pdf-form" data-action="pdf_to_images">
              <div class="pdf-form-body">
                <label class="file-picker">
                  <input type="file" name="file" accept=".pdf,application/pdf" required>
                  <span class="file-picker-btn btn btn-ghost" aria-hidden="true">Escolher PDF</span>
                  <span class="file-picker-name">Nenhum arquivo</span>
                </label>
                <select name="format" aria-label="Formato">
                  <option value="png">PNG</option>
                  <option value="jpg">JPG</option>
                </select>
                <p class="pdf-cap" data-cap="pdfToImages" hidden>Indisponível (Ghostscript)</p>
              </div>
              <button class="btn btn-primary pdf-submit" type="submit">Exportar</button>
            </form>
          </article>

          <article class="pdf-card" data-tool="pdfToTxt">
            <header class="pdf-card-head">
              <h2>PDF → Texto</h2>
              <span>Extrair .txt</span>
            </header>
            <form class="pdf-form" data-action="pdf_to_txt">
              <div class="pdf-form-body">
                <label class="file-picker">
                  <input type="file" name="file" accept=".pdf,application/pdf" required>
                  <span class="file-picker-btn btn btn-ghost" aria-hidden="true">Escolher PDF</span>
                  <span class="file-picker-name">Nenhum arquivo</span>
                </label>
                <p class="pdf-cap" data-cap="pdfToTxt" hidden>Indisponível (pdftotext)</p>
              </div>
              <button class="btn btn-primary pdf-submit" type="submit">Extrair</button>
            </form>
          </article>

          <article class="pdf-card" data-tool="pdfToDocx">
            <header class="pdf-card-head">
              <h2>PDF → Word</h2>
              <span>Gerar .docx</span>
            </header>
            <form class="pdf-form" data-action="pdf_to_docx">
              <div class="pdf-form-body">
                <label class="file-picker">
                  <input type="file" name="file" accept=".pdf,application/pdf" required>
                  <span class="file-picker-btn btn btn-ghost" aria-hidden="true">Escolher PDF</span>
                  <span class="file-picker-name">Nenhum arquivo</span>
                </label>
                <p class="pdf-cap" data-cap="pdfToDocx" hidden>Indisponível (LibreOffice)</p>
              </div>
              <button class="btn btn-primary pdf-submit" type="submit">Converter</button>
            </form>
          </article>

          <article class="pdf-card" data-tool="compress">
            <header class="pdf-card-head">
              <h2>Comprimir</h2>
              <span>Reduzir tamanho</span>
            </header>
            <form class="pdf-form" data-action="compress">
              <div class="pdf-form-body">
                <label class="file-picker">
                  <input type="file" name="file" accept=".pdf,application/pdf" required>
                  <span class="file-picker-btn btn btn-ghost" aria-hidden="true">Escolher PDF</span>
                  <span class="file-picker-name">Nenhum arquivo</span>
                </label>
                <p class="pdf-cap" data-cap="compress" hidden>Indisponível (Ghostscript)</p>
              </div>
              <button class="btn btn-primary pdf-submit" type="submit">Comprimir</button>
            </form>
          </article>

          <article class="pdf-card" data-tool="protect">
            <header class="pdf-card-head">
              <h2>Proteger</h2>
              <span>Definir senha</span>
            </header>
            <form class="pdf-form" data-action="protect">
              <div class="pdf-form-body">
                <label class="file-picker">
                  <input type="file" name="file" accept=".pdf,application/pdf" required>
                  <span class="file-picker-btn btn btn-ghost" aria-hidden="true">Escolher PDF</span>
                  <span class="file-picker-name">Nenhum arquivo</span>
                </label>
                <input type="password" name="password" placeholder="Nova senha" minlength="4" required autocomplete="new-password" aria-label="Senha">
                <p class="pdf-cap" data-cap="protect" hidden>Indisponível (Ghostscript)</p>
              </div>
              <button class="btn btn-primary pdf-submit" type="submit">Proteger</button>
            </form>
          </article>

          <article class="pdf-card" data-tool="unlock">
            <header class="pdf-card-head">
              <h2>Remover senha</h2>
              <span>Desbloquear PDF</span>
            </header>
            <form class="pdf-form" data-action="unlock">
              <div class="pdf-form-body">
                <label class="file-picker">
                  <input type="file" name="file" accept=".pdf,application/pdf" required>
                  <span class="file-picker-btn btn btn-ghost" aria-hidden="true">Escolher PDF</span>
                  <span class="file-picker-name">Nenhum arquivo</span>
                </label>
                <input type="password" name="password" placeholder="Senha atual" required autocomplete="current-password" aria-label="Senha atual">
                <p class="pdf-cap" data-cap="unlock" hidden>Indisponível (Ghostscript)</p>
              </div>
              <button class="btn btn-primary pdf-submit" type="submit">Remover</button>
            </form>
          </article>

          <article class="pdf-card" data-tool="watermark">
            <header class="pdf-card-head">
              <h2>Marca d'água</h2>
              <span>Texto em todas as páginas</span>
            </header>
            <form class="pdf-form" data-action="watermark">
              <div class="pdf-form-body">
                <label class="file-picker">
                  <input type="file" name="file" accept=".pdf,application/pdf" required>
                  <span class="file-picker-btn btn btn-ghost" aria-hidden="true">Escolher PDF</span>
                  <span class="file-picker-name">Nenhum arquivo</span>
                </label>
                <input type="text" name="text" placeholder="Ex.: CONFIDENCIAL" maxlength="80" required aria-label="Texto da marca">
              </div>
              <button class="btn btn-primary pdf-submit" type="submit">Aplicar</button>
            </form>
          </article>

          <article class="pdf-card" data-tool="ocr">
            <header class="pdf-card-head">
              <h2>OCR</h2>
              <span>PDF escaneado → texto</span>
            </header>
            <form class="pdf-form" data-action="ocr">
              <div class="pdf-form-body">
                <label class="file-picker">
                  <input type="file" name="file" accept=".pdf,application/pdf" required>
                  <span class="file-picker-btn btn btn-ghost" aria-hidden="true">Escolher PDF</span>
                  <span class="file-picker-name">Nenhum arquivo</span>
                </label>
                <p class="pdf-cap" data-cap="ocr" hidden>Indisponível (Tesseract)</p>
              </div>
              <button class="btn btn-primary pdf-submit" type="submit">Extrair</button>
            </form>
          </article>
        </div>

        <p class="pdf-status" id="pdf-status" role="status" aria-live="polite"></p>
      </main>

  <script type="module" src="js/pdf.js"></script>

<?php require __DIR__ . '/partials/shell-end.php'; ?>
