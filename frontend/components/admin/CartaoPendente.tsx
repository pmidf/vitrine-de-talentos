"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import type { PerfilPendente } from "@/lib/admin/perfil-actions";

type Props = {
  perfil: PerfilPendente;
  // Devolvem uma mensagem de erro em caso de falha e null em caso de sucesso.
  onAprovar: (perfil: PerfilPendente) => Promise<string | null>;
  onRejeitar: (perfil: PerfilPendente, motivo: string) => Promise<string | null>;
};

function iniciais(nome: string) {
  return nome.trim().split(/\s+/).filter(Boolean).slice(0, 2)
    .map((parte) => parte[0].toUpperCase()).join("") || "?";
}

// O endereço vem de um formulário público: só links https viram link clicável.
function linkSeguro(valor: string | null) {
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

type Modo = "inicio" | "aprovar" | "rejeitar";

export default function CartaoPendente({ perfil, onAprovar, onRejeitar }: Props) {
  const id = useId();
  const [modo, setModo] = useState<Modo>("inicio");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [motivo, setMotivo] = useState("");
  const [motivoVazio, setMotivoVazio] = useState(false);

  const botaoAprovar = useRef<HTMLButtonElement>(null);
  const botaoRejeitar = useRef<HTMLButtonElement>(null);
  const botaoConfirmar = useRef<HTMLButtonElement>(null);
  const campoMotivo = useRef<HTMLTextAreaElement>(null);
  const voltarPara = useRef<Modo | null>(null);

  // Mantém o foco no lugar certo ao abrir ou fechar um painel (uso só com teclado).
  useEffect(() => {
    if (modo === "aprovar") botaoConfirmar.current?.focus();
    if (modo === "rejeitar") campoMotivo.current?.focus();
    if (modo === "inicio" && voltarPara.current) {
      (voltarPara.current === "aprovar" ? botaoAprovar : botaoRejeitar).current?.focus();
      voltarPara.current = null;
    }
  }, [modo]);

  function abrir(novo: Modo) {
    setErro(null);
    setMotivoVazio(false);
    setModo(novo);
  }

  function cancelar() {
    if (enviando) return;
    voltarPara.current = modo;
    setErro(null);
    setMotivoVazio(false);
    setMotivo("");
    setModo("inicio");
  }

  async function confirmarAprovacao() {
    if (enviando) return;
    setEnviando(true);
    setErro(null);
    const mensagem = await onAprovar(perfil);
    // Em caso de sucesso a lista remove este cartão.
    if (mensagem) {
      setErro(mensagem);
      setEnviando(false);
    }
  }

  async function confirmarRejeicao(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (enviando) return;
    const texto = motivo.trim();
    if (!texto) {
      setMotivoVazio(true);
      campoMotivo.current?.focus();
      return;
    }
    setMotivoVazio(false);
    setEnviando(true);
    setErro(null);
    const mensagem = await onRejeitar(perfil, texto);
    if (mensagem) {
      setErro(mensagem);
      setEnviando(false);
    }
  }

  const link = linkSeguro(perfil.linkedin_perfil);
  const temFoto = Boolean(perfil.foto_perfil);

  return (
    <li className="pendentes-card" aria-busy={enviando}>
      <article aria-labelledby={`${id}-nome`}>
        <div className="pendentes-topo">
          <div role="img" aria-label={`Foto não disponível para ${perfil.nome_perfil}`}
            className="pendentes-foto pendentes-foto-padrao">
            {iniciais(perfil.nome_perfil)}
          </div>

          <div>
            <h2 id={`${id}-nome`} className="pendentes-nome">{perfil.nome_perfil}</h2>
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
              <div>
                <dt>Foto</dt>
                <dd>{temFoto ? "Enviada" : "Não enviada"}</dd>
              </div>
              <div>
                <dt>Consentimento (LGPD)</dt>
                <dd>{perfil.tb_lgpd_perfil?.aceite_lgpd ? "Concedido" : "Não concedido"}</dd>
              </div>
              <div>
                <dt>Uso de imagem</dt>
                <dd>{perfil.tb_lgpd_perfil?.aceite_imagem_lgpd ? "Autorizado" : "Não autorizado"}</dd>
              </div>
            </dl>
            {temFoto && !perfil.tb_lgpd_perfil?.aceite_imagem_lgpd && (
              <p className="pendentes-alerta">
                Atenção: este perfil tem foto, mas a pessoa não autorizou o uso de imagem.
              </p>
            )}
          </div>
        </div>

        <div className="pendentes-acoes">
          {modo === "inicio" && (
            <>
              <div className="pendentes-acao">
                <button ref={botaoAprovar} type="button" className="admin-primary-button"
                  aria-label={`Aprovar perfil de ${perfil.nome_perfil}`}
                  aria-describedby={`${id}-ajuda-aprovar`} onClick={() => abrir("aprovar")}>
                  Aprovar
                </button>
                <p id={`${id}-ajuda-aprovar`}>O perfil passa a aparecer na vitrine pública.</p>
              </div>
              <div className="pendentes-acao">
                <button ref={botaoRejeitar} type="button" className="admin-secondary-button"
                  aria-label={`Rejeitar perfil de ${perfil.nome_perfil}`}
                  aria-describedby={`${id}-ajuda-rejeitar`} onClick={() => abrir("rejeitar")}>
                  Rejeitar
                </button>
                <p id={`${id}-ajuda-rejeitar`}>O perfil não aparece e o motivo fica registrado.</p>
              </div>
            </>
          )}

          {modo === "aprovar" && (
            <div role="group" aria-label={`Confirmar aprovação de ${perfil.nome_perfil}`}
              className="pendentes-painel">
              <p>Aprovar o perfil de <strong>{perfil.nome_perfil}</strong>? Ele passará a aparecer na vitrine pública.</p>
              <div className="pendentes-botoes">
                <button ref={botaoConfirmar} type="button" className="admin-primary-button"
                  onClick={confirmarAprovacao} disabled={enviando}>
                  {enviando ? "Aprovando..." : "Sim, aprovar"}
                </button>
                <button type="button" className="admin-secondary-button"
                  onClick={cancelar} disabled={enviando}>Cancelar</button>
              </div>
              {erro && <p role="alert" className="admin-error">{erro}</p>}
            </div>
          )}

          {modo === "rejeitar" && (
            <form onSubmit={confirmarRejeicao} noValidate className="pendentes-painel"
              aria-label={`Rejeitar perfil de ${perfil.nome_perfil}`}>
              <label htmlFor={`${id}-motivo`}>Motivo da rejeição (obrigatório)</label>
              <p id={`${id}-ajuda-motivo`}>O perfil não aparece na vitrine e o motivo fica registrado.</p>
              <textarea id={`${id}-motivo`} ref={campoMotivo} value={motivo} maxLength={500}
                onChange={(e) => {
                  setMotivo(e.target.value);
                  setMotivoVazio(false);
                }} disabled={enviando}
                aria-required="true" aria-invalid={motivoVazio}
                aria-describedby={`${id}-ajuda-motivo${motivoVazio ? ` ${id}-erro-motivo` : ""}`} />
              {motivoVazio && (
                <p id={`${id}-erro-motivo`} role="alert" className="admin-error">
                  Escreva o motivo da rejeição para continuar.
                </p>
              )}
              <div className="pendentes-botoes">
                <button type="submit" className="admin-primary-button pendentes-perigo" disabled={enviando}>
                  {enviando ? "Rejeitando..." : "Confirmar rejeição"}
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
