"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { enviarPerfil } from "./actions";
import { recortarFoto, TIPOS_ACEITOS } from "./foto";
import { validarCadastro, type ErrosCadastro } from "./validacao";

const campos = [
  { id: "nome_perfil", rotulo: "Nome completo", limite: 150, autoComplete: "name" },
  { id: "curso_perfil", rotulo: "Curso", limite: 100 },
  { id: "cargo_perfil", rotulo: "Cargo no Student Club", limite: 100 },
  { id: "linkedin_perfil", rotulo: "LinkedIn (opcional)", limite: 255, opcional: true },
];

const estiloCampo = "w-full min-w-0 rounded-lg border border-gray-400 bg-white px-3 py-2 aria-invalid:border-site-laranja";
const estiloBotao = "w-full rounded-lg bg-site-roxo px-5 py-3 font-semibold text-white hover:bg-pmi-roxo disabled:opacity-60";

function ErroCampo({ campo, erros }: { campo: string; erros: ErrosCadastro }) {
  return erros[campo] && (
    <p id={`${campo}-erro`} className="mt-1 text-sm text-site-laranja" role="alert">
      {erros[campo]}
    </p>
  );
}

export default function PaginaCadastro() {
  const [erros, setErros] = useState<ErrosCadastro>({});
  const [mensagem, setMensagem] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [preview, setPreview] = useState("");
  const [temFoto, setTemFoto] = useState(false);
  const formularioRef = useRef<HTMLFormElement>(null);
  const retornoRef = useRef<HTMLHeadingElement>(null);
  const emEnvio = useRef(false);

  useEffect(() => {
    if (enviado) {
      retornoRef.current?.focus();
      return;
    }
    formularioRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }, [erros, enviado]);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  function acessibilidade(campo: string, ajuda?: string) {
    return {
      "aria-invalid": Boolean(erros[campo]),
      "aria-describedby": [ajuda, erros[campo] && `${campo}-erro`].filter(Boolean).join(" ") || undefined,
    };
  }

  async function enviarFormulario(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (emEnvio.current) return;

    const formulario = new FormData(evento.currentTarget);
    const resultado = validarCadastro(formulario);
    setMensagem("");
    setErros(resultado.erros);
    if (Object.keys(resultado.erros).length) return;

    emEnvio.current = true;
    setEnviando(true);

    try {
      if (resultado.foto) {
        try {
          formulario.set("foto_perfil", await recortarFoto(resultado.foto));
        } catch (erro) {
          setErros({
            foto_perfil: erro instanceof Error ? erro.message : "Não foi possível recortar a foto.",
          });
          return;
        }
      } else {
        formulario.delete("foto_perfil");
      }

      const resposta = await enviarPerfil(formulario);
      if (resposta.ok) {
        setPreview("");
        setEnviado(true);
      } else {
        setErros(resposta.erros ?? {});
        setMensagem(resposta.mensagem ?? "");
      }
    } catch {
      setMensagem("Não foi possível enviar o perfil. Tente novamente.");
    } finally {
      emEnvio.current = false;
      setEnviando(false);
    }
  }

  function removerFoto() {
    const campo = formularioRef.current?.querySelector<HTMLInputElement>("#foto_perfil");
    if (campo) {
      campo.value = "";
      campo.focus();
    }
    setTemFoto(false);
    setPreview("");
    setErros((anteriores) => {
      const restantes = { ...anteriores };
      delete restantes.foto_perfil;
      delete restantes.aceite_imagem;
      return restantes;
    });
  }

  return (
    <main className="min-h-screen bg-fundo px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <Image
            src="/logo-pmidf.webp"
            alt="PMI Distrito Federal"
            width={193}
            height={75}
            priority
            className="h-12 w-auto"
          />
          <Link href="/voluntarios" className="font-semibold text-pmi-roxo hover:text-site-roxo">
            <span aria-hidden="true">← </span>Voltar para a galeria
          </Link>
        </div>
        <h1 className="font-titulo text-3xl font-bold text-site-roxo sm:text-4xl">
          Envie seu perfil para a Vitrine de Talentos
        </h1>

        {enviado ? (
          <section className="mt-6 rounded-xl border border-gray-200 bg-white p-5 sm:p-8">
            <h2 ref={retornoRef} tabIndex={-1} className="mb-2 text-xl font-semibold">
              Perfil enviado
            </h2>
            <p>Seu perfil será validado pela equipe e só aparecerá na Vitrine após a aprovação.</p>
            <Link
              href="/voluntarios"
              className="mt-6 inline-flex rounded-lg bg-site-roxo px-5 py-3 font-semibold text-white hover:bg-pmi-roxo"
            >
              Voltar para a galeria
            </Link>
          </section>
        ) : (
          <form ref={formularioRef} method="post" onSubmit={enviarFormulario} noValidate
            className="mt-6 rounded-xl border border-gray-200 bg-white p-5 sm:p-8">
            <fieldset disabled={enviando} className="min-w-0 space-y-5">
              {campos.map(({ id, rotulo, limite, autoComplete, opcional }) => (
                <div key={id}>
                  <label htmlFor={id} className="mb-1 block font-semibold">{rotulo}</label>
                  <input
                    id={id}
                    name={id}
                    type={opcional ? "url" : "text"}
                    autoComplete={autoComplete}
                    maxLength={limite}
                    required={!opcional}
                    className={estiloCampo}
                    {...acessibilidade(id)}
                  />
                  <ErroCampo campo={id} erros={erros} />
                </div>
              ))}

              <div>
                <label htmlFor="foto_perfil" className="mb-1 block font-semibold">
                  Foto de perfil (opcional)
                </label>
                <input
                  id="foto_perfil"
                  name="foto_perfil"
                  type="file"
                  accept={TIPOS_ACEITOS.join(",")}
                  className={estiloCampo}
                  {...acessibilidade("foto_perfil", "foto-ajuda")}
                  onChange={(evento) => {
                    const arquivo = evento.currentTarget.files?.[0];
                    setTemFoto(Boolean(arquivo));
                    setPreview(arquivo?.type.startsWith("image/") ? URL.createObjectURL(arquivo) : "");
                  }}
                />
                <p id="foto-ajuda" className="mt-1 text-sm text-gray-700">
                  Escolha uma foto em JPEG, PNG ou WebP, de até 5 MB. O centro da foto será recortado em quadrado.
                </p>
                <ErroCampo campo="foto_perfil" erros={erros} />
                {preview && (
                  // A URL local só existe no navegador.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={preview} alt="Prévia do recorte quadrado"
                    className="mt-3 aspect-square w-28 rounded-lg object-cover" />
                )}
                {temFoto && (
                  <button type="button" onClick={removerFoto} className="mt-2 text-sm font-semibold underline">
                    Remover foto
                  </button>
                )}
              </div>

              <fieldset className="space-y-3">
                <legend className="mb-2 font-semibold">Consentimentos</legend>
                <div>
                  <label className="flex items-start gap-3">
                    <input
                      id="aceite_lgpd"
                      name="aceite_lgpd"
                      type="checkbox"
                      required
                      className="mt-1.5 size-4 shrink-0 accent-pmi-roxo"
                      {...acessibilidade("aceite_lgpd")}
                    />
                    <span>Aceito o tratamento dos meus dados pessoais para análise e publicação do meu perfil na Vitrine de Talentos (obrigatório).</span>
                  </label>
                  <ErroCampo campo="aceite_lgpd" erros={erros} />
                </div>
                <div>
                  <label className="flex items-start gap-3">
                    <input
                      id="aceite_imagem"
                      name="aceite_imagem"
                      type="checkbox"
                      required={temFoto}
                      className="mt-1.5 size-4 shrink-0 accent-pmi-roxo"
                      {...acessibilidade("aceite_imagem")}
                    />
                    <span>Autorizo a publicação da minha foto na Vitrine de Talentos (obrigatório se enviar foto).</span>
                  </label>
                  <ErroCampo campo="aceite_imagem" erros={erros} />
                </div>
              </fieldset>

              <div hidden aria-hidden="true">
                <input name="site_empresa" type="text" tabIndex={-1} autoComplete="off" />
              </div>

              <button type="submit" className={estiloBotao}>
                {enviando ? "Enviando perfil…" : "Enviar perfil"}
              </button>
            </fieldset>
            {mensagem && <p className="mt-3 text-sm text-site-laranja" role="alert">{mensagem}</p>}
          </form>
        )}
      </div>
    </main>
  );
}
