"use client";
import { useState } from "react";
import { pdfTools, type PdfTool } from "@/lib/domain/pdf";
import { api } from "@/lib/client";
import { Field, Select } from "@/components/ui/fields";
export function PdfTools({
  capabilities,
  language,
}: {
  capabilities: Record<PdfTool, boolean>;
  language: string;
}) {
  return (
    <>
      <h1>Ferramentas PDF</h1>
      <p>
        Até 25 MB por arquivo, 100 MB por operação e 300 páginas. Resultados
        disponíveis por uma hora.
      </p>
      <p>
        OCR:{" "}
        {language === "por+eng"
          ? "português e inglês"
          : "inglês (dados de português ausentes)"}
        . PDF → Word preserva o texto extraído; a diagramação pode mudar.
      </p>
      <div className="card-grid">
        {(Object.keys(pdfTools) as PdfTool[]).map((tool) => (
          <Tool key={tool} tool={tool} available={capabilities[tool]} />
        ))}
      </div>
    </>
  );
}
function Tool({ tool, available }: { tool: PdfTool; available: boolean }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<{
    downloadUrl: string;
    fileName: string;
  } | null>(null);
  const [range, setRange] = useState(false);
  const multiple = ["merge", "images_to_pdf"].includes(tool);
  const accept =
    tool === "images_to_pdf"
      ? ".png,.jpg,.jpeg,.webp,.gif"
      : tool === "file_to_pdf"
        ? ".doc,.docx,.xls,.xlsx,.ppt,.pptx,.odt,.ods,.odp,.txt,.rtf,.csv"
        : ".pdf";
  return (
    <section className="surface">
      <h2>{pdfTools[tool]}</h2>
      {!available ? (
        <p>
          Indisponível: a ferramenta necessária não está instalada no servidor.
        </p>
      ) : null}
      <form
        className="form"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setResult(null);
          setMessage("Processando…");
          const form = new FormData(e.currentTarget);
          try {
            const result = await api<{ downloadUrl: string; fileName: string }>(
              `/api/pdf/${tool}`,
              form,
            );
            setResult(result);
            setMessage("Arquivo pronto para baixar.");
          } catch (e) {
            setMessage((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <fieldset disabled={busy || !available}>
          <Field
            label={multiple ? "Arquivos (na ordem desejada)" : "Arquivo"}
            name="files"
            type="file"
            multiple={multiple}
            accept={accept}
            required
          />
          {tool === "split" ? (
            <>
              <Select
                label="Separar"
                value={range ? "range" : "all"}
                onChange={(e) => setRange(e.target.value === "range")}
              >
                <option value="all">Todas as páginas (ZIP)</option>
                <option value="range">Intervalo</option>
              </Select>
              {range ? (
                <Field
                  label="Páginas (ex.: 1-3,5)"
                  name="ranges"
                  maxLength={2000}
                  required
                />
              ) : null}
            </>
          ) : null}
          {tool === "pdf_to_images" ? (
            <Select label="Formato" name="format">
              <option value="png">PNG</option>
              <option value="jpg">JPG</option>
            </Select>
          ) : null}
          {["protect", "unlock"].includes(tool) ? (
            <Field
              label={tool === "protect" ? "Nova senha" : "Senha atual"}
              name="password"
              type="password"
              autoComplete="off"
              minLength={tool === "protect" ? 4 : 1}
              maxLength={128}
              required
            />
          ) : null}
          {tool === "watermark" ? (
            <Field label="Texto da marca" name="text" maxLength={80} required />
          ) : null}
          <button className="primary">
            {busy ? "Processando…" : pdfTools[tool]}
          </button>
        </fieldset>
      </form>
      <p role="status">{message}</p>
      {result ? (
        <a className="button" href={result.downloadUrl}>
          Baixar {result.fileName}
        </a>
      ) : null}
    </section>
  );
}
