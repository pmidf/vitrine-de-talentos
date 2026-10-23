import HeroVoluntarios from "@/components/HeroVoluntarios";
import { SkeletonGaleria } from "@/components/SkeletonGaleria";

export default function LoadingVoluntarios() {
  return (
    <main
      className="min-h-screen bg-fundo px-4 py-10 sm:px-6 lg:px-8"
      aria-busy="true"
    >
      <div className="mx-auto max-w-7xl">
        <HeroVoluntarios />

        <p className="sr-only" role="status">
          Carregando voluntários...
        </p>

        <div className="mt-10">
          <SkeletonGaleria />
        </div>
      </div>
    </main>
  );
}