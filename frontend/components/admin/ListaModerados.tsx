"use client";

import { useEffect, useRef, useState } from "react";
import {
  reativarAction,
  removerAction,
  suspenderAction,
  type ResultadoModeracao,
} from "@/app/admin/pendentes/actions";
import type { PerfilModerado, StatusModerado } from "@/lib/admin/perfil-actions";
import CartaoModerado, { ROTULO_STATUS, type AcaoModeracao } from "./CartaoModerado";

const ERRO_CONEXAO =
  "Não foi possível concluir a ação. Verifique sua conexão e tente novamente.";

type Filtro = "todos" | StatusModerado;

const FILTROS: { valor: Filtro; rotulo: string }[] = [
  { valor: "todos", rotulo: "Todos" },
  { valor: "aprovado", rotulo: "Aprovados" },
  { valor: "suspenso", rotulo: "Suspensos" },
  { valor: "rejeitado", rotulo: "Rejeitados" },
  { valor: "removido", rotulo: "Removidos" },
];

// Para qual status o perfil vai depois de cada ação
const NOVO_STATUS: Record<AcaoModeracao, StatusModerado> = {
  suspender: "suspenso",
  remover: "removido",
  reativar: "aprovado",
};

const MENSAGEM: Record<AcaoModeracao, (nome: string) => string> = {
  suspender: (nome) => `Perfil de ${nome} suspenso. Ele não aparece mais na vitrine.`,
  remover: (nome) => `Perfil de ${nome} removido. O motivo foi registrado.`,
  reativar: (nome) => `Perfil de ${nome} reativado. Ele volta a aparecer na vitrine.`,
};

export default function ListaModerados({ perfisIniciais }: { perfisIniciais: PerfilModerado[] }) {
  const [perfis, setPerfis] = useState(perfisIniciais);
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [aviso, setAviso] = useState("");
  const avisoRef = useRef<HTMLParagraphElement>(null);

  // Leva o foco para a mensagem: com filtro ativo, o cartão pode sair da lista.
  useEffect(() => {
    if (aviso) avisoRef.current?.focus();
  }, [aviso]);

  async function executar(
    perfil: PerfilModerado,
    acao: AcaoModeracao,
    motivo: string,
  ): Promise<string | null> {
    let resultado: ResultadoModeracao;
    try {
      if (acao === "suspender") resultado = await suspenderAction(perfil.id_perfil, motivo);
      else if (acao === "remover") resultado = await removerAction(perfil.id_perfil, motivo);
      else resultado = await reativarAction(perfil.id_perfil, motivo || undefined);
    } catch {
      return ERRO_CONEXAO;
    }
    if (!resultado.ok) return resultado.erro;

    // Troca só o status deste perfil; os outros ficam como estão.
    setPerfis((atual) => atual.map((item) =>
      item.id_perfil === perfil.id_perfil ? { ...item, status_perfil: NOVO_STATUS[acao] } : item,
    ));
    setAviso(MENSAGEM[acao](perfil.nome_perfil));
    return null;
  }

  const contar = (valor: Filtro) =>
    valor === "todos" ? perfis.length : perfis.filter((p) => p.status_perfil === valor).length;

  const visiveis = filtro === "todos" ? perfis : perfis.filter((p) => p.status_perfil === filtro);

  return (
    <>
      <p ref={avisoRef} role="status" tabIndex={-1} className="pendentes-aviso">{aviso}</p>

      <fieldset className="moderados-filtro">
        <legend>Filtrar por status</legend>
        <div className="moderados-filtro-opcoes">
          {FILTROS.map((opcao) => (
            <label key={opcao.valor}>
              <input type="radio" name="filtro-status" value={opcao.valor}
                checked={filtro === opcao.valor}
                onChange={() => setFiltro(opcao.valor)} />
              {opcao.rotulo} ({contar(opcao.valor)})
            </label>
          ))}
        </div>
      </fieldset>

      {visiveis.length === 0 ? (
        <p className="pendentes-vazio">
          {filtro === "todos"
            ? "Nenhum voluntário moderado ainda."
            : `Nenhum perfil com status "${ROTULO_STATUS[filtro]}".`}
        </p>
      ) : (
        <ul className="pendentes-lista">
          {visiveis.map((perfil) => (
            <CartaoModerado key={perfil.id_perfil} perfil={perfil} onAcao={executar} />
          ))}
        </ul>
      )}
    </>
  );
}
