import csv
import io
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, asc
from ..database import get_db
from ..models import Player, User, ScoutingReport
from ..schemas import PlayerResponse, PlayerCreate, ScoutingReportResponse, ScoutingReportCreate
from ..auth_utils import get_current_user, require_role

router = APIRouter(prefix="/players", tags=["Players & Scouting"])

def calculate_scout_score(p: Player) -> float:
    """Transparent weighted Scout Score (0-100) based on role and performance."""
    if p.role in ["Batter", "Wicketkeeper"]:
        # Batting weighted: Avg (40%), Strike Rate (40%), Milestone/Volume (20%)
        avg_score = min(100.0, (p.batting_avg / 55.0) * 100.0)
        sr_score = min(100.0, (p.strike_rate / 160.0) * 100.0)
        vol_score = min(100.0, (p.runs / 4000.0) * 100.0)
        return round(0.40 * avg_score + 0.40 * sr_score + 0.20 * vol_score, 1)
    elif p.role in ["Fast Bowler", "Spin Bowler"]:
        # Bowling weighted: Bowling Avg inverse (35%), Economy inverse (35%), Wickets (30%)
        bowl_avg_score = min(100.0, max(0.0, (35.0 - p.bowling_avg) / 15.0 * 100.0))
        econ_score = min(100.0, max(0.0, (10.0 - p.economy_rate) / 4.0 * 100.0))
        wkt_score = min(100.0, (p.wickets / 150.0) * 100.0)
        return round(0.35 * bowl_avg_score + 0.35 * econ_score + 0.30 * wkt_score, 1)
    else:  # All-Rounder
        bat_component = min(100.0, ((p.batting_avg / 40.0) * 50.0 + (p.strike_rate / 140.0) * 50.0))
        bowl_component = min(100.0, max(0.0, (10.0 - p.economy_rate) / 4.0 * 50.0) + (p.wickets / 100.0) * 50.0)
        return round(0.50 * bat_component + 0.50 * bowl_component, 1)

