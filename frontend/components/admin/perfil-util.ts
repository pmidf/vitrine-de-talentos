export function iniciais(nome: string) {
  return nome.trim().split(/\s+/).filter(Boolean).slice(0, 2)
    .map((parte) => parte[0].toUpperCase()).join("") || "?";
}

export function linkSeguro(valor: string | null) {
  if (!valor?.trim()) return { tipo: "vazio" as const };
  try {
    const url = new URL(valor.trim());
    if (url.protocol !== "https:") return { tipo: "invalido" as const };
    const caminho = url.pathname === "/" ? "" : url.pathname;
    return { tipo: "ok" as const, href: url.toString(), texto: `${url.hostname}${caminho}` };
  } catch {
    return { tipo: "invalido" as const };
  }
}
