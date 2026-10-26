import os
import logging
from supabase import create_client, Client
from .schemas import PerfilCreate, PerfilPublico, PerfilCriadoResponse

# Configuração de log para registrar erros sem expor dados sensíveis
logger = logging.getLogger(__name__)

# Lê credenciais estritamente das variáveis de ambiente (SCRUM-47)
SUPABASE_URL = os.environ.get("SUPABASE_url", "")
SUPABASE_KEY = os.environ.get("SUPABASE_serviceRoleKey", "") # Key de admin para bypass no insert
VERSAO_TERMO = os.environ.get("VERSAO_TERMO_VIGENTE", "v1.0")

# Inicializa o cliente do Supabase
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def criar_perfil(input_data: PerfilCreate) -> PerfilCriadoResponse:
    """
    Salva um novo perfil (Caso 1 e 2).
    Força o status inicial e mapeia os nomes Pydantic para os nomes provisórios do banco.
    """
    # Mapeamento: Dicionário de dados -> Colunas atuais do banco (migration 003)
    db_row = {
        "nome": input_data.nome_perfil,
        "curso": input_data.curso_perfil,
        "cargo_student_club": input_data.cargo_perfil,
        "linkedin_url": input_data.linkedin_perfil,
        "foto_path": input_data.foto_perfil,
        "email": input_data.email,
        "versao_termo": VERSAO_TERMO,
        "status": "aguardando_validacao" # Será ajustado para 'pendente' pós-migration da Pietra
    }

    try:
        # A tabela temporariamente chama-se 'perfil' (futura 'tb_perfil')
        response = supabase.table("perfil").insert(db_row).execute()
        
        # Pega o primeiro (e único) registro inserido
        data = response.data[0]
        
        return PerfilCriadoResponse(
            id=str(data["id"]),
            status=data["status"],
            criado_em=data["criado_em"]
        )
    except Exception as e:
        # Logamos genericamente para evitar vazar PII (Nome, E-mail) no console
        logger.error("[criar_perfil] Erro ao salvar perfil no banco.", exc_info=False)
        raise ValueError("Não foi possível salvar o perfil. Tente novamente.")

def buscar_perfis_publicos() -> list[PerfilPublico]:
    """
    Busca os perfis para a galeria (Caso 8).
    Devolve só perfis aprovados e filtra para ter APENAS os 5 campos públicos.
    """
    try:
        # Busca na view existente que já filtra 'aprovados' (migration 003) 
        # ou na própria tabela filtrando o status. Usaremos a tabela com filtro por garantia.
        response = supabase.table("perfil").select(
            "nome, curso, cargo_student_club, linkedin_url, foto_path"
        ).eq("status", "aprovado").execute()
        
        perfis = []
        for row in response.data:
            perfis.append(
                PerfilPublico(
                    nome_perfil=row.get("nome"),
                    curso_perfil=row.get("curso"),
                    cargo_perfil=row.get("cargo_student_club"),
                    linkedin_perfil=row.get("linkedin_url"),
                    foto_perfil=row.get("foto_path")
                )
            )
        return perfis
    except Exception as e:
        logger.error("[buscar_perfis_publicos] Erro ao buscar dados da galeria.", exc_info=False)
        raise ValueError("Não foi possível carregar os voluntários.")