"use client";
import { useEffect } from "react";
import { audioEngine } from "@/lib/audio";
export function Motion() {
  useEffect(() => {
    let disposed = false;
    let cleanup: (() => void) | undefined;
    const listeners: (() => void)[] = [];
    async function init() {
      try {
        const [{ gsap }, { ScrollTrigger }] = await Promise.all([
          import("gsap"),
          import("gsap/ScrollTrigger"),
        ]);
        if (disposed) return;
        gsap.registerPlugin(ScrollTrigger);
        const mm = gsap.matchMedia();
        mm.add("(prefers-reduced-motion: no-preference)", () => {
          gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) =>
            gsap.from(el, {
              y: 30,
              opacity: 0.3,
              duration: 0.7,
              scrollTrigger: { trigger: el, start: "top 92%", once: true },
            }),
          );
          gsap.utils.toArray<HTMLElement>(".project-diagram").forEach((el) =>
            gsap.from(el, {
              scale: 0.93,
              rotation: 2,
              scrollTrigger: {
                trigger: el,
                start: "top bottom",
                end: "center center",
                scrub: 1,
              },
            }),
          );
        });
        cleanup = () => mm.revert();
      } catch {}
    }
    void init();
    if (
      matchMedia("(pointer:fine) and (prefers-reduced-motion: no-preference)")
        .matches
    ) {
      document.querySelectorAll<HTMLElement>(".magnetic").forEach((el) => {
        const move = (e: PointerEvent) => {
          const r = el.getBoundingClientRect();
          el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.08}px,${(e.clientY - r.top - r.height / 2) * 0.1}px)`;
        };
        const leave = () => {
          el.style.transform = "";
        };
        el.addEventListener("pointermove", move);
        el.addEventListener("pointerleave", leave);
        listeners.push(() => {
          el.removeEventListener("pointermove", move);
          el.removeEventListener("pointerleave", leave);
          el.style.transform = "";
        });
      });
    }
    const click = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest(".project-link"))
        audioEngine.play("project");
    };
    document.addEventListener("click", click);
    return () => {
      disposed = true;
      cleanup?.();
      listeners.forEach((fn) => fn());
      document.removeEventListener("click", click);
    };
  }, []);
  return null;
}
