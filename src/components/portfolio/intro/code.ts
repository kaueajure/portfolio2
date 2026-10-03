// Each completed JSX line reveals its matching element in the live page.
export const openingCode: { source: string; part?: string; label?: string }[] =
  [
    { source: 'import { Header } from "@/components/portfolio/header";' },
    { source: "export default function Home() {" },
    { source: "  return (" },
    { source: "    <>" },
    { source: "      <Header />", part: "header", label: "Cabeçalho" },
    {
      source: "      <span>Desenvolvedor full-stack</span>",
      part: "intro",
      label: "Apresentação",
    },
    { source: "      <h1>Kauê Ajure.</h1>", part: "title", label: "Título" },
    {
      source:
        "      <p>Produtos digitais com interfaces pensadas para pessoas e estrutura para funcionar de ponta a ponta.</p>",
      part: "copy",
      label: "Descrição",
    },
    {
      source: '      <a href="#projetos">Ver projetos ↘</a>',
      part: "projects-action",
      label: "Botão de projetos",
    },
    {
      source: '      <a href="#contato">Conversar sobre um projeto ↗</a>',
      part: "contact-action",
      label: "Contato",
    },
    {
      source: "      <div>Interfaces reais. Decisões por trás delas.</div>",
      part: "note",
      label: "Nota final",
    },
    { source: "    </>" },
    { source: "  );" },
    { source: "}" },
  ];
