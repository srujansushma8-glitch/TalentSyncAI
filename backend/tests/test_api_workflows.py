import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def test_api_root():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["app"] == "TalentSync AI"
    assert data["status"] == "online"


def test_auth_login():
    # Login as PM demo user
    response = client.post(
        "/api/auth/login",
        json={"email": "pm@talentsync.ai", "password": "ProjectManager@123"}
    )
    assert response.status_code == 200
    token_data = response.json()
    assert "access_token" in token_data
    assert token_data["role"] == "pm"
    token = token_data["access_token"]

    # Test protected route with Bearer token
    headers = {"Authorization": f"Bearer {token}"}
    me_resp = client.get("/api/auth/me", headers=headers)
    assert me_resp.status_code == 200
    assert me_resp.json()["email"] == "pm@talentsync.ai"


def test_dashboard_api_authenticated():
    # Login
    auth_resp = client.post(
        "/api/auth/login",
        json={"email": "admin@talentsync.ai", "password": "Admin@123"}
    )
    token = auth_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    dash_resp = client.get("/api/dashboard", headers=headers)
    assert dash_resp.status_code == 200
    data = dash_resp.json()
    assert data["kpis"]["total_employees"] >= 20
    assert data["kpis"]["active_projects"] >= 2
    assert len(data["utilization_distribution"]) > 0
    assert len(data["department_capacities"]) > 0


def test_matching_endpoint():
    auth_resp = client.post(
        "/api/auth/login",
        json={"email": "pm@talentsync.ai", "password": "ProjectManager@123"}
    )
    token = auth_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Fetch projects
    proj_resp = client.get("/api/projects", headers=headers)
    assert proj_resp.status_code == 200
    projects = proj_resp.json()
    assert len(projects) > 0
    first_proj_id = projects[0]["id"]

    # Match candidates for this project
    match_resp = client.get(f"/api/matching/{first_proj_id}", headers=headers)
    assert match_resp.status_code == 200
    match_data = match_resp.json()
    assert match_data["project_id"] == first_proj_id
    assert match_data["weights_used"]["skill_weight"] == 0.40
    assert match_data["weights_used"]["experience_weight"] == 0.20
    assert match_data["weights_used"]["availability_weight"] == 0.25
    assert match_data["weights_used"]["proficiency_weight"] == 0.15
    assert len(match_data["candidates"]) >= 20
