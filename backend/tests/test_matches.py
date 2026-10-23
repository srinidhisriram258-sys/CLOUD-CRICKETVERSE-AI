import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_get_matches():
    response = client.get("/api/v1/matches")
    assert response.status_code == 200
    matches = response.json()
    assert len(matches) >= 1

def test_match_scorecard_and_win_probability():
    matches_res = client.get("/api/v1/matches")
    match_id = matches_res.json()[0]["id"]

    detail_res = client.get(f"/api/v1/matches/{match_id}")
    assert detail_res.status_code == 200
    data = detail_res.json()
    assert "win_probability" in data
    assert "projected_score" in data
    assert "tactical_insights" in data
    assert "innings" in data

def test_simulate_live_ball():
    matches_res = client.get("/api/v1/matches?status=live")
    live_matches = matches_res.json()
    if live_matches:
        match_id = live_matches[0]["id"]
        sim_res = client.post(f"/api/v1/matches/live/simulate-ball/{match_id}")
        assert sim_res.status_code == 200
        sim_data = sim_res.json()
        assert "runs_scored" in sim_data
        assert "commentary" in sim_data
        assert "ball_speed_kph" in sim_data
