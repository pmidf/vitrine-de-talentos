from fastapi import APIRouter, HTTPException, status
from .schemas import PerfilCreate, PerfilPublico, PerfilCriadoResponse
from .repository import criar_perfil, buscar_perfis_publicos



# Criação do router com um prefixo padrão
router = APIRouter(prefix="/perfis", tags=["Perfis"])

@router.post("/", response_model=PerfilCriadoResponse, status_code=status.HTTP_201_CREATED)
def criar_novo_perfil(perfil: PerfilCreate):
    """
    Recebe os dados do front-end, valida através do Pydantic (PerfilCreate) e guarda no Supabase.
    """
    try:
        return criar_perfil(perfil)
    except ValueError as e:
        # Repassa a mensagem segura que definimos no repositório
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail="Erro interno ao processar a requisição."
        )

@router.get("/publicos", response_model=list[PerfilPublico])
def listar_perfis_publicos():
    """
    Devolve apenas os perfis aprovados para a galeria.
    O 'response_model=list[PerfilPublico]' garante o Caso 8: apenas os 5 campos públicos são devolvidos.
    """
    try:
        return buscar_perfis_publicos()
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail="Erro interno ao carregar a galeria."
        )