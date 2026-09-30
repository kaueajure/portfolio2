"use client";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { SoundControl } from "./sound-control";
import { audioEngine } from "@/lib/audio";
const links = [
  ["sobre", "Sobre"],
  ["projetos", "Projetos"],
  ["stack", "Stack"],
  ["github", "GitHub"],
  ["contato", "Contato"],
];
export function Header() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("");
  const header = useRef<HTMLElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    // Browsers require a gesture even when the visitor previously enabled audio.
    const restoreSound = () => {
      try {
        if (localStorage.getItem("kaue.sound.v1") === "on") {
          void audioEngine.enable();
        }
      } catch {}
    };
    const resume = (event: Event) => {
      if ((event.target as HTMLElement).closest?.(".sound")) return;
      restoreSound();
      window.removeEventListener("pointerdown", resume);
      window.removeEventListener("keydown", resume);
    };
    window.addEventListener("pointerdown", resume);
    window.addEventListener("keydown", resume);
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id);
      },
      { rootMargin: "-20% 0px -60% 0px" },
    );
    for (const [id] of links) {
      const section = document.getElementById(id);
      if (section) observer.observe(section);
    }
    const onScroll = () =>
      header.current?.classList.toggle("scrolled", window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      observer.disconnect();
      window.removeEventListener("pointerdown", resume);
      window.removeEventListener("keydown", resume);
      window.removeEventListener("scroll", onScroll);
      audioEngine.cleanup();
    };
  }, []);
  useEffect(() => {
    if (!open) return;
    const listener = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        toggle.current?.focus();
      }
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, [open]);
  return (
    <header ref={header} className="site-header">
      <a className="brand" href="#inicio">
        <Image src="/assets/logo-preta.png" width={40} height={40} alt="" />
        <span>Kauê Ajure</span>
      </a>
      <nav
        id="main-nav"
        aria-label="Navegação principal"
        className={open ? "open" : ""}
      >
        {links.map(([id, label]) => (
          <a
            href={`#${id}`}
            aria-current={active === id ? "location" : undefined}
            onClick={() => setOpen(false)}
            key={id}
          >
            {label}
          </a>
        ))}
      </nav>
      <div className="header-controls">
        <SoundControl />
        <button
          ref={toggle}
          className="menu-toggle"
          aria-controls="main-nav"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          {open ? "Fechar" : "Menu"}
        </button>
      </div>
    </header>
  );
}
