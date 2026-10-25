import { requireAdmin } from "@/lib/auth/require-admin";
import { Suspense } from "react";

export default function PendingProfilesPage() {
  return <Suspense fallback={<p role="status">Carregando...</p>}>
    <PendingProfilesContent />
  </Suspense>;
}

async function PendingProfilesContent() {
  await requireAdmin();
  return (
    <section aria-labelledby="pending-title">
      <h1 id="pending-title">Perfis pendentes</h1>
      <p>A lista de perfis pendentes estará disponível em breve.</p>
    </section>
  );
}
