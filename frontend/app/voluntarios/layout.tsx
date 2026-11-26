import type { ReactNode } from "react";
import CabecalhoSite from "@/components/CabecalhoSite";
import "./galeria.css";

export default function LayoutVoluntarios({ children }: { children: ReactNode }) {
  return (
    <div className="galeria-publica min-h-screen bg-fundo">
      <a
        href="#conteudo-galeria"
        className="sr-only rounded-lg bg-white px-4 py-3 font-semibold text-site-roxo focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50"
      >
        Pular para o conteúdo
      </a>
      <CabecalhoSite />
      <main id="conteudo-galeria" tabIndex={-1}>
        {children}
      </main>
    </div>
  );
}
