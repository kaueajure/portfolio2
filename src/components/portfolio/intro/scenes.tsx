import { openingCode } from "./code";

export function OpeningScenes() {
  return (
    <div className="opening-art" aria-hidden="true">
      <div className="opening-grid" />
      <div className="opening-caption">
        <span>KAUÊ AJURE / DIGITAL WORKSPACE</span>
        <span>IDEIA → PRODUTO</span>
      </div>
      <div className="opening-boot">
        <span>
          ~/portfolio <i />
        </span>
        <small>initializing workspace…</small>
      </div>
      <div className="opening-workspace">
        <div className="opening-editor">
          <div className="opening-tab">
            app / page.tsx <span>TSX · LIVE PREVIEW</span>
          </div>
          <pre className="opening-code-scroll">
            {openingCode.map(({ part }, i) => (
              <span
                className="opening-code"
                data-code-part={part}
                data-code-state="waiting"
                key={i}
              >
                <small>{i + 1}</small>
                <code>
                  <span className="opening-typed" />
                  <i className="opening-caret" />
                </code>
                <span className="opening-line-check">✓</span>
              </span>
            ))}
          </pre>
          <div className="opening-editor-status">
            <span className="opening-code-status">Preparando a tela…</span>
            <span className="opening-code-progress">
              0 / {openingCode.filter((line) => line.part).length}
            </span>
          </div>
        </div>
      </div>
      <div className="opening-preview-anchor" />
      <div className="opening-backend">
        <div className="opening-request">
          POST /api/projects <span>{'{ "status": "ready" }'}</span>
        </div>
        <div className="opening-services">
          {["Interface", "API", "Database", "Worker", "Deploy"].map((n) => (
            <div key={n}>{n}</div>
          ))}
          <i className="opening-packet" />
        </div>
        <div className="opening-query">
          SELECT id, title FROM projects;{" "}
          <span>200 OK · worker: completed</span>
        </div>
      </div>
      <div className="opening-build">
        {["typecheck", "components", "routes", "assets"].map((n) => (
          <span key={n}>✓ {n}</span>
        ))}
        <strong>
          BUILD SUCCESS<span>Pronto para explorar.</span>
        </strong>
      </div>
      <div className="opening-footer">
        <span>DESIGN → CODE → EXPERIENCE</span>
        <span>FULL STACK / BRASIL</span>
      </div>
    </div>
  );
}
