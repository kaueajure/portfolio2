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
        <aside className="opening-files">
          <small>EXPLORER / main</small>
          {[
            "src/",
            "  app/",
            "    page.tsx",
            "  components/",
            "    Portfolio.tsx",
            "  lib/",
            "  services/",
            "  db/",
          ].map((f) => (
            <div className="opening-file" key={f}>
              {f}
            </div>
          ))}
        </aside>
        <div className="opening-editor">
          <div className="opening-tab">
            app / page.tsx <span>TSX</span>
          </div>
          <pre>
            {[
              <>
                <b>export default async function</b> Page() {"{"}
              </>,
              <>
                {" "}
                <b>const</b> projects = <b>await</b> getProjects();
              </>,
              <>
                {" "}
                <b>return</b> (
              </>,
              <>
                {" "}
                {"<"}
                <em>Portfolio</em> projects={"{projects}"} /{">"}
              </>,
              <> );</>,
              <>{"}"}</>,
            ].map((line, i) => (
              <span className="opening-code" key={i}>
                <small>{i + 1}</small>
                {line}
              </span>
            ))}
          </pre>
          <div className="opening-autocomplete">
            ↳ Portfolio · React component
          </div>
        </div>
      </div>
      <div className="opening-layout">
        <div className="opening-module module-header">
          <code>{"<Header />"}</code>
          <span>
            KA / <i>Sobre &nbsp; Projetos &nbsp; Contato</i>
          </span>
        </div>
        <div className="opening-module module-hero">
          <code>{'<section className="hero">'}</code>
          <span>
            Kauê <em>Ajure</em>.
          </span>
          <p>Da interface ao banco e ao deploy.</p>
        </div>
        <div className="opening-module module-card">
          <code>{"<Project />"}</code>
          <span>
            Interface <i>↗</i>
          </span>
        </div>
        <div className="opening-module module-card">
          <code>{"<Stack />"}</code>
          <span>
            Aplicação <i>↗</i>
          </span>
        </div>
        <div className="opening-module module-card">
          <code>{"<Contact />"}</code>
          <span>
            Operação <i>↗</i>
          </span>
        </div>
      </div>
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
