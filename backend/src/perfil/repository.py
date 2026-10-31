import os
import logging
from supabase import create_client, Client
from .schemas import PerfilCreate, PerfilPublico, PerfilCriadoResponse

logger = logging.getLogger(__name__)

SUPABASE_URL = os.environ.get("SUPABASE_url", "")
SUPABASE_KEY = os.environ.get("SUPABASE_serviceRoleKey", "")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def criar_perfil(input_data: PerfilCreate) -> PerfilCriadoResponse:
    # model_dump() converte os dados validados direto num dicionário.
    # Como removemos o 'email' do schemas.py, ele não será enviado ao banco.
    db_row = input_data.model_dump()

    try:
        # A tabela correta é tb_perfil
        response = supabase.table("tb_perfil").insert(db_row).execute()
        data = response.data[0]
        
        return PerfilCriadoResponse(
            id=str(data["id_perfil"]),
            status=data["status_perfil"],
            criado_em=data["data_criacao_perfil"]
        )
    except Exception as e:
        logger.error(f"[criar_perfil] Falha na inserção. Tipo: {type(e).__name__}")
        raise ValueError("Ocorreu um problema ao registrar seu perfil. Por favor, tente novamente mais tarde.")

def buscar_perfis_publicos() -> list[PerfilPublico]:
    try:
        # Busca estritamente as colunas públicas com os nomes atuais do banco
        response = supabase.table("tb_perfil").select(
            "nome_perfil, curso_perfil, cargo_perfil, linkedin_perfil, foto_perfil"
        ).eq("status_perfil", "aprovado").execute()
        
        perfis = [PerfilPublico(**row) for row in response.data]
        return perfis
    except Exception as e:
        logger.error(f"[buscar_perfis_publicos] Falha na busca. Tipo: {type(e).__name__}")
        raise ValueError("Não foi possível carregar os voluntários.")