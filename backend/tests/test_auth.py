import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["app"] == "CRICKETVERSE AI"
    assert data["status"] == "online"

def test_health_endpoint():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["modules_active"] == 10

def test_modules_list():
    response = client.get("/api/v1/modules")
    assert response.status_code == 200
    data = response.json()
    assert len(data["modules"]) == 10

def test_quick_demo_login():
    response = client.post("/api/v1/auth/quick-login/coach")
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["role"] == "coach"
    assert data["user"]["username"] == "coach_virat"

def test_register_and_login():
    reg_payload = {
        "email": "testplayer@cricketverse.ai",
        "username": "test_cricketer",
        "password": "strongPassword123!",
        "role": "player",
        "full_name": "Test Cricketer"
    }
    # Check if already exists or register
    reg_res = client.post("/api/v1/auth/register", json=reg_payload)
    if reg_res.status_code != 400:
        assert reg_res.status_code == 200
        assert "access_token" in reg_res.json()

    # Login
    login_res = client.post("/api/v1/auth/login", json={
        "username_or_email": "test_cricketer",
        "password": "strongPassword123!"
    })
    assert login_res.status_code == 200
    assert "access_token" in login_res.json()
