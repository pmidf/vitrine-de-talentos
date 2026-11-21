import HeroVoluntarios from "@/components/HeroVoluntarios";
import { SkeletonGaleria } from "@/components/SkeletonGaleria";
import CabecalhoSite from "@/components/CabecalhoSite";

export default function LoadingVoluntarios() {
  return (
    <main className="min-h-screen bg-fundo" aria-busy="true">
      <CabecalhoSite />
      <HeroVoluntarios />

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <p className="sr-only" role="status">
          Carregando voluntários...
        </p>
        <SkeletonGaleria />
      </div>
    </main>
  );
}
