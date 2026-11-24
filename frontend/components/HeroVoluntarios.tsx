import Link from "next/link";

// Hero da Vitrine: faixa roxa de destaque no topo da galeria (SCRUM-142).
export default function HeroVoluntarios() {
  return (
    <section
      aria-labelledby="hero-titulo"
      className="relative overflow-hidden text-site-roxo"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 hidden w-2/5 md:block"
        style={{
          backgroundImage:
            "repeating-linear-gradient(135deg, transparent 0 90px, color-mix(in srgb, var(--pmi-azul) 25%, transparent) 90px 91px)",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <p className="flex items-center gap-4 text-sm font-bold uppercase tracking-[0.25em]">
          <span aria-hidden="true" className="h-0.5 w-10 bg-pmi-laranja" />
          PMI-DF Student Club
        </p>

        <h1
          id="hero-titulo"
          className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl"
        >
          Vitrine de Talentos
        </h1>

        <p className="mt-5 text-xl font-bold sm:text-2xl">
          As pessoas que constroem o Student Club.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-4">
          <p className="text-lg font-semibold">É voluntário do Student Club?</p>
          <Link
            href="/cadastro"
            className="inline-flex rounded-lg bg-site-roxo px-6 py-3 font-semibold text-white transition-colors hover:bg-pmi-roxo focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-pmi-roxo"
          >
            Envie seu perfil
          </Link>
        </div>

      </div>

      {/* Faixa tricolor do PMI-DF: laranja, azul e roxo */}
      <div aria-hidden="true" className="relative flex h-1.5">
        <span className="w-[35%] bg-pmi-laranja" />
        <span className="w-[38%] bg-pmi-azul" />
        <span className="flex-1 bg-pmi-roxo" />
      </div>
    </section>
  );
}
