import type { gsap as Gsap } from "gsap";
import { audioEngine } from "@/lib/audio";
export function openingTimeline(
  gsap: typeof Gsap,
  root: HTMLElement,
  page: HTMLElement,
  preview: () => void,
  finishing: () => void,
  complete: () => void,
) {
  const q = gsap.utils.selector(root);
  const mobile = window.matchMedia("(max-width: 600px)").matches;
  const anchor = root.querySelector<HTMLElement>(".opening-preview-anchor")!;
  const parts = Array.from(
    page.querySelectorAll<HTMLElement>("[data-opening-part]"),
  );
  // Measure before animation writes; no layout work is needed at the handoff.
  const box = anchor.getBoundingClientRect();
  const width = page.clientWidth;
  const height = window.innerHeight;
  const scale = Math.min(box.width / width, box.height / height);
  const packetTravel = root.querySelector(".opening-services")!.clientWidth - 8;
  const assemblyStart = 2.5;
  const partDuration = 0.85;
  const partStagger = 0.09;
  const assemblyEnd =
    assemblyStart + partDuration + (parts.length - 1) * partStagger;
  // Prepare the bounded page while the opaque opening still covers it.
  page.style.setProperty("--opening-width", `${width}px`);
  page.style.setProperty("--opening-height", `${height}px`);
  gsap.set(page, {
    x: box.left + (box.width - width * scale) / 2,
    y: box.top + (box.height - height * scale) / 2,
    scale,
    opacity: 1,
    transformOrigin: "0 0",
    borderRadius: 16,
  });
  page.setAttribute("data-opening-prepared", "");
  const tl = gsap.timeline({
    defaults: { ease: "power3.inOut" },
    onComplete: complete,
  });
  tl.addLabel("preview", assemblyStart);
  tl.addLabel("backend", assemblyEnd + 0.6);
  tl.from(q(".opening-boot"), { y: 16, opacity: 0, duration: 0.4 }, 0)
    .from(
      q(".opening-boot small"),
      { clipPath: "inset(0 100% 0 0)", duration: 0.45 },
      0.25,
    )
    .call(() => audioEngine.play("boot"), [], 0.1)
    .to(
      q(".opening-boot"),
      { y: -90, scale: 0.85, opacity: 0, duration: 0.45 },
      0.75,
    )
    .from(
      q(".opening-workspace"),
      {
        y: 80,
        scale: 0.8,
        rotationY: mobile ? 0 : -12,
        opacity: 0,
        duration: 0.65,
      },
      0.65,
    )
    .from(
      q(".opening-file"),
      { x: -18, opacity: 0, stagger: 0.065, duration: 0.22 },
      0.85,
    )
    .from(
      q(".opening-code"),
      { clipPath: "inset(0 100% 0 0)", x: 12, stagger: 0.12, duration: 0.3 },
      1.35,
    )
    .from(
      q(".opening-autocomplete"),
      { y: 10, opacity: 0, duration: 0.25 },
      1.95,
    )
    .call(() => audioEngine.play("code"), [], 1.4);
  // Assemble the live hero once, then expand that same page to the viewport.
  parts.forEach((part, i) => {
    tl.fromTo(
      part,
      { y: 24, scale: 0.96, opacity: 0, transformOrigin: "50% 50%" },
      {
        y: 0,
        scale: 1,
        opacity: 1,
        duration: partDuration,
        ease: "power3.out",
        immediateRender: true,
      },
      assemblyStart + i * partStagger,
    );
  });
  tl.call(() => audioEngine.play("snap"), [], 2.8)
    .call(preview, [], "preview")
    .to(
      q(".opening-backdrop"),
      { opacity: 0, duration: 0.45, ease: "none" },
      "preview",
    )
    .to(
      q(".opening-grid"),
      { opacity: 0, duration: 0.45, ease: "none" },
      "preview",
    )
    .to(
      q(".opening-workspace"),
      {
        xPercent: mobile ? 0 : -18,
        yPercent: mobile ? -25 : -8,
        rotationY: mobile ? 0 : -18,
        opacity: 0,
        scale: 0.8,
        duration: 0.25,
        ease: "power2.inOut",
      },
      "preview-=0.25",
    )
    .from(
      q(".opening-backend"),
      { y: 45, opacity: 0, duration: 0.45 },
      "backend",
    )
    .from(
      q(".opening-services > div"),
      { scale: 0.8, opacity: 0, stagger: 0.07, duration: 0.3 },
      "backend+=0.15",
    )
    .fromTo(
      q(".opening-packet"),
      { x: 0 },
      { x: packetTravel, duration: 0.65, ease: "power2.inOut" },
      "backend+=0.4",
    )
    .from(
      q(".opening-query"),
      { clipPath: "inset(0 100% 0 0)", duration: 0.45 },
      "backend+=0.85",
    )
    .call(() => audioEngine.play("request"), [], "backend+=0.4")
    .to(
      q(".opening-backend"),
      { y: 40, opacity: 0, duration: 0.4 },
      "backend+=1.45",
    )
    .from(
      q(".opening-build > span"),
      { y: 15, opacity: 0, stagger: 0.09, duration: 0.25 },
      "backend+=1.5",
    )
    .from(
      q(".opening-build strong"),
      { scale: 0.8, opacity: 0, duration: 0.45, ease: "expo.out" },
      "backend+=2",
    )
    .call(() => audioEngine.play("build"), [], "backend+=2.05")
    .call(finishing, [], "backend+=2.3")
    .call(() => audioEngine.play("reveal"), [], "backend+=2.3")
    .to(
      q(".opening-art"),
      { opacity: 0, duration: 0.55, ease: "power1.inOut" },
      "backend+=2.3",
    )
    .to(
      page,
      {
        x: 0,
        y: 0,
        scale: 1,
        borderRadius: 0,
        duration: 1.65,
        ease: "expo.inOut",
      },
      "backend+=2.3",
    )
    .to(q(".opening-controls"), { opacity: 0, duration: 0.35 }, "backend+=3.3");
  gsap.set(q(".opening-art"), { visibility: "visible" });
  if (mobile) tl.timeScale(1.42);
  return tl;
}
