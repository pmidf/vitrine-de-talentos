import type { Voluntario } from "@/types/voluntarios";

type VoluntarioCardProps = {
  voluntario: Voluntario;
  perfilFicticio?: boolean;
};

export default function VoluntarioCard({
  voluntario,
  perfilFicticio = false,
}: VoluntarioCardProps) {
  const {
    nome_perfil,
    curso_perfil,
    cargo_perfil,
    linkedin_perfil,
    foto_perfil,
  } = voluntario;

  const iniciais = nome_perfil
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte[0])
    .join("")
    .toUpperCase();

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
      <div className="flex justify-center bg-gray-50 px-6 pt-7">
        {foto_perfil ? (
          <img
            src={foto_perfil}
            alt={`Foto de ${nome_perfil}`}
            className="h-28 w-28 rounded-full border-4 border-white object-cover shadow-sm"
          />
        ) : (
          <div
            className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-white bg-pmi-roxo text-3xl font-bold text-white shadow-sm"
            role="img"
            aria-label={`Foto não disponível para ${nome_perfil}`}
          >
            {iniciais}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-6 text-center">
        <h2 className="break-words text-lg font-bold text-site-roxo">
          {nome_perfil}
        </h2>

        <p className="mt-2 break-words text-sm leading-6 text-gray-600">
          {curso_perfil}
        </p>

        <p className="mt-3 break-words text-sm font-semibold text-site-azul">
          {cargo_perfil}
        </p>

        <div className="mt-auto pt-6">
          {linkedin_perfil ? (
            <a
              href={linkedin_perfil}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Ver o LinkedIn de ${nome_perfil} em uma nova aba`}
              className="inline-flex rounded-lg bg-pmi-roxo px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-pmi-roxo focus:ring-offset-2"
            >
              LinkedIn
            </a>
          ) : (
            <p className="text-sm text-gray-500">
              LinkedIn não informado
            </p>
          )}
        </div>

        {perfilFicticio && (
          <p className="mt-4 text-xs text-gray-400">
            Perfil demonstrativo
          </p>
        )}
      </div>
    </article>
  );
}