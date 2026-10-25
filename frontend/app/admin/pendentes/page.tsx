import { requireAdmin } from "@/lib/auth/require-admin";

export default async function PendingProfilesPage() {
  await requireAdmin();
  return (
    <section aria-labelledby="pending-title">
      <h1 id="pending-title">Perfis pendentes</h1>
      <p>A lista de perfis pendentes estará disponível em breve.</p>
    </section>
  );
}
