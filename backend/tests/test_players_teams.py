import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_get_players():
    response = client.get("/api/v1/players")
    assert response.status_code == 200
    players = response.json()
    assert len(players) > 0
    # Ensure Bumrah and Kohli exist in seeded database
    names = [p["name"] for p in players]
    assert "Virat Kohli" in names
    assert "Jasprit Bumrah" in names

def test_player_scouting_score_calculation():
    response = client.get("/api/v1/players?sort_by=scout_score&order=desc")
    assert response.status_code == 200
    players = response.json()
    assert players[0]["scout_score"] >= players[-1]["scout_score"]

def test_multi_player_comparison():
    # Compare first 3 players
    players_res = client.get("/api/v1/players?limit=3")
    players = players_res.json()
    ids = ",".join([str(p["id"]) for p in players])
    
    comp_res = client.get(f"/api/v1/players/comparison/multi?ids={ids}")
    assert comp_res.status_code == 200
    data = comp_res.json()
    assert len(data) == len(players)
    assert "radar" in data[0]
    assert "Power Hitting" in data[0]["radar"]

def test_team_lineup_validation_and_optimization():
    # Fetch squad
    teams_res = client.get("/api/v1/teams")
    assert teams_res.status_code == 200
    teams = teams_res.json()
    assert len(teams) >= 2
    
    team_id = teams[0]["id"]
    squad_res = client.get(f"/api/v1/teams/{team_id}/squad")
    assert squad_res.status_code == 200
    squad = squad_res.json()["squad"]

    # Select 11 players
    player_ids = [p["id"] for p in squad[:11]]
    opt_res = client.post("/api/v1/teams/optimize-lineup", json={"player_ids": player_ids})
    assert opt_res.status_code == 200
    opt_data = opt_res.json()
    assert "balance_score" in opt_data["analysis"]
    assert "suggested_batting_order" in opt_data["analysis"]
    assert len(opt_data["analysis"]["suggested_batting_order"]) == 11
