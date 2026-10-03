"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SoundControl } from "./sound-control";
import { audioEngine } from "@/lib/audio";
import styles from "./portfolio.module.css";

const links = [
  ["projetos", "Projetos"],
  ["sobre", "Sobre"],
  ["stack", "Stack"],
  ["codigo", "Código público"],
  ["contato", "Contato"],
] as const;
export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("");
  const toggle = useRef<HTMLButtonElement>(null);
  const firstLink = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    const resume = (event: Event) => {
      if ((event.target as HTMLElement).closest?.(".sound")) return;
      try {
        if (localStorage.getItem("kaue.sound.v1") === "on")
          void audioEngine.enable();
      } catch {}
      window.removeEventListener("pointerdown", resume);
      window.removeEventListener("keydown", resume);
    };
    window.addEventListener("pointerdown", resume);
    window.addEventListener("keydown", resume);
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries)
          if (entry.isIntersecting) setActive(entry.target.id);
      },
      { rootMargin: "-20% 0px -65% 0px" },
    );
    if (pathname === "/")
      for (const [id] of links) {
        const section = document.getElementById(id);
        if (section) observer.observe(section);
      }
    return () => {
      observer.disconnect();
      window.removeEventListener("pointerdown", resume);
      window.removeEventListener("keydown", resume);
      audioEngine.cleanup();
    };
  }, [pathname]);
  useEffect(() => {
    if (!open) return;
    firstLink.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        toggle.current?.focus();
      }
    };
    const onResize = () => {
      if (window.innerWidth > 700) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
    };
  }, [open]);
  return (
    <header className={styles.header} data-opening-part>
      <div className={`${styles.container} ${styles.headerInner}`}>
        <Link
          className={styles.brand}
          href={pathname === "/" ? "#inicio" : "/#inicio"}
          aria-label="Kauê Ajure — início"
        >
          <Image src="/assets/logo-preta.png" width={36} height={36} alt="" />
          <span aria-hidden="true">Kauê Ajure</span>
        </Link>
        <button
          ref={toggle}
          className={styles.menu}
          aria-expanded={open}
          aria-controls="main-nav"
          onClick={() => setOpen(!open)}
        >
          {open ? "Fechar" : "Menu"}
        </button>
        <nav
          id="main-nav"
          aria-label="Navegação principal"
          className={`${styles.nav} ${open ? styles.navOpen : ""}`}
        >
          {links.map(([id, label], index) => (
            <Link
              ref={index === 0 ? firstLink : undefined}
              href={`/#${id}`}
              aria-current={
                pathname === "/" && active === id ? "location" : undefined
              }
              onClick={() => setOpen(false)}
              key={id}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className={styles.controls}>
          <SoundControl />
        </div>
      </div>
    </header>
  );
}
