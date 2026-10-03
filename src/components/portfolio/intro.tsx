import styles from "./portfolio.module.css";
export function Intro() {
  return (
    <section
      id="inicio"
      tabIndex={-1}
      className={styles.hero}
      aria-labelledby="hero-title"
    >
      <div className={styles.container}>
        <div className={styles.heroTop} data-opening-part="intro">
          <span>Desenvolvedor full-stack</span>
          <span className={styles.availability}>
            Projetos de produto e operação
          </span>
        </div>
        <h1
          id="hero-title"
          className={styles.heroName}
          data-opening-part="title"
        >
          <span>Kauê</span> <span>Ajure</span>
          <span className={styles.period}>.</span>
        </h1>
        <div className={styles.heroCopy}>
          <p data-opening-part="copy">
            Produtos digitais com interfaces pensadas para pessoas e estrutura
            para funcionar de ponta a ponta.
          </p>
          <div className={styles.heroActions}>
            <a
              className={styles.primary}
              href="#projetos"
              data-opening-part="projects-action"
            >
              Ver projetos <span aria-hidden="true">↘</span>
            </a>
            <a
              className={styles.textLink}
              href="#contato"
              data-opening-part="contact-action"
            >
              Conversar sobre um projeto <span aria-hidden="true">↗</span>
            </a>
          </div>
        </div>
        <div className={styles.heroNote} data-opening-part="note">
          <span>Interfaces reais. Decisões por trás delas.</span>
          <a href="#projetos">
            Explorar trabalhos <span aria-hidden="true">↓</span>
          </a>
        </div>
      </div>
    </section>
  );
}
