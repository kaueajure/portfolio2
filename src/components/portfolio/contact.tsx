"use client";
import { useState } from "react";
import styles from "./portfolio.module.css";
export function Contact() {
  const [message, setMessage] = useState("");
  return (
    <section
      id="contato"
      className={`${styles.contact} ${styles.container}`}
      aria-labelledby="contact-heading"
    >
      <p className={styles.label}>05 / Próximo projeto</p>
      <h2 id="contact-heading">Vamos construir o próximo sistema.</h2>
      <p className={styles.contactIntro}>
        Conte o problema, o contexto e o que precisa funcionar.
      </p>
      <div className={styles.contactActions}>
        <a className={styles.email} href="mailto:kaueajure@gmail.com">
          kaueajure@gmail.com ↗
        </a>
        <div className={styles.copyGroup}>
          <button
            type="button"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText("kaueajure@gmail.com");
                setMessage("E-mail copiado.");
              } catch {
                setMessage("Copie o endereço: kaueajure@gmail.com");
              }
            }}
          >
            Copiar e-mail
          </button>
          <span role="status">{message}</span>
        </div>
      </div>
      <footer className={styles.footer}>
        <p>Kauê Ajure · Desenvolvimento de sistemas</p>
        <nav aria-label="Links do rodapé">
          <a
            href="https://www.linkedin.com/in/kaueajure/"
            target="_blank"
            rel="noreferrer"
          >
            LinkedIn ↗
          </a>
          <a
            href="https://github.com/kaueajure"
            target="_blank"
            rel="noreferrer"
          >
            GitHub ↗
          </a>
          <button
            type="button"
            onClick={() =>
              window.dispatchEvent(new Event("kaue:replay-opening"))
            }
          >
            Rever abertura
          </button>
          <a href="#inicio">Voltar ao topo ↑</a>
        </nav>
      </footer>
    </section>
  );
}
