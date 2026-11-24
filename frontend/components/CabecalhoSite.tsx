import Image from "next/image";
import Link from "next/link";

// Início e Student Club levam ao site do PMI-DF; a Vitrine é esta página.
const LINKS = [
  { texto: "Início", href: "https://pmidf.org/" },
  { texto: "Student Club", href: "https://pmidf.org/student-club/" },
  { texto: "Vitrine de Talentos", href: "/voluntarios", atual: true },
];
const CLASSE_ACESSO =
  "rounded-md border-2 border-white bg-pmi-roxo px-4 py-2 text-sm font-semibold text-white shadow-[0_0_0_1px_var(--pmi-roxo)] transition-colors hover:bg-site-roxo hover:shadow-[0_0_0_1px_var(--site-roxo)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-pmi-roxo";

export default function CabecalhoSite() {
  return (
    <header className="bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/voluntarios">
          <Image          
            src="/logo-pmidf.webp"
            alt="PMI Distrito Federal"
            width={193}
            height={75}

          />
        </Link>

        {/* Computador: links lado a lado */}
        <nav aria-label="Principal" className="hidden items-center gap-8 lg:flex">
          {LINKS.map((link) => (
            <Link
              key={link.texto}
              href={link.href}
              aria-current={link.atual ? "page" : undefined}
              className={`border-b-2 py-2 text-site-roxo transition-colors hover:text-pmi-roxo ${
                link.atual ? "border-pmi-laranja font-bold" : "border-transparent"
              }`}
            >
              {link.texto}
            </Link>
          ))}
          <Link href="/login" className={CLASSE_ACESSO}>
            Acesso interno
          </Link>
        </nav>

        {/* Celular: botão Menu que abre e fecha a lista */}
        <details className="relative lg:hidden">
          <summary className="cursor-pointer list-none rounded-md border border-[var(--cor-borda)] px-4 py-2 font-semibold text-site-roxo [&::-webkit-details-marker]:hidden">
            Menu
          </summary>
          <nav
            aria-label="Principal"
            className="absolute right-0 z-10 mt-2 flex w-64 flex-col gap-1 rounded-lg border border-[var(--cor-borda)] bg-white p-3 shadow-lg"
          >
            {LINKS.map((link) => (
              <Link
                key={link.texto}
                href={link.href}
                aria-current={link.atual ? "page" : undefined}
                className={`rounded px-3 py-2 text-site-roxo hover:bg-[var(--cor-borda)] ${
                  link.atual ? "font-bold" : ""
                }`}
              >
                {link.texto}
              </Link>
            ))}
            <Link href="/login" className={`mt-2 text-center ${CLASSE_ACESSO}`}>
              Acesso interno
            </Link>
          </nav>
        </details>
      </div>

      {/* Trilha de navegação */}
      <nav aria-label="Trilha de navegação" className="border-t border-[var(--cor-borda)]">
        <ol className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 px-4 py-3 text-sm text-[var(--cor-texto-secundario)] sm:px-6 lg:px-8">
          <li>
            <Link href="https://pmidf.org/" className="hover:text-pmi-roxo">Início</Link>
          </li>
          <li aria-hidden="true">›</li>
          <li>
            <Link href="https://pmidf.org/student-club/" className="hover:text-pmi-roxo">Student Club</Link>
          </li>
          <li aria-hidden="true">›</li>
          <li aria-current="page" className="font-bold text-site-roxo">Vitrine de Talentos</li>
        </ol>
      </nav>
    </header>
  );
}
