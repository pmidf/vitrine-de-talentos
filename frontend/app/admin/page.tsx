import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require-admin";
import { Suspense } from "react";

export default function AdminPage() {
  return <Suspense fallback={<p role="status">Carregando...</p>}>
    <AdminRedirect />
  </Suspense>;
}

async function AdminRedirect() {
  await requireAdmin();
  redirect("/admin/pendentes");
  return null;
}
