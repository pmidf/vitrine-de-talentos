import Link from "next/link";
import CabecalhoSite from "@/components/CabecalhoSite";
import HeroVoluntarios from "@/components/HeroVoluntarios";
import VoluntarioCard from "@/components/VoluntarioCard";
import { buscarPerfisPublicos } from "@/lib/perfil/perfil-actions";

export default async function VoluntariosPage() {
  const voluntarios = await buscarPerfisPublicos();
  return (
    <main className="min-h-screen bg-fundo">
      <CabecalhoSite />

      <HeroVoluntarios />

      <div className="px-4 pt-8 text-center">
        <Link
          href="/cadastro"
          className="inline-flex rounded-lg bg-site-roxo px-5 py-3 font-semibold text-white hover:bg-pmi-roxo"
        >
          Envie seu perfil
        </Link>
      </div>

      {/* scroll-mt: deixa um respiro quando o botão do hero rola até aqui */}
      <section
        id="galeria"
        aria-labelledby="galeria-titulo"
        className="mx-auto max-w-7xl scroll-mt-8 px-4 py-12 sm:px-6 lg:px-8"
      >
        <h2
          id="galeria-titulo"
          className="text-2xl font-bold text-site-roxo sm:text-3xl"
        >
          Conheça nossos voluntários
        </h2>

        {voluntarios.length === 0 ? (
          <div
            className="mt-8 rounded-2xl bg-white p-8 text-center shadow-sm"
            aria-live="polite"
          >
            <h3 className="text-xl font-semibold text-site-roxo">
              Nenhum voluntário encontrado
            </h3>
            <p className="mt-3 text-gray-600">
              Ainda não temos voluntários para exibir. Volte em breve!
            </p>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {voluntarios.map((voluntario, indice) => (
              <VoluntarioCard key={indice} voluntario={voluntario} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
