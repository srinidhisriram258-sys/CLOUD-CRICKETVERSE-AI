import random
import datetime
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from ..database import get_db
from ..models import Match, Innings, BallEvent, Partnership, Team, Player, User
from ..schemas import MatchResponse, InningsResponse, BallEventResponse

router = APIRouter(prefix="/matches", tags=["Matches & Live Intelligence"])

def compute_win_probability(current_runs: int, target_runs: int, balls_left: int, wickets_left: int) -> float:
    """Computes chase win probability based on RRR, wickets in hand, and balls left."""
    if balls_left <= 0:
        return 100.0 if current_runs >= target_runs else 0.0
    if wickets_left <= 0:
        return 0.0
    if current_runs >= target_runs:
        return 100.0

    runs_needed = target_runs - current_runs
    required_rr = (runs_needed / balls_left) * 6.0
    
    # Base probability function
    # RRR of 8 with 8 wickets in hand = ~50%
    wkt_factor = wickets_left / 10.0
    rrr_penalty = max(-50.0, min(50.0, (9.0 - required_rr) * 8.0))
    wkt_bonus = (wkt_factor - 0.5) * 40.0
    prob = 50.0 + rrr_penalty + wkt_bonus
    return round(max(2.0, min(98.0, prob)), 1)

def compute_projected_scores(current_runs: int, overs_bowled: float, max_overs: int = 20) -> Dict[str, int]:
    """Projects final score across multiple scenarios."""
    if overs_bowled <= 0.1:
        return {"current_rate": 170, "conservative": 150, "aggressive": 195, "par_score": 175}

    crr = current_runs / overs_bowled
    overs_left = max(0.0, max_overs - overs_bowled)
    
    curr_proj = int(current_runs + crr * overs_left)
    conservative = int(current_runs + max(5.0, crr * 0.8) * overs_left)
    aggressive = int(current_runs + (crr * 1.25) * overs_left)
    par_score = 178

    return {
        "current_rate": curr_proj,
        "conservative": conservative,
        "aggressive": aggressive,
        "par_score": par_score
    }

@router.get("", response_model=List[MatchResponse])
def get_matches(
    status: Optional[str] = Query(None, description="Filter by status: live, completed, upcoming"),
    tournament: Optional[str] = Query(None),
    limit: int = 20,
    db: Session = Depends(get_db)
):
    q = db.query(Match)
    if status and status != "all":
        q = q.filter(Match.status == status)
    if tournament and tournament != "all":
        q = q.filter(Match.tournament == tournament)
    matches = q.order_by(desc(Match.date)).limit(limit).all()
    return [MatchResponse.model_validate(m) for m in matches]

@router.get("/{match_id}")
def get_match_details(match_id: int, db: Session = Depends(get_db)):
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")

    innings_list = db.query(Innings).filter(Innings.match_id == match_id).order_by(Innings.innings_number.asc()).all()
    innings_details = []

    for inn in innings_list:
        balls = db.query(BallEvent).filter(BallEvent.innings_id == inn.id).order_by(BallEvent.over.asc(), BallEvent.ball.asc()).all()
        partnerships = db.query(Partnership).filter(Partnership.innings_id == inn.id).all()
        
        # Over-by-over progression
        overs_map: Dict[int, Dict[str, Any]] = {}
        cumulative_runs = 0
        cumulative_wickets = 0

        for b in balls:
            ov = b.over
            if ov not in overs_map:
                overs_map[ov] = {"over": ov, "runs": 0, "wickets": 0, "balls": []}
            runs = b.runs_scored + b.extras
            overs_map[ov]["runs"] += runs
            cumulative_runs += runs
            if b.is_wicket:
                overs_map[ov]["wickets"] += 1
                cumulative_wickets += 1
            overs_map[ov]["balls"].append({
                "ball": b.ball,
                "runs": b.runs_scored,
                "is_wicket": b.is_wicket,
                "commentary": b.commentary
            })

        over_progression = []
        c_runs = 0
        c_wkts = 0
        for ov_num in sorted(overs_map.keys()):
            ov_data = overs_map[ov_num]
            c_runs += ov_data["runs"]
            c_wkts += ov_data["wickets"]
            over_progression.append({
                "over": ov_num + 1,
                "over_runs": ov_data["runs"],
                "wickets": ov_data["wickets"],
                "cumulative_runs": c_runs,
                "cumulative_wickets": c_wkts,
                "run_rate": round(c_runs / (ov_num + 1), 2)
            })

        innings_details.append({
            "id": inn.id,
            "innings_number": inn.innings_number,
            "batting_team": {"id": inn.batting_team.id, "name": inn.batting_team.name, "short_name": inn.batting_team.short_name},
            "bowling_team": {"id": inn.bowling_team.id, "name": inn.bowling_team.name, "short_name": inn.bowling_team.short_name},
            "total_runs": inn.total_runs,
            "total_wickets": inn.total_wickets,
            "total_overs": inn.total_overs,
            "is_completed": inn.is_completed,
            "over_progression": over_progression,
            "partnerships": [
                {
                    "batter1": p.batter1.name,
                    "batter2": p.batter2.name,
                    "runs": p.runs,
                    "balls": p.balls
                } for p in partnerships
            ]
        })

    # Calculations for Win Probability & Projected Score
    win_prob_team1 = 50.0
    win_prob_team2 = 50.0
    projected = compute_projected_scores(0, 0.0)

    if len(innings_details) >= 1:
        current_inn = innings_details[-1]
        c_runs = current_inn["total_runs"]
        c_overs = current_inn["total_overs"]
        c_wkts = current_inn["total_wickets"]
        projected = compute_projected_scores(c_runs, c_overs)

        if len(innings_details) == 2:
            target = innings_details[0]["total_runs"] + 1
            balls_left = max(0, int((20.0 - c_overs) * 6))
            wkts_left = 10 - c_wkts
            win_prob_batting = compute_win_probability(c_runs, target, balls_left, wkts_left)
            win_prob_team1 = win_prob_batting if current_inn["batting_team"]["id"] == match.team1_id else round(100.0 - win_prob_batting, 1)
            win_prob_team2 = round(100.0 - win_prob_team1, 1)
        else:
            win_prob_team1 = round(min(85.0, max(15.0, 50.0 + (c_runs - 8.0 * c_overs) * 2.0 - c_wkts * 4.0)), 1)
            win_prob_team2 = round(100.0 - win_prob_team1, 1)

    # AI Match Insights
    tactical_insights = [
        f"Pitch wear at {match.venue} is accelerating spin turn by 1.8° in the 2nd innings.",
        f"Run rate required is {match.required_rr:.2f} rpo. Exploiting the short boundary at deep square leg is vital.",
        f"Death overs pace variations will be decisive: off-cutters and wide yorkers show a 42% dot ball rate."
    ]

    return {
        "match": MatchResponse.model_validate(match),
        "innings": innings_details,
        "win_probability": {
            match.team1.short_name: win_prob_team1,
            match.team2.short_name: win_prob_team2
        },
        "projected_score": projected,
        "tactical_insights": tactical_insights
    }

