import HeroVoluntarios from "@/components/HeroVoluntarios";
import { SkeletonGaleria } from "@/components/SkeletonGaleria";

export default function LoadingVoluntarios() {
  return (
    <>
      <HeroVoluntarios />

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <p className="sr-only" role="status">
          Carregando voluntários...
        </p>
        <div aria-hidden="true">
          <SkeletonGaleria />
        </div>
      </div>
    </>
  );
}
