"use client";
import { useEffect } from "react";
export function Motion() {
  useEffect(() => {
    let disposed = false;
    let revert: (() => void) | undefined;
    void Promise.all([import("gsap"), import("gsap/ScrollTrigger")])
      .then(([{ gsap }, { ScrollTrigger }]) => {
        if (disposed) return;
        gsap.registerPlugin(ScrollTrigger);
        const mm = gsap.matchMedia();
        mm.add("(prefers-reduced-motion: no-preference)", () => {
          gsap.utils
            .toArray<HTMLElement>("[data-reveal]")
            .forEach((element) => {
              gsap.from(element, {
                y: 14,
                duration: 0.55,
                ease: "power2.out",
                clearProps: "all",
                scrollTrigger: {
                  trigger: element,
                  start: "top 94%",
                  once: true,
                },
              });
            });
        });
        revert = () => mm.revert();
      })
      .catch(() => {});
    return () => {
      disposed = true;
      revert?.();
    };
  }, []);
  return null;
}
