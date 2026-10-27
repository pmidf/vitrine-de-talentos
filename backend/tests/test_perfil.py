from fastapi.testclient import TestClient
from src.main import app

# Inicializa o cliente de testes do FastAPI
client = TestClient(app)

def test_salvar_perfil_valido():
    """Caso 1: Gravar um perfil com todos os campos válidos -> Gravado como pendente"""
    payload = {
        "nome_perfil": "Maria das Couves",
        "curso_perfil": "Engenharia de Software",
        "cargo_perfil": "Desenvolvedor Backend",
        "linkedin_perfil": "https://www.linkedin.com/in/teste",
        "foto_perfil": "https://example.com/foto_maria_couve.jpg"
    }
    
    response = client.post("/perfis/", json=payload)
    
    assert response.status_code == 201
    data = response.json()
    assert "id" in data
    assert data["status"] == "pendente"

def test_salvar_perfil_sem_campo_obrigatorio():
    """Caso 2: Gravar um perfil sem um campo obrigatório (ex: sem nome_perfil) -> Recusado"""
    payload = {
        "curso_perfil": "Engenharia de Software",
        "cargo_perfil": "Desenvolvedor Backend"
    }
    
    response = client.post("/perfis/", json=payload)
    
    # Pydantic deve barrar automaticamente com 422 Unprocessable Entity
    assert response.status_code == 422
    assert "nome_perfil" in response.text

def test_salvar_perfil_com_campo_fora_do_escopo():
    """Caso 5: Tentar gravar um dado fora do escopo (ex: CPF) -> Recusado"""
    payload = {
        "nome_perfil": "Invasor Teste",
        "curso_perfil": "Hacker",
        "cargo_perfil": "Tester",
        "cpf": "123.456.789-00" # Campo não permitido
    }
    
    response = client.post("/perfis/", json=payload)
    
    # O model_config com extra="forbid" deve barrar com 422
    assert response.status_code == 422

def test_busca_publica_somente_aprovados_e_5_campos():
    """Caso 8: Fazer a consulta pública -> Só perfis publicados e só os 5 campos públicos"""
    response = client.get("/perfis/publicos")
    
    assert response.status_code == 200
    perfis = response.json()
    
    assert isinstance(perfis, list)
    
    if len(perfis) > 0:
        perfil = perfis[0]
        # Garante que possui exatamente as chaves do schema público
        chaves_permitidas = {"nome_perfil", "curso_perfil", "cargo_perfil", "linkedin_perfil", "foto_perfil"}
        chaves_retornadas = set(perfil.keys())
        
        assert chaves_retornadas == chaves_permitidas
        # Garante que campos proibidos como status ou email não vazaram
        assert "status_perfil" not in chaves_retornadas
        assert "email" not in chaves_retornadas