@router.post("/live/simulate-ball/{match_id}")
def simulate_live_ball(match_id: int, db: Session = Depends(get_db)):
    """Simulates real-time live ball delivery for the Live Match Center (Module 8)."""
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")

    innings = db.query(Innings).filter(Innings.match_id == match_id).order_by(Innings.innings_number.desc()).first()
    if not innings:
        raise HTTPException(status_code=400, detail="No active innings found for match")

    # Generate next delivery
    current_ball = match.current_ball + 1
    current_over = int(match.current_over)
    if current_ball > 6:
        current_ball = 1
        current_over += 1

    # Ball outcomes with realistic cricket distribution
    possible_outcomes = [0, 0, 1, 1, 1, 2, 4, 6, "W"]
    outcome = random.choice(possible_outcomes)

    is_wicket = outcome == "W"
    runs_scored = 0 if is_wicket else outcome
    
    shot_zones = ["Cover", "Point", "Midwicket", "Long On", "Long Off", "Fine Leg", "Third Man", "Extra Cover"]
    chosen_zone = random.choice(shot_zones)
    speed = round(random.uniform(132.0, 148.5), 1)

    commentary_templates = {
        0: f"{speed} kph delivery, solidly defended back towards mid-on.",
        1: f"Tucked away deftly towards {chosen_zone} for a quick single.",
        2: f"Driven through the gap at {chosen_zone}, good running between the wickets for a brace.",
        4: f"CRACK! Brilliant timing through {chosen_zone}, ball races away to the fence for FOUR!",
        6: f"MASSIVE! Clears the front foot and dispatches it 94 meters over {chosen_zone} for SIX!",
        "W": f"OUT! High drama! Edged and taken! Crucial breakthrough as the batter departs."
    }
    commentary = commentary_templates[outcome]

    # Find sample batter and bowler from team squads
    batter = db.query(Player).first()
    bowler = db.query(Player).offset(1).first()

    ball_event = BallEvent(
        innings_id=innings.id,
        over=current_over,
        ball=current_ball,
        batter_id=batter.id if batter else 1,
        bowler_id=bowler.id if bowler else 2,
        runs_scored=runs_scored,
        extras=0,
        is_wicket=is_wicket,
        wicket_type="caught" if is_wicket else None,
        pitch_x=round(random.uniform(-0.8, 0.8), 2),
        pitch_y=round(random.uniform(2.5, 12.0), 2),
        shot_zone=chosen_zone,
        ball_speed_kph=speed,
        commentary=commentary
    )
    db.add(ball_event)

    # Update innings totals
    innings.total_runs += runs_scored
    if is_wicket:
        innings.total_wickets += 1
    total_legal_balls = current_over * 6 + current_ball
    innings.total_overs = round(current_over + (current_ball / 10.0), 1)

    match.current_over = innings.total_overs
    match.current_ball = current_ball
    match.current_rr = round((innings.total_runs / (total_legal_balls / 6.0)), 2) if total_legal_balls > 0 else 0.0

    db.commit()

    return {
        "match_id": match_id,
        "over": current_over,
        "ball": current_ball,
        "runs_scored": runs_scored,
        "is_wicket": is_wicket,
        "total_runs": innings.total_runs,
        "total_wickets": innings.total_wickets,
        "current_rr": match.current_rr,
        "ball_speed_kph": speed,
        "shot_zone": chosen_zone,
        "commentary": commentary
    }
