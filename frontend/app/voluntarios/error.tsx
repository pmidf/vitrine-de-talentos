"use client";

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function VoluntariosError({
  reset,
}: ErrorProps) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-fundo px-4 py-10">
      <section
        className="w-full max-w-lg rounded-2xl bg-white p-8 text-center shadow-sm"
        role="alert"
      >
        <h1 className="text-2xl font-bold text-site-roxo">
          Não foi possível carregar os voluntários
        </h1>

        <p className="mt-4 text-gray-600">
          Ocorreu um problema ao carregar a página. Tente novamente.
        </p>

        <button
          type="button"
          onClick={reset}
          className="mt-6 rounded-lg bg-pmi-roxo px-6 py-3 font-semibold text-white transition hover:opacity-90"
        >
          Tentar novamente
        </button>
      </section>
    </div>
  );
}
