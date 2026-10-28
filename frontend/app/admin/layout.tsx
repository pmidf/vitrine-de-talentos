import type { Metadata } from "next";
import { Suspense } from "react";
import LogoutButton from "@/components/admin/LogoutButton";
import { requireAdmin } from "@/lib/auth/require-admin";
import "./admin.css";

export const metadata: Metadata = {
  title: "Administração | Vitrine de Talentos",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<main className="admin-login-page"><p role="status">Carregando...</p></main>}>
    <ProtectedAdmin>{children}</ProtectedAdmin>
  </Suspense>;
}

async function ProtectedAdmin({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div className="admin-admin-page">
      <header className="admin-header">
        <div><strong>Vitrine de Talentos</strong><p>Área de administração</p></div>
        <LogoutButton />
      </header>
      <main className="admin-content">{children}</main>
    </div>
  );
}
