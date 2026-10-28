# backend/src/perfil/schemas.py
from typing import Optional
from urllib.parse import urlparse
from pydantic import BaseModel, ConfigDict, Field, field_validator

class PerfilCreate(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    nome_perfil: str = Field(..., min_length=2, max_length=150)
    curso_perfil: str = Field(..., min_length=2, max_length=100)
    cargo_perfil: str = Field(..., min_length=2, max_length=100)
    linkedin_perfil: Optional[str] = Field(None, max_length=255)
    foto_perfil: Optional[str] = None

    @field_validator("linkedin_perfil")
    @classmethod
    def validar_linkedin(cls, v: Optional[str]) -> Optional[str]:
        if not v:
            return v
        parsed = urlparse(v)
        if parsed.scheme != "https":
            raise ValueError("A URL do LinkedIn deve usar HTTPS.")
        hostname = parsed.hostname or ""
        if not (hostname == "linkedin.com" or hostname.endswith(".linkedin.com")):
            raise ValueError("A URL deve ser do domínio linkedin.com.")
        return v

class PerfilPublico(BaseModel):
    """
    Atende ao Caso 8: Schema de saída para a galeria pública.
    Limita aos 5 campos públicos permitidos.
    """
    nome_perfil: str
    curso_perfil: str
    cargo_perfil: str
    linkedin_perfil: Optional[str]
    foto_perfil: Optional[str]

class PerfilCriadoResponse(BaseModel):
    """Schema de resposta após a criação bem-sucedida do perfil."""
    id: str
    status: str
    criado_em: str