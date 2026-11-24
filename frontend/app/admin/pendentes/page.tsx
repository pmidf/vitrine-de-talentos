import { Suspense } from "react";
import ListaPendentes from "@/components/admin/ListaPendentes";
import ListaModerados from "@/components/admin/ListaModerados";
import IndicadorAba from "@/components/admin/IndicadorAba";
import { listarModerados, listarPendentes, type PerfilModerado, type PerfilPendente } from "@/lib/admin/perfil-actions";
import { requireAdmin } from "@/lib/auth/require-admin";
import "./pendentes.css";
import Link from "next/link";


type Aba = "pendentes" | "todos";

export default function PaginaPendentes(props: {
  searchParams: Promise<{ aba?: string }>;
}) {
  return (
    <section aria-labelledby="pending-title">
      <h1 id="pending-title">Controle de perfis</h1>
      <Suspense fallback={<p role="status">Carregando…</p>}>
        <ConteudoAdmin {...props} />
      </Suspense>
    </section>
  );
}

async function ConteudoAdmin({
  searchParams,
}: {
  searchParams: Promise<{ aba?: string }>;
}) {
  const { aba } = await searchParams;
  const abaAtual: Aba = aba === "todos" ? "todos" : "pendentes";

  return (
    <>
      <nav aria-label="Seções da moderação" className="admin-abas">
        <Link href="/admin/pendentes"
          aria-current={abaAtual === "pendentes" ? "page" : undefined}>
          Pendentes <IndicadorAba />
        </Link>
        <Link href="/admin/pendentes?aba=todos"
          aria-current={abaAtual === "todos" ? "page" : undefined}>
          Todos os voluntários <IndicadorAba />
        </Link>
      </nav>

      {abaAtual === "pendentes" ? <ConteudoPendentes /> : <ConteudoModerados />}
    </>
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

async function ConteudoModerados() {
  await requireAdmin();

  let perfis: PerfilModerado[];
  try {
    perfis = await listarModerados();
  } catch {
    return (
      <p role="alert" className="admin-error">
        Não foi possível carregar os voluntários. Verifique sua conexão e recarregue a página.
      </p>
    );
  }

  return <ListaModerados perfisIniciais={perfis} />;
}
