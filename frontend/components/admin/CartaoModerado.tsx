"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import type { PerfilModerado, StatusModerado } from "@/lib/admin/perfil-actions";
import { iniciais, linkSeguro } from "./perfil-util";

export type AcaoModeracao = "suspender" | "remover" | "reativar";

type Props = {
  perfil: PerfilModerado;
  onAcao: (perfil: PerfilModerado, acao: AcaoModeracao, motivo: string) => Promise<string | null>;
};

const ACOES_POR_STATUS: Record<StatusModerado, AcaoModeracao[]> = {
  aprovado: ["suspender", "remover"],
  suspenso: ["reativar", "remover"],
  rejeitado: ["remover"],
  removido: [], // remoção é definitiva
};

export const ROTULO_STATUS: Record<StatusModerado, string> = {
  aprovado: "Aprovado",
  rejeitado: "Rejeitado",
  suspenso: "Suspenso",
  removido: "Removido",
};

const TEXTOS: Record<AcaoModeracao, {
  botao: string; ajuda: string; rotuloMotivo: string;
  confirmar: string; enviando: string; obrigatorio: boolean; perigo: boolean;
}> = {
  suspender: {
    botao: "Suspender", ajuda: "O perfil sai da vitrine até ser reativado.",
    rotuloMotivo: "Motivo da suspensão (obrigatório)",
    confirmar: "Confirmar suspensão", enviando: "Suspendendo...", obrigatorio: true, perigo: false,
  },
  remover: {
    botao: "Remover", ajuda: "O perfil sai da vitrine de forma definitiva.",
    rotuloMotivo: "Motivo da remoção (obrigatório)",
    confirmar: "Confirmar remoção", enviando: "Removendo...", obrigatorio: true, perigo: true,
  },
  reativar: {
    botao: "Reativar", ajuda: "O perfil volta a aparecer na vitrine.",
    rotuloMotivo: "Motivo da reativação (opcional)",
    confirmar: "Confirmar reativação", enviando: "Reativando...", obrigatorio: false, perigo: false,
  },
};

export default function CartaoModerado({ perfil, onAcao }: Props) {
  const id = useId();
  const [acao, setAcao] = useState<AcaoModeracao | null>(null);
  const [motivo, setMotivo] = useState("");
  const [motivoVazio, setMotivoVazio] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const campoMotivo = useRef<HTMLTextAreaElement>(null);
  const botoes = useRef<Partial<Record<AcaoModeracao, HTMLButtonElement | null>>>({});
  const voltarPara = useRef<AcaoModeracao | null>(null);

  useEffect(() => {
    if (acao) campoMotivo.current?.focus();
    else if (voltarPara.current) {
      botoes.current[voltarPara.current]?.focus();
      voltarPara.current = null;
    }
  }, [acao]);

  function abrir(nova: AcaoModeracao) {
    setErro(null);
    setMotivo("");
    setMotivoVazio(false);
    setAcao(nova);
  }

  function cancelar() {
    if (enviando) return;
    voltarPara.current = acao;
    setErro(null);
    setMotivo("");
    setMotivoVazio(false);
    setAcao(null);
  }

  async function confirmar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!acao || enviando) return;
    const texto = motivo.trim();
    if (TEXTOS[acao].obrigatorio && !texto) {
      setMotivoVazio(true);
      campoMotivo.current?.focus();
      return;
    }
    setEnviando(true);
    setErro(null);
    const mensagem = await onAcao(perfil, acao, texto);
    setEnviando(false);
    if (mensagem) {
      setErro(mensagem);
      return;
    }
    setAcao(null);
    setMotivo("");
  }

  const link = linkSeguro(perfil.linkedin_perfil);
  const acoes = ACOES_POR_STATUS[perfil.status_perfil];
  const textos = acao ? TEXTOS[acao] : null;

  return (
    <li className="pendentes-card" aria-busy={enviando}>
      <article aria-labelledby={`${id}-nome`}>
        <div className="pendentes-topo">
          {perfil.foto_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={perfil.foto_url} alt={`Foto de ${perfil.nome_perfil}`} className="pendentes-foto" />
          ) : (
            <div aria-hidden="true" className="pendentes-foto pendentes-foto-padrao">
              {iniciais(perfil.nome_perfil)}
            </div>
          )}

          <div>
            <h2 id={`${id}-nome`} className="pendentes-nome">
              {perfil.nome_perfil}{" "}
              <span className={`moderados-status moderados-status-${perfil.status_perfil}`}>
                {ROTULO_STATUS[perfil.status_perfil]}
              </span>
            </h2>
            <dl className="pendentes-dados">
              <div><dt>Curso</dt><dd>{perfil.curso_perfil}</dd></div>
              <div><dt>Cargo</dt><dd>{perfil.cargo_perfil}</dd></div>
              <div>
                <dt>LinkedIn</dt>
                <dd>
                  {link.tipo === "ok" && (
                    <a href={link.href} target="_blank" rel="noopener noreferrer">
                      {link.texto}<span className="admin-sr-only"> (abre em nova aba)</span>
                    </a>
                  )}
                  {link.tipo === "vazio" && "Não informado"}
                  {link.tipo === "invalido" && "Link inválido (não será aberto)"}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="pendentes-acoes">
          {!acao && acoes.length === 0 && (
            <p className="moderados-sem-acao">Remoção definitiva: nenhuma ação disponível.</p>
          )}

          {!acao && acoes.map((item) => (
            <div key={item} className="pendentes-acao">
              <button type="button"
                ref={(el) => { botoes.current[item] = el; }}
                className={item === "reativar" ? "admin-primary-button" : "admin-secondary-button"}
                aria-label={`${TEXTOS[item].botao} perfil de ${perfil.nome_perfil}`}
                aria-describedby={`${id}-ajuda-${item}`}
                onClick={() => abrir(item)}>
                {TEXTOS[item].botao}
              </button>
              <p id={`${id}-ajuda-${item}`}>{TEXTOS[item].ajuda}</p>
            </div>
          ))}

          {acao && textos && (
            <form onSubmit={confirmar} noValidate className="pendentes-painel"
              aria-label={`${textos.botao} perfil de ${perfil.nome_perfil}`}>
              <label htmlFor={`${id}-motivo`}>{textos.rotuloMotivo}</label>
              <p id={`${id}-ajuda-motivo`}>{textos.ajuda}</p>
              <textarea id={`${id}-motivo`} ref={campoMotivo} value={motivo} maxLength={500}
                onChange={(e) => { setMotivo(e.target.value); setMotivoVazio(false); }}
                disabled={enviando}
                aria-required={textos.obrigatorio} aria-invalid={motivoVazio}
                aria-describedby={`${id}-ajuda-motivo${motivoVazio ? ` ${id}-erro-motivo` : ""}`} />
              {motivoVazio && (
                <p id={`${id}-erro-motivo`} role="alert" className="admin-error">
                  Escreva o motivo para continuar.
                </p>
              )}
              <div className="pendentes-botoes">
                <button type="submit" disabled={enviando}
                  className={`admin-primary-button${textos.perigo ? " pendentes-perigo" : ""}`}>
                  {enviando ? textos.enviando : textos.confirmar}
                </button>
                <button type="button" className="admin-secondary-button"
                  onClick={cancelar} disabled={enviando}>Cancelar</button>
              </div>
              {erro && <p role="alert" className="admin-error">{erro}</p>}
            </form>
          )}
        </div>
      </article>
    </li>
  );
}