@router.get("", response_model=List[PlayerResponse])
def get_players(
    query: Optional[str] = Query(None, description="Search by player name or country"),
    role: Optional[str] = Query(None, description="Filter by role"),
    country: Optional[str] = Query(None, description="Filter by country"),
    sort_by: str = Query("scout_score", description="Sort field: scout_score, runs, wickets, batting_avg, strike_rate"),
    order: str = Query("desc", description="Sort order: asc or desc"),
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    q = db.query(Player)
    if query:
        q = q.filter(or_(Player.name.ilike(f"%{query}%"), Player.country.ilike(f"%{query}%")))
    if role and role != "All":
        q = q.filter(Player.role == role)
    if country and country != "All":
        q = q.filter(Player.country == country)

    sort_col = getattr(Player, sort_by, Player.scout_score)
    if order == "desc":
        q = q.order_by(desc(sort_col))
    else:
        q = q.order_by(asc(sort_col))

    players = q.offset(skip).limit(limit).all()
    return [PlayerResponse.model_validate(p) for p in players]

@router.get("/{player_id}", response_model=PlayerResponse)
def get_player(player_id: int, db: Session = Depends(get_db)):
    player = db.query(Player).filter(Player.id == player_id).first()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    return PlayerResponse.model_validate(player)

@router.post("", response_model=PlayerResponse)
def create_player(
    player_in: PlayerCreate,
    current_user: User = Depends(require_role(["admin", "coach"])),
    db: Session = Depends(get_db)
):
    player = Player(**player_in.model_dump())
    player.scout_score = calculate_scout_score(player)
    db.add(player)
    db.commit()
    db.refresh(player)
    return PlayerResponse.model_validate(player)

@router.put("/{player_id}", response_model=PlayerResponse)
def update_player(
    player_id: int,
    player_in: PlayerCreate,
    current_user: User = Depends(require_role(["admin", "coach"])),
    db: Session = Depends(get_db)
):
    player = db.query(Player).filter(Player.id == player_id).first()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")

    for field, val in player_in.model_dump().items():
        setattr(player, field, val)

    player.scout_score = calculate_scout_score(player)
    db.commit()
    db.refresh(player)
    return PlayerResponse.model_validate(player)

@router.delete("/{player_id}")
def delete_player(
    player_id: int,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    player = db.query(Player).filter(Player.id == player_id).first()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    db.delete(player)
    db.commit()
    return {"message": f"Player {player.name} deleted successfully"}

@router.get("/comparison/multi")
def compare_players(ids: str = Query(..., description="Comma-separated player IDs, e.g. 1,2,3"), db: Session = Depends(get_db)):
    player_ids = [int(i.strip()) for i in ids.split(",") if i.strip().isdigit()]
    if not player_ids:
        raise HTTPException(status_code=400, detail="No valid player IDs provided")

    players = db.query(Player).filter(Player.id.in_(player_ids)).all()
    comparison_data = []
    for p in players:
        radar_metrics = {
            "Power Hitting": round(min(100.0, (p.strike_rate / 170.0) * 100), 1),
            "Consistency": round(min(100.0, (p.batting_avg / 55.0) * 100), 1),
            "Wicket Threat": round(min(100.0, (p.wickets / 120.0) * 100 if p.wickets > 0 else 10.0), 1),
            "Economy Control": round(min(100.0, max(0.0, (11.0 - p.economy_rate) / 4.5 * 100)), 1),
            "Pressure Handling": round(p.scout_score * 0.95, 1),
            "Fielding Index": round(min(100.0, (p.catches / 40.0) * 100), 1)
        }
        comparison_data.append({
            "player": PlayerResponse.model_validate(p),
            "radar": radar_metrics,
            "strengths": [
                f"Elite {p.role} with {p.matches} career appearances",
                f"High impact index: {p.scout_score}/100",
                f"Strike rate {p.strike_rate}" if p.strike_rate > 130 else f"Economy rate {p.economy_rate}"
            ]
        })
    return comparison_data

@router.get("/export/csv")
def export_players_csv(db: Session = Depends(get_db)):
    players = db.query(Player).order_by(desc(Player.scout_score)).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "ID", "Name", "Country", "Role", "Batting Style", "Bowling Style",
        "Matches", "Runs", "Batting Avg", "Strike Rate", "Wickets",
        "Bowling Avg", "Economy Rate", "Catches", "Stumpings", "Scout Score", "Form Index"
    ])
    for p in players:
        writer.writerow([
            p.id, p.name, p.country, p.role, p.batting_style, p.bowling_style,
            p.matches, p.runs, p.batting_avg, p.strike_rate, p.wickets,
            p.bowling_avg, p.economy_rate, p.catches, p.stumpings, p.scout_score, p.form_index
        ])
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=cricketverse_scout_players.csv"}
    )

@router.post("/import/csv")
def import_players_csv(
    file: UploadFile = File(...),
    current_user: User = Depends(require_role(["admin", "coach"])),
    db: Session = Depends(get_db)
):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")
    
    content = file.file.read().decode("utf-8")
    reader = csv.DictReader(io.StringIO(content))
    created_count = 0

    for row in reader:
        try:
            name = row.get("Name") or row.get("name")
            if not name:
                continue
            existing = db.query(Player).filter(Player.name == name).first()
            if existing:
                continue
            
            p = Player(
                name=name,
                country=row.get("Country", "India"),
                role=row.get("Role", "Batter"),
                batting_style=row.get("Batting Style", "Right-hand bat"),
                bowling_style=row.get("Bowling Style", "Right-arm fast"),
                matches=int(row.get("Matches", 0)),
                runs=int(row.get("Runs", 0)),
                batting_avg=float(row.get("Batting Avg", 0.0)),
                strike_rate=float(row.get("Strike Rate", 0.0)),
                wickets=int(row.get("Wickets", 0)),
                bowling_avg=float(row.get("Bowling Avg", 0.0)),
                economy_rate=float(row.get("Economy Rate", 0.0)),
                catches=int(row.get("Catches", 0)),
                stumpings=int(row.get("Stumpings", 0)),
                scout_score=float(row.get("Scout Score", 75.0)),
                form_index=float(row.get("Form Index", 80.0))
            )
            p.scout_score = calculate_scout_score(p)
            db.add(p)
            created_count += 1
        except Exception as e:
            continue

    db.commit()
    return {"message": f"Successfully imported {created_count} players from CSV"}
