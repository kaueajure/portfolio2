import { ImageResponse } from "next/og";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default function Image() {
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
          fontSize: 26,
        }}
      >
        <span>KAUÊ AJURE</span>
        <span style={{ color: "#376687" }}>PORTFÓLIO / SISTEMAS</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <strong style={{ fontSize: 92, letterSpacing: -5, lineHeight: 1 }}>
          Sistemas reais.
          <br />
          Da interface à operação.
        </strong>
        <span style={{ fontSize: 27, marginTop: 32, color: "#535e67" }}>
          Desenvolvimento full-stack · produtos SaaS e gestão
        </span>
      </div>
      <div style={{ height: 4, width: "100%", background: "#4a7fa3" }} />
    </div>,
    size,
  );
}
