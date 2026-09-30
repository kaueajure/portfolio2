import { ImageResponse } from "next/og";
import { projects } from "@/lib/domain/portfolio";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = projects.find((item) => item.slug === slug);
  const colors: Record<string, string> = {
    gestifique: "#376687",
    alonso: "#6e6358",
    portalmeta: "#315d60",
    flixa: "#813c4a",
  };
  const accent = colors[slug] ?? "#376687";
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 70,
        background: "#eef1f3",
        color: "#15181c",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 25,
        }}
      >
        <span>KAUÊ AJURE</span>
        <span style={{ color: accent }}>
          CASE / {project?.category.toUpperCase() ?? "PROJETO"}
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <strong style={{ fontSize: 112, letterSpacing: -5, lineHeight: 1 }}>
          {project?.name ?? "Projeto"}
        </strong>
        <span style={{ fontSize: 36, marginTop: 25 }}>
          {project?.statement ?? "Desenvolvimento full-stack"}
        </span>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderTop: `4px solid ${accent}`,
          paddingTop: 20,
          fontSize: 22,
        }}
      >
        <span>Interface / aplicação / operação</span>
        <span>KAUÊ AJURE ↗</span>
      </div>
    </div>,
    size,
  );
}
