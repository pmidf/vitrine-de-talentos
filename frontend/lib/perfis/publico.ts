import { createClient } from "@/lib/supabase/server";
import type { Voluntario } from "@/types/voluntario";

export async function buscarPerfisPublicos(): Promise<Voluntario[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("tb_perfil")
    .select(`
      nome_perfil,
      curso_perfil,
      cargo_perfil,
      linkedin_perfil,
      foto_perfil
    `)
    .eq("status_perfil", "aprovado")
    .order("nome_perfil", { ascending: true });

  if (error) {
    console.error("Erro ao buscar perfis públicos:", error);
    throw new Error("Não foi possível carregar os voluntários.");
  }

  return data ?? [];
}