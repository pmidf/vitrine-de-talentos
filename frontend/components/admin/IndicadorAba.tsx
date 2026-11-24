"use client";

import { useLinkStatus } from "next/link";

/**
 * Bolinha que aparece na aba clicada enquanto a outra aba carrega (SCRUM-147).
 * Precisa ficar dentro de um <Link>: é dele que vem o estado "pendente".
 * Fica sempre na tela, só muda a opacidade, para o texto da aba não pular.
 */
export default function IndicadorAba() {
  const { pending } = useLinkStatus();
  return (
    <span aria-hidden="true" className={`admin-aba-indicador${pending ? " is-pendente" : ""}`} />
  );
}
