from fastapi import FastAPI
from dotenv import load_dotenv

# Carrega as variáveis de ambiente do arquivo .env ANTES de ler o resto do código
load_dotenv()

# Só agora importamos o router, pois o repository.py precisa das variáveis carregadas
from src.perfil.router import router as perfil_router

app = FastAPI(title="Vitrine de Talentos - API")

# Regista as rotas do perfil na aplicação principal
app.include_router(perfil_router)