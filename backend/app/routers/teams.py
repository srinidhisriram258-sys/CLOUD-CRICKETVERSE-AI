import json
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Team, TeamSquad, Player, TeamLineup, User
from ..schemas import TeamResponse, TeamCreate, TeamLineupResponse, TeamLineupCreate, PlayerResponse
from ..auth_utils import get_current_user

router = APIRouter(prefix="/teams", tags=["Teams & Squads"])

def analyze_team_balance(players: List[Player]) -> Dict[str, Any]:
    """Analyzes a 11-player lineup for cricket balance, role distributions, and batting order."""
    batters = [p for p in players if p.role in ["Batter", "Wicketkeeper"]]
    all_rounders = [p for p in players if p.role == "All-Rounder"]
    keepers = [p for p in players if p.role == "Wicketkeeper"]
    pacers = [p for p in players if "fast" in p.bowling_style.lower() or "pace" in p.bowling_style.lower() or "medium" in p.bowling_style.lower()]
    spinners = [p for p in players if "spin" in p.bowling_style.lower() or "orthodox" in p.bowling_style.lower()]
    bowling_options = [p for p in players if p.role in ["Fast Bowler", "Spin Bowler", "All-Rounder"] or p.wickets > 10]

    validation_errors = []
    if len(players) != 11:
        validation_errors.append(f"Squad must have exactly 11 players (currently {len(players)})")
    if len(keepers) == 0:
        validation_errors.append("No designated Wicketkeeper found. Every Playing XI requires at least 1 wicketkeeper.")
    if len(bowling_options) < 5:
        validation_errors.append(f"Only {len(bowling_options)} bowling options found. A balanced team needs at least 5 bowling options.")

    # Scores (0-100)
    batting_depth = min(100.0, sum([p.batting_avg for p in players[:8]]) / 8.0 * 2.2)
    pace_rating = min(100.0, len(pacers) * 28.0)
    spin_rating = min(100.0, len(spinners) * 35.0)
    fielding_score = min(100.0, sum([p.catches for p in players]) / 11.0 * 4.0 + 50.0)
    overall_balance = round(
        (0.35 * batting_depth) + (0.25 * min(100.0, pace_rating + spin_rating * 0.5)) +
        (0.20 * (100.0 if len(bowling_options) >= 5 else 50.0)) +
        (0.20 * (100.0 if len(keepers) >= 1 else 0.0)),
        1
    )

    # Batting order heuristic:
    # 1-2: Top order anchors / high strike rate openers
    # 3-4: Best batting average anchors
    # 5-6: Dynamic power middle-order & all-rounders
    # 7: Finisher / bowling all-rounder
    # 8-11: Primary bowlers
    sorted_batters = sorted(players, key=lambda p: (p.role in ["Batter", "Wicketkeeper", "All-Rounder"], p.batting_avg), reverse=True)
    suggested_order = [p.id for p in sorted_batters]

    explanation = (
        f"Team has {len(batters)} specialist batters, {len(all_rounders)} all-rounders, "
        f"{len(keepers)} wicketkeeper, and {len(bowling_options)} total bowling options "
        f"({len(pacers)} pace, {len(spinners)} spin). "
        f"{'Lineup is well-balanced.' if not validation_errors else 'Violations detected: ' + '; '.join(validation_errors)}"
    )

    return {
        "is_valid": len(validation_errors) == 0,
        "validation_errors": validation_errors,
        "balance_score": overall_balance,
        "breakdown": {
            "batting_depth": round(batting_depth, 1),
            "pace_rating": round(pace_rating, 1),
            "spin_rating": round(spin_rating, 1),
            "fielding_score": round(fielding_score, 1),
            "bowling_options_count": len(bowling_options),
            "wicketkeepers_count": len(keepers)
        },
        "suggested_batting_order": suggested_order,
        "explanation": explanation
    }

@router.get("", response_model=List[TeamResponse])
def get_teams(db: Session = Depends(get_db)):
    teams = db.query(Team).all()
    return [TeamResponse.model_validate(t) for t in teams]

@router.get("/{team_id}/squad")
def get_team_squad(team_id: int, db: Session = Depends(get_db)):
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    squad_entries = db.query(TeamSquad).filter(TeamSquad.team_id == team_id).all()
    players_data = []
    for entry in squad_entries:
        p = entry.player
        players_data.append({
            "id": p.id,
            "name": p.name,
            "country": p.country,
            "role": p.role,
            "batting_style": p.batting_style,
            "bowling_style": p.bowling_style,
            "runs": p.runs,
            "batting_avg": p.batting_avg,
            "strike_rate": p.strike_rate,
            "wickets": p.wickets,
            "bowling_avg": p.bowling_avg,
            "economy_rate": p.economy_rate,
            "scout_score": p.scout_score,
            "form_index": p.form_index,
            "is_captain": entry.is_captain,
            "is_vice_captain": entry.is_vice_captain,
            "is_wicketkeeper": entry.is_wicketkeeper,
            "squad_role": entry.squad_role
        })

    return {
        "team": TeamResponse.model_validate(team),
        "squad": players_data,
        "total_players": len(players_data)
    }

@router.post("/optimize-lineup")
def optimize_lineup(payload: Dict[str, Any], db: Session = Depends(get_db)):
    player_ids = payload.get("player_ids", [])
    if len(player_ids) != len(set(player_ids)):
        raise HTTPException(status_code=400, detail="Duplicate player selections detected. Each player can only be selected once.")

    players = db.query(Player).filter(Player.id.in_(player_ids)).all()
    analysis = analyze_team_balance(players)
    return {
        "analysis": analysis,
        "selected_players": [PlayerResponse.model_validate(p) for p in players]
    }

@router.post("/lineups", response_model=TeamLineupResponse)
def save_lineup(
    lineup_in: TeamLineupCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if len(lineup_in.playing_xi) != 11:
        raise HTTPException(status_code=400, detail="Playing XI must consist of exactly 11 players.")
    if len(lineup_in.playing_xi) != len(set(lineup_in.playing_xi)):
        raise HTTPException(status_code=400, detail="Duplicate players detected in Playing XI selection.")

    players = db.query(Player).filter(Player.id.in_(lineup_in.playing_xi)).all()
    analysis = analyze_team_balance(players)

    lineup = TeamLineup(
        user_id=current_user.id,
        team_id=lineup_in.team_id,
        name=lineup_in.name,
        playing_xi_json=json.dumps(lineup_in.playing_xi),
        batting_order_json=json.dumps(lineup_in.batting_order or analysis["suggested_batting_order"]),
        balance_score=analysis["balance_score"],
        explanation=analysis["explanation"]
    )
    db.add(lineup)
    db.commit()
    db.refresh(lineup)
    return TeamLineupResponse.model_validate(lineup)

@router.get("/lineups", response_model=List[TeamLineupResponse])
def get_user_lineups(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    lineups = db.query(TeamLineup).filter(TeamLineup.user_id == current_user.id).order_by(TeamLineup.created_at.desc()).all()
    return [TeamLineupResponse.model_validate(l) for l in lineups]
