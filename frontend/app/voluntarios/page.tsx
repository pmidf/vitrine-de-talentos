import HeroVoluntarios from "@/components/HeroVoluntarios";
import VoluntarioCard from "@/components/VoluntarioCard";
import { buscarPerfisPublicos } from "@/lib/perfil/perfil-actions";
import Link from "next/link";

export default async function VoluntariosPage() {
  const voluntarios = await buscarPerfisPublicos();
  return (
    <main className="min-h-screen bg-fundo px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Discreto: o visitante não precisa, só a equipe que modera */}
        <nav aria-label="Acesso interno" className="flex justify-end">
          <Link
            href="/login"
            className="rounded-md border-2 border-white bg-pmi-roxo px-4 py-2 text-sm font-semibold text-white shadow-[0_0_0_1px_var(--pmi-roxo)] transition-colors hover:bg-site-roxo hover:shadow-[0_0_0_1px_var(--site-roxo)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-pmi-roxo"

          >
            Acesso interno
          </Link>
        </nav>

        <HeroVoluntarios />

        {voluntarios.length === 0 ? (
          <section
            className="mt-12 rounded-2xl bg-white p-8 text-center shadow-sm"
            aria-live="polite"
          >
            <h2 className="text-xl font-semibold text-site-roxo">
              Nenhum voluntário encontrado
            </h2>

            <p className="mt-3 text-gray-600">
              Ainda não temos voluntários para exibir. Volte em breve!
            </p>
          </section>
        ) : (
          <section
            className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            aria-label="Galeria de voluntários"
          >
            {voluntarios.map((voluntario, indice) => (
              <VoluntarioCard key={indice} voluntario={voluntario} />
            ))}
          </section>
        )}
      </div>
    </main>
  );
}