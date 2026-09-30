export function Intro() {
  return (
    <section id="inicio" className="intro" aria-labelledby="hero-title">
      <div className="hero-shell">
        <div className="intro-grid" aria-hidden="true" />
        <div className="intro-topline">
          <span>DESENVOLVEDOR FULL STACK</span>
          <span>
            DISPONÍVEL PARA PROJETOS <i />
          </span>
        </div>
        <div className="hero-copy">
          <p className="eyebrow">Código. Produto. Operação.</p>
          <h1 tabIndex={-1} id="hero-title" className="hero-name">
            Kauê <span>Ajure</span>
            <span className="hero-period">.</span>
          </h1>
          <div className="hero-bottom">
            <p>
              Sistemas de gestão e produtos SaaS — da interface ao banco e ao
              deploy.
            </p>
            <div className="actions">
              <a className="button primary magnetic" href="#projetos">
                Ver projetos <span>↗</span>
              </a>
              <a className="button ghost magnetic" href="#contato">
                Falar comigo
              </a>
            </div>
          </div>
        </div>
        <div
          className="architecture"
          aria-label="Interface, API, Banco, Worker e Deploy"
        >
          <div className="architecture-line" aria-hidden="true" />
          {["Interface", "API", "Banco", "Worker", "Deploy"].map((n, i) => (
            <div className="architecture-node" key={n}>
              <small>0{i + 1}</small>
              <strong>{n}</strong>
            </div>
          ))}
        </div>
        <div className="intro-footer">
          <span className="hero-caption">
            React / Next.js / TypeScript
            <br />
            Node.js / MySQL / tempo real
          </span>
          <span className="scroll-cue">
            EXPLORE OS PROJETOS <span>↓</span>
          </span>
          <span>
            API / workers / Linux / deploy
            <br />
            SaaS · gestão · operação
          </span>
        </div>
      </div>
    </section>
  );
}
