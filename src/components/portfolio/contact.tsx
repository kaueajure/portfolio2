"use client";
import { useState } from "react";
export function Contact() {
  const [message, setMessage] = useState("");
  return (
    <section id="contato" className="contact section">
      <span className="section-label">Contato / próximo projeto</span>
      <h2 data-reveal>
        Vamos conversar sobre
        <br />
        <em>o próximo sistema.</em>
      </h2>
      <div className="contact-actions">
        <a className="contact-email magnetic" href="mailto:kaueajure@gmail.com">
          kaueajure@gmail.com ↗
        </a>
        <button
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
      <footer>
        <p>Kauê Ajure · Desenvolvedor Full Stack</p>
        <div>
          <a
            href="https://github.com/kaueajure"
            target="_blank"
            rel="noreferrer"
          >
            GitHub ↗
          </a>
          <a
            href="https://www.linkedin.com/in/kaueajure/"
            target="_blank"
            rel="noreferrer"
          >
            LinkedIn ↗
          </a>
          <a href="#inicio">Topo ↑</a>
        </div>
      </footer>
    </section>
  );
}
