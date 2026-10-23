import json
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import FieldFormation, User
from ..schemas import FieldFormationResponse, FieldFormationCreate
from ..auth_utils import get_current_user

router = APIRouter(prefix="/field-formations", tags=["FieldIQ Formations"])

# Default coordinates on field oval (center at 0, 0, 0; boundary radius ~65m, pitch length ~20m)
# Positions format: { id, name, role, x, z, label, distance_m, sector }
PRESET_FORMATIONS = {
    "powerplay_attacking": [
        {"id": 1, "name": "Wicketkeeper", "role": "Keeper", "x": 0.0, "z": -12.0, "label": "Wicketkeeper", "sector": "Behind"},
        {"id": 2, "name": "Bowler", "role": "Bowler", "x": 0.0, "z": 12.0, "label": "Bowler", "sector": "Straight"},
        {"id": 3, "name": "1st Slip", "role": "Close Catcher", "x": 3.5, "z": -11.0, "label": "1st Slip", "sector": "Slips"},
        {"id": 4, "name": "2nd Slip", "role": "Close Catcher", "x": 5.5, "z": -10.0, "label": "2nd Slip", "sector": "Slips"},
        {"id": 5, "name": "Point", "role": "Ring Fielder", "x": 22.0, "z": 2.0, "label": "Point", "sector": "Off-side"},
        {"id": 6, "name": "Cover", "role": "Ring Fielder", "x": 20.0, "z": 14.0, "label": "Cover", "sector": "Off-side"},
        {"id": 7, "name": "Mid-Off", "role": "Ring Fielder", "x": 10.0, "z": 22.0, "label": "Mid-Off", "sector": "Straight"},
        {"id": 8, "name": "Mid-On", "role": "Ring Fielder", "x": -10.0, "z": 22.0, "label": "Mid-On", "sector": "Straight"},
        {"id": 9, "name": "Midwicket", "role": "Ring Fielder", "x": -22.0, "z": 12.0, "label": "Midwicket", "sector": "Leg-side"},
        {"id": 10, "name": "Deep Square Leg", "role": "Boundary Sweeper", "x": -48.0, "z": -12.0, "label": "Deep Square Leg", "sector": "Deep Leg"},
        {"id": 11, "name": "Deep Third Man", "role": "Boundary Sweeper", "x": 42.0, "z": -35.0, "label": "Deep Third Man", "sector": "Deep Off"}
    ],
    "death_overs_yorker": [
        {"id": 1, "name": "Wicketkeeper", "role": "Keeper", "x": 0.0, "z": -14.0, "label": "Wicketkeeper", "sector": "Behind"},
        {"id": 2, "name": "Bowler", "role": "Bowler", "x": 0.0, "z": 12.0, "label": "Bowler", "sector": "Straight"},
        {"id": 3, "name": "Short Third Man", "role": "Ring Fielder", "x": 18.0, "z": -14.0, "label": "Short Third Man", "sector": "Off-side"},
        {"id": 4, "name": "Extra Cover", "role": "Ring Fielder", "x": 24.0, "z": 8.0, "label": "Extra Cover", "sector": "Off-side"},
        {"id": 5, "name": "Deep Point", "role": "Boundary Sweeper", "x": 48.0, "z": 4.0, "label": "Deep Point", "sector": "Deep Off"},
        {"id": 6, "name": "Deep Extra Cover", "role": "Boundary Sweeper", "x": 42.0, "z": 36.0, "label": "Deep Extra Cover", "sector": "Deep Off"},
        {"id": 7, "name": "Long Off", "role": "Boundary Sweeper", "x": 18.0, "z": 52.0, "label": "Long Off", "sector": "Straight"},
        {"id": 8, "name": "Long On", "role": "Boundary Sweeper", "x": -18.0, "z": 52.0, "label": "Long On", "sector": "Straight"},
        {"id": 9, "name": "Deep Midwicket", "role": "Boundary Sweeper", "x": -45.0, "z": 25.0, "label": "Deep Midwicket", "sector": "Deep Leg"},
        {"id": 10, "name": "Deep Square Leg", "role": "Boundary Sweeper", "x": -48.0, "z": -15.0, "label": "Deep Square Leg", "sector": "Deep Leg"},
        {"id": 11, "name": "Short Fine Leg", "role": "Ring Fielder", "x": -18.0, "z": -16.0, "label": "Short Fine Leg", "sector": "Leg-side"}
    ],
    "spin_web_trap": [
        {"id": 1, "name": "Wicketkeeper", "role": "Keeper", "x": 0.0, "z": -8.0, "label": "Wicketkeeper", "sector": "Behind"},
        {"id": 2, "name": "Bowler", "role": "Bowler", "x": 0.0, "z": 12.0, "label": "Bowler", "sector": "Straight"},
        {"id": 3, "name": "Slip", "role": "Close Catcher", "x": 3.0, "z": -7.5, "label": "Slip", "sector": "Slips"},
        {"id": 4, "name": "Silly Point", "role": "Close Catcher", "x": 8.0, "z": -2.0, "label": "Silly Point", "sector": "Close In"},
        {"id": 5, "name": "Short Leg", "role": "Close Catcher", "x": -8.0, "z": -2.0, "label": "Short Leg", "sector": "Close In"},
        {"id": 6, "name": "Cover", "role": "Ring Fielder", "x": 24.0, "z": 12.0, "label": "Cover", "sector": "Off-side"},
        {"id": 7, "name": "Mid-Off", "role": "Ring Fielder", "x": 12.0, "z": 24.0, "label": "Mid-Off", "sector": "Straight"},
        {"id": 8, "name": "Long On", "role": "Boundary Sweeper", "x": -15.0, "z": 54.0, "label": "Long On", "sector": "Straight"},
        {"id": 9, "name": "Deep Midwicket", "role": "Boundary Sweeper", "x": -44.0, "z": 28.0, "label": "Deep Midwicket", "sector": "Deep Leg"},
        {"id": 10, "name": "Deep Cover", "role": "Boundary Sweeper", "x": 48.0, "z": 22.0, "label": "Deep Cover", "sector": "Deep Off"},
        {"id": 11, "name": "Backward Square Leg", "role": "Ring Fielder", "x": -22.0, "z": -12.0, "label": "Backward Square Leg", "sector": "Leg-side"}
    ]
}

