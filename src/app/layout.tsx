import type { Metadata } from "next";
import { Syne, Figtree, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import "@/components/ui/shared.css";
const syne = Syne({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});
const figtree = Figtree({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});
const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});
export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL ?? "http://localhost:3000"),
  title: "Kauê Ajure — Desenvolvedor Full Stack",
  description:
    "Portfólio de Kauê Ajure, desenvolvedor Full Stack focado em sistemas de gestão, produtos SaaS e aplicações web completas.",
  icons: { icon: "/assets/favicon.ico", apple: "/assets/apple-touch-icon.png" },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={`${syne.variable} ${figtree.variable} ${mono.variable}`}>
        <a className="skip-link" href="#conteudo">
          Ir para o conteúdo
        </a>
        {children}
      </body>
    </html>
  );
}
