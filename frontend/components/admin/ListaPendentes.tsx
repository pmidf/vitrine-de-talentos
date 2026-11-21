"use client";

import { useEffect, useRef, useState } from "react";
import { aprovarAction, rejeitarAction, type ResultadoModeracao } from "@/app/admin/pendentes/actions";
import type { PerfilPendente } from "@/lib/admin/perfil-actions";
import CartaoPendente from "./CartaoPendente";

const ERRO_CONEXAO =
  "Não foi possível concluir a ação. Verifique sua conexão e tente novamente.";

export default function ListaPendentes({ perfisIniciais }: { perfisIniciais: PerfilPendente[] }) {
  const [perfis, setPerfis] = useState(perfisIniciais);
  const [aviso, setAviso] = useState("");
  const avisoRef = useRef<HTMLParagraphElement>(null);

  // Leva o foco para a mensagem de sucesso: o cartão que tinha o foco sai da tela.
  useEffect(() => {
    if (aviso) avisoRef.current?.focus();
  }, [aviso]);

  async function moderar(
    perfil: PerfilPendente,
    executar: () => Promise<ResultadoModeracao>,
    mensagem: string,
  ): Promise<string | null> {
    try {
      const resultado = await executar();
      if (!resultado.ok) return resultado.erro;
    } catch {
      return ERRO_CONEXAO;
    }
    setPerfis((atual) => atual.filter((item) => item.id_perfil !== perfil.id_perfil));
    setAviso(mensagem);
    return null;
  }

  const aprovar = (perfil: PerfilPendente) =>
    moderar(perfil, () => aprovarAction(perfil.id_perfil),
      `Perfil de ${perfil.nome_perfil} aprovado. Ele passa a aparecer na vitrine.`);

  const rejeitar = (perfil: PerfilPendente, motivo: string) =>
    moderar(perfil, () => rejeitarAction(perfil.id_perfil, motivo),
      `Perfil de ${perfil.nome_perfil} rejeitado. O motivo foi registrado.`);

  return (
    <>
      <p ref={avisoRef} role="status" tabIndex={-1} className="pendentes-aviso">{aviso}</p>

      {perfis.length === 0 ? (
        <p className="pendentes-vazio">Nenhum perfil aguardando validação.</p>
      ) : (
        <>
          <p className="pendentes-contagem">
            {perfis.length === 1
              ? "1 perfil aguardando validação"
              : `${perfis.length} perfis aguardando validação`}
          </p>
          <ul className="pendentes-lista">
            {perfis.map((perfil) => (
              <CartaoPendente key={perfil.id_perfil} perfil={perfil}
                onAprovar={aprovar} onRejeitar={rejeitar} />
            ))}
          </ul>
        </>
      )}
    </>
  );
}
