import Image from "next/image";
import Link from "next/link";
import styles from "./portfolio.module.css";
export function Intro() {
  return (
    <section id="inicio" className={styles.hero} aria-labelledby="hero-title">
      <div className={styles.container}>
        <div className={styles.heroTop}>
          <span>Desenvolvedor full-stack</span>
          <span className={styles.availability}>
            Projetos de produto e operação
          </span>
        </div>
        <h1 tabIndex={-1} id="hero-title" className={styles.heroName}>
          <span>Kauê</span> <span>Ajure</span>
          <span className={styles.period}>.</span>
        </h1>
        <div className={styles.heroGrid}>
          <div className={styles.heroCopy}>
            <p>
              Sistemas de gestão e produtos SaaS, da interface ao banco e ao
              deploy.
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
          <figure className={styles.heroVisual}>
            <div className={styles.heroScreen} data-opening-target>
              <Image
                src="/projects/gestifique-kanban.png"
                width={1440}
                height={1000}
                alt="Interface do Gestifique mostrando chamados em colunas de status, com prioridades e responsáveis."
                priority
                sizes="(max-width: 700px) calc(100vw - 40px), (max-width: 1000px) 60vw, 58vw"
              />
            </div>
            <figcaption>
              <span>
                Gestifique · atendimento, prazos e responsáveis em uma mesma
                operação.
              </span>
              <Link href="/projetos/gestifique">Conhecer o case ↗</Link>
            </figcaption>
          </figure>
        </div>
        <div className={styles.heroNote}>
          <span>Interfaces reais. Decisões por trás delas.</span>
          <a href="#projetos">
            Explorar trabalhos <span aria-hidden="true">↓</span>
          </a>
        </div>
      </div>
    </section>
  );
}
