from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient
from src.main import app

client = TestClient(app)

# ── Caso 1: perfil válido salvo como pendente ────────────────
def test_salvar_perfil_valido():
    mock_response = MagicMock()
    mock_response.data = [{
        "id_perfil": "uuid-ficticio-001",
        "status_perfil": "pendente",
        "data_criacao_perfil": "2026-10-31T00:00:00+00:00",
    }]

    with patch("src.perfil.repository.supabase") as mock_sb:
        mock_sb.table.return_value.insert.return_value.execute.return_value = mock_response
        response = client.post("/perfis/", json={
            "nome_perfil": "Maria das Couves",
            "curso_perfil": "Engenharia de Software",
            "cargo_perfil": "Desenvolvedor Backend",
            "linkedin_perfil": "https://www.linkedin.com/in/teste",
            "foto_perfil": "perfis/maria.webp",
        })

    assert response.status_code == 201
    data = response.json()
    assert "id" in data
    assert data["status"] == "pendente"


# ── Caso 2: campo obrigatório ausente ───────────────────────
def test_salvar_perfil_sem_campo_obrigatorio():
    response = client.post("/perfis/", json={
        "curso_perfil": "Engenharia de Software",
        "cargo_perfil": "Desenvolvedor Backend",
    })
    assert response.status_code == 422
    assert "nome_perfil" in response.text


# ── Caso 3: campo fora do escopo (CPF) ──────────────────────
def test_salvar_perfil_com_campo_fora_do_escopo():
    response = client.post("/perfis/", json={
        "nome_perfil": "Invasor Teste",
        "curso_perfil": "Hacker",
        "cargo_perfil": "Tester",
        "cpf": "123.456.789-00",
    })
    assert response.status_code == 422


# ── Caso 8: consulta pública retorna só aprovados e 5 campos ─
def test_busca_publica_somente_aprovados_e_5_campos():
    mock_response = MagicMock()
    mock_response.data = [{
        "nome_perfil": "Ana Silva",
        "curso_perfil": "Ciência da Computação",
        "cargo_perfil": "Desenvolvedora",
        "linkedin_perfil": "https://www.linkedin.com/in/ana",
        "foto_perfil": "perfis/ana.webp",
    }]

    with patch("src.perfil.repository.supabase") as mock_sb:
        (mock_sb.table.return_value
            .select.return_value
            .eq.return_value
            .execute.return_value) = mock_response
        response = client.get("/perfis/publicos")

    assert response.status_code == 200
    perfis = response.json()
    assert isinstance(perfis, list)
    assert len(perfis) > 0

    chaves_permitidas = {
        "nome_perfil", "curso_perfil", "cargo_perfil",
        "linkedin_perfil", "foto_perfil",
    }
    assert set(perfis[0].keys()) == chaves_permitidas
    assert "status_perfil" not in perfis[0]
    assert "email" not in perfis[0]