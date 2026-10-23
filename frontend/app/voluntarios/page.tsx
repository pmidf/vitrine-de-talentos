import HeroVoluntarios from "@/components/HeroVoluntarios";
import VoluntarioCard from "@/components/VoluntarioCard";
import { buscarVoluntarios } from "@/lib/mock-voluntarios";

export default async function VoluntariosPage() {
  const voluntarios = await buscarVoluntarios();

  return (
    <main className="min-h-screen bg-fundo px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
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
            {voluntarios.map((voluntario) => (
              <VoluntarioCard
                key={voluntario.id_perfil}
                voluntario={voluntario}
                perfilFicticio
              />
            ))}
          </section>
        )}
      </div>
    </main>
  );
}