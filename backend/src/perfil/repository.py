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
    """
    # Mapeamento: Dicionário de dados -> Colunas atuais do banco (migration 003)
    db_row = input_data.model_dump()
    try:
        response = supabase.table("tb_perfil").insert(db_row).execute()
        
        # Pega o primeiro (e único) registro inserido
        data = response.data[0]
        
        return PerfilCriadoResponse(
            id=str(data["id"]),
            status=data["status"],
            criado_em=data["criado_em"]
        )
    except Exception as e:
# LOG DETALHADO: Pega o erro real do Supabase (ex: constraint violation), 
        # mas NUNCA concatena o 'db_row' ou 'input_data' aqui.
        logger.error(f"[criar_perfil] Falha na inserção do banco. Detalhe técnico: {str(e)}")
        
        # RETORNO SEGURO: Genérico e amigável para o front-end exibir.
        raise ValueError("Ocorreu um problema ao registrar seu perfil. Por favor, tente novamente mais tarde.")
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
        
perfis = [PerfilPublico(**row) for row in response.data]
        return perfis
    except Exception as e:
        logger.error("[buscar_perfis_publicos] Erro ao buscar dados da galeria.", exc_info=False)
        raise ValueError("Não foi possível carregar os voluntários.")