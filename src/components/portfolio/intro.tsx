import Image from "next/image";
import Link from "next/link";
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
        <div className={styles.heroTop} data-opening-part>
          <span>Desenvolvedor full-stack</span>
          <span className={styles.availability}>
            Projetos de produto e operação
          </span>
        </div>
        <h1 id="hero-title" className={styles.heroName} data-opening-part>
          <span>Kauê</span> <span>Ajure</span>
          <span className={styles.period}>.</span>
        </h1>
        <div className={styles.heroGrid}>
          <div className={styles.heroCopy} data-opening-part>
            <p>
              Produtos digitais com interfaces pensadas para pessoas e estrutura
              para funcionar de ponta a ponta.
            </p>
            <div className={styles.heroActions}>
              <a className={styles.primary} href="#projetos">
                Ver projetos <span aria-hidden="true">↘</span>
              </a>
              <a className={styles.textLink} href="#contato">
                Conversar sobre um projeto <span aria-hidden="true">↗</span>
              </a>
            </div>
          </div>
          <figure className={styles.heroVisual} data-opening-part>
            <div className={styles.heroScreen}>
              <Image
                src="/projects/flixa-home.png"
                width={1440}
                height={900}
                alt="Página inicial do Flixa com filme em destaque, catálogo e navegação por gêneros."
                priority
                sizes="(max-width: 700px) calc(100vw - 40px), (max-width: 1000px) 60vw, 58vw"
              />
            </div>
            <figcaption>
              <span>
                Flixa · catálogo, biblioteca e descoberta em uma mesma
                experiência.
              </span>
              <Link href="/projetos/flixa">Conhecer o case ↗</Link>
            </figcaption>
          </figure>
        </div>
        <div className={styles.heroNote} data-opening-part>
          <span>Interfaces reais. Decisões por trás delas.</span>
          <a href="#projetos">
            Explorar trabalhos <span aria-hidden="true">↓</span>
          </a>
        </div>
      </div>
    </section>
  );
}
