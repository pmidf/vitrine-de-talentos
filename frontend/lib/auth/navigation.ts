// Uma mudança de sessão precisa descartar páginas protegidas mantidas pelo roteador.
export function navigateAfterAuth(path: "/login" | "/admin/pendentes") {
  window.location.replace(path);
}
