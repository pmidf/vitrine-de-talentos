import { Suspense } from "react";
import ListaPendentes from "@/components/admin/ListaPendentes";
import { listarPendentes, type PerfilPendente } from "@/lib/admin/perfil-actions";
import { requireAdmin } from "@/lib/auth/require-admin";
import "./pendentes.css";

export default function PaginaPendentes() {
  return (
    <section aria-labelledby="pending-title">
      <h1 id="pending-title">Perfis pendentes</h1>
      <Suspense fallback={<p role="status">Carregando perfis pendentes…</p>}>
        <ConteudoPendentes />
      </Suspense>
    </section>
  );
}

async function ConteudoPendentes() {
  await requireAdmin();

  let perfis: PerfilPendente[];
  try {
    perfis = await listarPendentes();
  } catch {
    return (
      <p role="alert" className="admin-error">
        Não foi possível carregar os perfis pendentes. Verifique sua conexão e recarregue a página.
      </p>
    );
  }

  return <ListaPendentes perfisIniciais={perfis} />;
}
