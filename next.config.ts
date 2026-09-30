import type { NextConfig } from "next";
const config: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  outputFileTracingExcludes: {
    "/*": [
      "./legacy/**/*",
      "./storage/**/*",
      "./.env*",
      "./tests/**/*",
      "./test-results/**/*",
    ],
  },
  serverExternalPackages: ["mysql2", "argon2", "sharp"],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors 'none'; object-src 'none'; base-uri 'self'",
          },
        ],
      },
      {
        source: "/proposta/:path*",
        headers: [
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/admin/index.php",
        destination: "/admin/clientes",
        permanent: true,
      },
      { source: "/login.php", destination: "/login", permanent: true },
      {
        source: "/admin/proposta-editar.php",
        has: [
          { type: "query" as const, key: "id", value: "(?<proposalId>[0-9]+)" },
        ],
        destination: "/admin/propostas/:proposalId",
        permanent: true,
      },
      {
        source: "/admin/proposta-editar.php",
        destination: "/admin/propostas/nova",
        permanent: true,
      },
      ...["dashboard", "agenda", "notas", "pdf", "propostas"].map((p) => ({
        source: `/admin/${p}.php`,
        destination: `/admin/${p}`,
        permanent: true,
      })),
    ];
  },
};
export default config;
