import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_pitch_analysis():
    # Login as coach
    login_res = client.post("/api/v1/auth/quick-login/coach")
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    res = client.post(
        "/api/v1/pitch/analyze",
        data={"venue": "Melbourne Cricket Ground"},
        headers=headers
    )
    assert res.status_code == 200
    data = res.json()
    assert "pitch_type" in data
    assert "moisture_level" in data
    assert "toss_recommendation" in data

def test_demo_video_job_creation_and_completion():
    login_res = client.post("/api/v1/auth/quick-login/coach")
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Test ShotSense demo job
    shot_res = client.post("/api/v1/video-jobs/demo/shotsense", headers=headers)
    assert shot_res.status_code == 200
    job = shot_res.json()
    assert job["module_type"] == "shotsense"
    assert job["status"] == "completed"
    assert job["progress"] == 100
    assert "result_json" in job

    # Test BallTrack demo job
    ball_res = client.post("/api/v1/video-jobs/demo/balltrack", headers=headers)
    assert ball_res.status_code == 200
    ball_job = ball_res.json()
    assert ball_job["module_type"] == "balltrack"
    assert ball_job["status"] == "completed"

def test_field_formations():
    res = client.get("/api/v1/field-formations")
    assert res.status_code == 200
    formations = res.json()
    assert len(formations) >= 3
    names = [f["name"] for f in formations]
    assert any("Powerplay" in n for n in names)
