import type { gsap as Gsap } from "gsap";
import { audioEngine } from "@/lib/audio";
import { openingCode } from "./code";
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
  const typingStart = 1.4;
  const typingSteps = openingCode.map((line) => ({
    ...line,
    duration: Math.max(0.14, Math.min(1.25, line.source.length * 0.012)),
  }));
  const typingEnd =
    typingStart +
    typingSteps.reduce((total, line) => total + line.duration + 0.14, 0);
  const rows = gsap.utils.toArray<HTMLElement>(q(".opening-code"));
  const scroller = root.querySelector<HTMLElement>(".opening-code-scroll")!;
  const status = root.querySelector<HTMLElement>(".opening-code-status")!;
  const progress = root.querySelector<HTMLElement>(".opening-code-progress")!;
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
  tl.addLabel("preview", 1.15);
  tl.addLabel("typed", typingEnd);
  tl.addLabel("backend", "typed+=0.5");
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
    );
  gsap.set(parts, {
    y: 18,
    scale: 0.98,
    opacity: 0,
    transformOrigin: "50% 50%",
  });
  let position = typingStart;
  let unlocked = 0;
  typingSteps.forEach((line, index) => {
    const row = rows[index];
    const typed = row.querySelector<HTMLElement>(".opening-typed")!;
    const characters = { count: 0 };
    const target = line.part
      ? parts.find((part) => part.dataset.openingPart === line.part)
      : undefined;
    tl.to(
      characters,
      {
        count: line.source.length,
        duration: line.duration,
        ease: "none",
        onStart: () => {
          // Scroll only the editor, preserving the locked page and preview camera.
          scroller.scrollTop = Math.max(
            0,
            row.offsetTop - scroller.clientHeight * 0.55,
          );
          row.dataset.codeState = "typing";
          status.textContent = line.label
            ? `Digitando: ${line.label.toLowerCase()}…`
            : "Digitando a estrutura…";
        },
        onUpdate: () => {
          typed.textContent = line.source.slice(
            0,
            Math.floor(characters.count),
          );
        },
        onComplete: () => {
          typed.textContent = line.source;
          row.dataset.codeState = "complete";
          if (target) {
            unlocked += 1;
            progress.textContent = `${unlocked} / ${parts.length}`;
            status.textContent = `✓ ${line.label} na prévia`;
            audioEngine.play("code");
          }
        },
      },
      position,
    );
    if (target)
      tl.to(
        target,
        { y: 0, scale: 1, opacity: 1, duration: 0.35, ease: "power2.out" },
        position + line.duration,
      );
    position += line.duration + 0.14;
  });
  tl.call(preview, [], "preview")
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
    .call(
      () => {
        status.textContent = "✓ Tela inicial concluída";
      },
      [],
      "typed",
    )
    .to(
      q(".opening-workspace"),
      { opacity: 0, y: -12, duration: 0.4 },
      "typed+=0.1",
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
  if (mobile) tl.timeScale(1.2);
  return tl;
}
