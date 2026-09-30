import { projects, stack } from "@/lib/domain/portfolio";
export function About() {
  return (
    <section id="sobre" className="about section">
      <div className="section-label">Sobre / arquitetura</div>
      <div className="about-grid">
        <div data-reveal>
          <h2>
            Desenvolvo a interface <em>e o que acontece por trás dela.</em>
          </h2>
          <p className="lead">
            Meus projetos lidam com organização: chamados, demandas, prazos,
            usuários e informações no mesmo lugar.
          </p>
          <p>
            Trabalho com React e TypeScript no front, Node.js no back —
            autenticação, permissões, APIs, banco, tempo real, workers e deploy
            em Linux.
          </p>
        </div>
        <div className="layers" data-reveal>
          {[
            ["Experiência", "React · Next.js"],
            ["Aplicação", "Node.js · APIs"],
            ["Dados", "MySQL · Drizzle"],
            ["Operação", "Workers · Linux"],
          ].map(([title, tech], i) => (
            <div className="layer" key={title}>
              <span className="layer-index">0{i + 1}</span>
              <h3>{title}</h3>
              <p>{tech}</p>
              <span aria-hidden="true">↓</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
export function Projects() {
  return (
    <section id="projetos" className="projects section">
      <header className="projects-heading" data-reveal>
        <span className="section-label">Projetos selecionados</span>
        <h2>
          Interfaces por fora.
          <br />
          <em>Sistemas por dentro.</em>
        </h2>
        <p>Quatro projetos. Da experiência de uso à operação.</p>
      </header>
      {projects.map((p, i) => (
        <article className={`project project-${p.kind}`} key={p.slug}>
          <div className="project-copy" data-reveal>
            <p className="eyebrow">{p.category}</p>
            <h3>{p.name}</h3>
            <p className="project-statement">{p.statement}</p>
            <p>{p.description}</p>
            <p className="project-stack">{p.stack.join(" / ")}</p>
            <a
              className="project-link magnetic"
              href={`https://github.com/kaueajure/${p.slug}`}
              target="_blank"
              rel="noreferrer"
            >
              Ver projeto no GitHub <span>↗</span>
            </a>
          </div>
          <div
            className={`project-diagram diagram-${p.kind}`}
            aria-label={`Módulos de ${p.name}`}
          >
            <div className="diagram-header">
              <span>{p.slug.toUpperCase()} / SISTEMA</span>
              <span>↗</span>
            </div>
            <div className="diagram-nodes">
              {p.nodes.map((node, n) => (
                <div className={`diagram-node node-${n}`} key={node}>
                  <span className="node-marker" aria-hidden="true">
                    {n === 0 ? "◈" : "↳"}
                  </span>
                  <span>{node}</span>
                </div>
              ))}
            </div>
            <div className="diagram-footer">
              <span>
                {
                  [
                    "Catálogo conectado à operação",
                    "Canais conectados ao atendimento",
                    "Conteúdo conectado a pessoas",
                    "Municípios conectados à gestão",
                  ][i]
                }
              </span>
              <span aria-hidden="true">●</span>
            </div>
          </div>
        </article>
      ))}
    </section>
  );
}
export function Stack() {
  return (
    <section id="stack" className="stack-section section">
      <div className="section-label">Stack / ferramentas do dia a dia</div>
      <h2 data-reveal>
        Uma aplicação.
        <br />
        <em>Todas as camadas.</em>
      </h2>
      <div className="stack-pipeline">
        {stack.map((s) => (
          <article key={s.name} data-reveal>
            <span className="eyebrow">{s.path}</span>
            <h3>{s.name}</h3>
            <ul>
              {s.tools.map((t) => (
                <li key={t}>
                  <span aria-hidden="true">↳</span>
                  {t}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
