import HeroVoluntarios from "@/components/HeroVoluntarios";
import VoluntarioCard from "@/components/VoluntarioCard";
import { buscarPerfisPublicos } from "@/lib/perfil/perfil-actions";

export default async function VoluntariosPage() {
  const voluntarios = await buscarPerfisPublicos();
  return (
    <>
      <HeroVoluntarios />

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
          <ul className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {voluntarios.map((voluntario, indice) => (
              <li key={indice} className="min-w-0">
                <VoluntarioCard voluntario={voluntario} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
