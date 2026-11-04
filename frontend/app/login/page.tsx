import type { Metadata } from "next";
import { Suspense } from "react";
import LoginForm from "@/components/admin/LoginForm";
import { CONNECTION_ERROR, INVALID_CREDENTIALS } from "@/lib/auth/messages";
import "../admin/admin.css";

export const metadata: Metadata = {
  title: "Entrar | Administração da Vitrine de Talentos",
  robots: { index: false, follow: false },
};

export default function LoginPage(props: {
  searchParams: Promise<{ erro?: string }>;
}) {
  return <Suspense fallback={<main className="admin-login-page"><p role="status">Carregando...</p></main>}>
    <LoginContent {...props} />
  </Suspense>;
}

async function LoginContent({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const { erro } = await searchParams;
  const initialError = erro === "conexao" ? CONNECTION_ERROR
    : erro === "credenciais" ? INVALID_CREDENTIALS : null;

  return (
    <main className="admin-login-page">
      <section className="admin-card" aria-labelledby="login-title">
        <p className="admin-eyebrow">Vitrine de Talentos</p>
        <h1 id="login-title">Área de administração</h1>
        <p>Entre com seu e-mail e senha para acessar os perfis pendentes.</p>
        <LoginForm initialError={initialError} />
      </section>
    </main>
  );
}
