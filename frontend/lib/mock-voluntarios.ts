import type { Voluntario } from "@/types/voluntarios";

const voluntariosFicticios: Voluntario[] = [
  {
    id_perfil: "1",
    nome_perfil: "Ana Silva",
    curso_perfil: "Engenharia de Software",
    cargo_perfil: "Diretora de Projetos",
    linkedin_perfil: null,
    foto_perfil: null,
  },
  {
    id_perfil: "2",
    nome_perfil: "Lucas Santos",
    curso_perfil: "Ciência da Computação",
    cargo_perfil: "Coordenador de Tecnologia",
    linkedin_perfil: null,
    foto_perfil: null,
  },
  {
    id_perfil: "3",
    nome_perfil: "Mariana Costa",
    curso_perfil: "Sistemas de Informação",
    cargo_perfil: "Coordenadora de Comunicação",
    linkedin_perfil: null,
    foto_perfil: null,
  },
  {
    id_perfil: "4",
    nome_perfil: "Pedro Oliveira",
    curso_perfil: "Engenharia de Software",
    cargo_perfil: "Desenvolvedor",
    linkedin_perfil: null,
    foto_perfil: null,
  },
  {
    id_perfil: "5",
    nome_perfil: "Julia Martins",
    curso_perfil: "Administração",
    cargo_perfil: "Coordenadora de Eventos",
    linkedin_perfil: null,
    foto_perfil: null,
  },
  {
    id_perfil: "6",
    nome_perfil: "Gabriel Almeida",
    curso_perfil: "Análise e Desenvolvimento de Sistemas",
    cargo_perfil: "Desenvolvedor",
    linkedin_perfil: null,
    foto_perfil: null,
  },
  {
    id_perfil: "7",
    nome_perfil: "Beatriz Ferreira",
    curso_perfil: "Design",
    cargo_perfil: "Designer",
    linkedin_perfil: null,
    foto_perfil: null,
  },
  {
    id_perfil: "8",
    nome_perfil: "Rafael Souza",
    curso_perfil: "Engenharia de Software",
    cargo_perfil: "Coordenador de Marketing",
    linkedin_perfil: null,
    foto_perfil: null,
  },
  {
    id_perfil: "9",
    nome_perfil: "Camila Rodrigues",
    curso_perfil: "Ciência da Computação",
    cargo_perfil: "Analista de Projetos",
    linkedin_perfil: null,
    foto_perfil: null,
  },
  {
    id_perfil: "10",
    nome_perfil: "Felipe Lima",
    curso_perfil: "Sistemas de Informação",
    cargo_perfil: "Voluntário",
    linkedin_perfil: null,
    foto_perfil: null,
  },
];

export async function buscarVoluntarios(): Promise<Voluntario[]> {
  return voluntariosFicticios;
}