@router.get("", response_model=List[FieldFormationResponse])
def get_formations(db: Session = Depends(get_db)):
    formations = db.query(FieldFormation).all()
    if not formations:
        # Seed initial presets if empty
        presets = [
            ("Powerplay Attacking (2-Out)", "T20", "Fast", "Attacking", PRESET_FORMATIONS["powerplay_attacking"]),
            ("Death Overs Yorker Trap (5-Out)", "T20", "Fast", "Death Overs", PRESET_FORMATIONS["death_overs_yorker"]),
            ("Spin Web Ring & Trap", "T20", "Spin", "Spin Trap", PRESET_FORMATIONS["spin_web_trap"])
        ]
        for name, mtype, btype, intent, pos in presets:
            f = FieldFormation(
                name=name,
                match_type=mtype,
                bowling_type=btype,
                tactical_intent=intent,
                positions_json=json.dumps(pos),
                is_preset=True
            )
            db.add(f)
        db.commit()
        formations = db.query(FieldFormation).all()

    return [FieldFormationResponse.model_validate(f) for f in formations]

@router.get("/{formation_id}", response_model=FieldFormationResponse)
def get_formation(formation_id: int, db: Session = Depends(get_db)):
    formation = db.query(FieldFormation).filter(FieldFormation.id == formation_id).first()
    if not formation:
        raise HTTPException(status_code=404, detail="Formation not found")
    return FieldFormationResponse.model_validate(formation)

@router.post("/recommendation")
def get_tactical_recommendation(payload: Dict[str, Any]):
    phase = payload.get("phase", "Middle Overs")
    bowler_type = payload.get("bowler_type", "Fast")
    batter_tendency = payload.get("batter_tendency", "Off-side dominant")

    if phase == "Powerplay":
        positions = PRESET_FORMATIONS["powerplay_attacking"]
        logic = "Powerplay fielding restrictions: Max 2 fielders outside 30-yard circle. 2 Slips deployed for early swing edges."
    elif phase == "Death Overs":
        positions = PRESET_FORMATIONS["death_overs_yorker"]
        logic = "Death Overs plan: 5 fielders back on fence guarding V and arc. Deep point & wide yorker protection active."
    else:
        positions = PRESET_FORMATIONS["spin_web_trap"] if bowler_type == "Spin" else PRESET_FORMATIONS["powerplay_attacking"]
        logic = f"Middle overs squeeze: 4 boundary riders, ring fielders choking singles. Adjusted for {batter_tendency}."

    return {
        "recommended_formation": positions,
        "tactical_logic": logic,
        "risk_gaps": ["Fine leg single available on flick", "Straight lofted drive risky over mid-off"]
    }
