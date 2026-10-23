import json
import datetime
from sqlalchemy.orm import Session
from .database import engine, SessionLocal, Base
from .models import (
    User, Player, Team, TeamSquad, Match, Innings, BallEvent,
    Partnership, FieldFormation, PitchAnalysis, ScoutingReport, Notification
)
from .auth_utils import hash_password
from .routers.field_formations import PRESET_FORMATIONS

def seed_database():
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    # Check if already seeded
    if db.query(Player).count() > 0:
        db.close()
        return

    print("Seeding CRICKETVERSE AI database with authentic cricket records...")

    # 1. Seed Users
    admin = User(
        email="admin@cricketverse.ai",
        username="admin_rahul",
        hashed_password=hash_password("cricketverse123"),
        role="admin",
        full_name="Rahul Dravid (Director)",
        avatar_url="https://api.dicebear.com/7.x/bottts/svg?seed=admin_rahul"
    )
    coach = User(
        email="coach@cricketverse.ai",
        username="coach_virat",
        hashed_password=hash_password("cricketverse123"),
        role="coach",
        full_name="Virat Kohli (Head Coach)",
        avatar_url="https://api.dicebear.com/7.x/bottts/svg?seed=coach_virat"
    )
    player_user = User(
        email="player@cricketverse.ai",
        username="player_shubman",
        hashed_password=hash_password("cricketverse123"),
        role="player",
        full_name="Shubman Gill (Player)",
        avatar_url="https://api.dicebear.com/7.x/bottts/svg?seed=player_shubman"
    )
    db.add_all([admin, coach, player_user])
    db.commit()

    # 2. Seed Players
    raw_players = [
        # India
        {"name": "Rohit Sharma", "country": "India", "role": "Batter", "batting_style": "Right-hand bat", "bowling_style": "Right-arm off spin", "matches": 151, "runs": 3974, "batting_avg": 31.3, "strike_rate": 140.9, "wickets": 1, "bowling_avg": 113.0, "economy_rate": 7.2, "catches": 62, "stumpings": 0, "scout_score": 91.5, "form_index": 88.0},
        {"name": "Virat Kohli", "country": "India", "role": "Batter", "batting_style": "Right-hand bat", "bowling_style": "Right-arm medium", "matches": 125, "runs": 4188, "batting_avg": 48.7, "strike_rate": 137.0, "wickets": 4, "bowling_avg": 51.0, "economy_rate": 8.1, "catches": 54, "stumpings": 0, "scout_score": 98.2, "form_index": 95.0},
        {"name": "Suryakumar Yadav", "country": "India", "role": "Batter", "batting_style": "Right-hand bat", "bowling_style": "Right-arm off spin", "matches": 71, "runs": 2432, "batting_avg": 42.7, "strike_rate": 169.4, "wickets": 0, "bowling_avg": 0.0, "economy_rate": 6.8, "catches": 43, "stumpings": 0, "scout_score": 96.8, "form_index": 92.5},
        {"name": "Rishabh Pant", "country": "India", "role": "Wicketkeeper", "batting_style": "Left-hand bat", "bowling_style": "Right-arm medium", "matches": 76, "runs": 1209, "batting_avg": 23.2, "strike_rate": 127.3, "wickets": 0, "bowling_avg": 0.0, "economy_rate": 0.0, "catches": 42, "stumpings": 11, "scout_score": 86.4, "form_index": 84.0},
        {"name": "Hardik Pandya", "country": "India", "role": "All-Rounder", "batting_style": "Right-hand bat", "bowling_style": "Right-arm fast-medium", "matches": 104, "runs": 1641, "batting_avg": 27.8, "strike_rate": 141.2, "wickets": 86, "bowling_avg": 25.6, "economy_rate": 8.1, "catches": 48, "stumpings": 0, "scout_score": 93.0, "form_index": 91.0},
        {"name": "Ravindra Jadeja", "country": "India", "role": "All-Rounder", "batting_style": "Left-hand bat", "bowling_style": "Slow left-arm orthodox", "matches": 74, "runs": 515, "batting_avg": 21.4, "strike_rate": 127.2, "wickets": 54, "bowling_avg": 29.8, "economy_rate": 7.1, "catches": 28, "stumpings": 0, "scout_score": 89.0, "form_index": 86.0},
        {"name": "Axar Patel", "country": "India", "role": "All-Rounder", "batting_style": "Left-hand bat", "bowling_style": "Slow left-arm orthodox", "matches": 62, "runs": 453, "batting_avg": 20.6, "strike_rate": 143.8, "wickets": 60, "bowling_avg": 23.4, "economy_rate": 7.3, "catches": 24, "stumpings": 0, "scout_score": 88.5, "form_index": 89.0},
        {"name": "Jasprit Bumrah", "country": "India", "role": "Fast Bowler", "batting_style": "Right-hand bat", "bowling_style": "Right-arm fast", "matches": 70, "runs": 8, "batting_avg": 4.0, "strike_rate": 61.5, "wickets": 89, "bowling_avg": 17.7, "economy_rate": 6.27, "catches": 12, "stumpings": 0, "scout_score": 99.4, "form_index": 98.0},
        {"name": "Arshdeep Singh", "country": "India", "role": "Fast Bowler", "batting_style": "Left-hand bat", "bowling_style": "Left-arm fast-medium", "matches": 56, "runs": 32, "batting_avg": 5.3, "strike_rate": 76.2, "wickets": 87, "bowling_avg": 18.4, "economy_rate": 8.3, "catches": 16, "stumpings": 0, "scout_score": 91.2, "form_index": 90.0},
        {"name": "Kuldeep Yadav", "country": "India", "role": "Spin Bowler", "batting_style": "Left-hand bat", "bowling_style": "Left-arm wrist spin", "matches": 40, "runs": 46, "batting_avg": 9.2, "strike_rate": 82.1, "wickets": 69, "bowling_avg": 14.1, "economy_rate": 6.7, "catches": 10, "stumpings": 0, "scout_score": 94.0, "form_index": 93.0},
        {"name": "Mohammed Siraj", "country": "India", "role": "Fast Bowler", "batting_style": "Right-hand bat", "bowling_style": "Right-arm fast", "matches": 16, "runs": 12, "batting_avg": 6.0, "strike_rate": 75.0, "wickets": 14, "bowling_avg": 33.2, "economy_rate": 7.9, "catches": 5, "stumpings": 0, "scout_score": 82.5, "form_index": 80.0},

        # Australia
        {"name": "Travis Head", "country": "Australia", "role": "Batter", "batting_style": "Left-hand bat", "bowling_style": "Right-arm off spin", "matches": 38, "runs": 1092, "batting_avg": 34.1, "strike_rate": 158.7, "wickets": 1, "bowling_avg": 54.0, "economy_rate": 8.5, "catches": 18, "stumpings": 0, "scout_score": 95.0, "form_index": 96.0},
        {"name": "David Warner", "country": "Australia", "role": "Batter", "batting_style": "Left-hand bat", "bowling_style": "Right-arm leg spin", "matches": 110, "runs": 3277, "batting_avg": 33.4, "strike_rate": 142.5, "wickets": 0, "bowling_avg": 0.0, "economy_rate": 0.0, "catches": 48, "stumpings": 0, "scout_score": 92.0, "form_index": 85.0},
        {"name": "Mitchell Marsh", "country": "Australia", "role": "All-Rounder", "batting_style": "Right-hand bat", "bowling_style": "Right-arm medium-fast", "matches": 63, "runs": 1530, "batting_avg": 32.5, "strike_rate": 135.2, "wickets": 17, "bowling_avg": 24.2, "economy_rate": 7.8, "catches": 26, "stumpings": 0, "scout_score": 88.0, "form_index": 87.0},
        {"name": "Glenn Maxwell", "country": "Australia", "role": "All-Rounder", "batting_style": "Right-hand bat", "bowling_style": "Right-arm off spin", "matches": 113, "runs": 2600, "batting_avg": 29.5, "strike_rate": 155.5, "wickets": 43, "bowling_avg": 26.8, "economy_rate": 7.5, "catches": 52, "stumpings": 0, "scout_score": 93.5, "form_index": 90.0},
        {"name": "Marcus Stoinis", "country": "Australia", "role": "All-Rounder", "batting_style": "Right-hand bat", "bowling_style": "Right-arm medium-fast", "matches": 68, "runs": 1124, "batting_avg": 31.2, "strike_rate": 146.5, "wickets": 45, "bowling_avg": 20.3, "economy_rate": 8.4, "catches": 29, "stumpings": 0, "scout_score": 89.2, "form_index": 88.0},
        {"name": "Tim David", "country": "Australia", "role": "Batter", "batting_style": "Right-hand bat", "bowling_style": "Right-arm off spin", "matches": 49, "runs": 1184, "batting_avg": 35.8, "strike_rate": 162.2, "wickets": 5, "bowling_avg": 28.0, "economy_rate": 9.1, "catches": 27, "stumpings": 0, "scout_score": 90.4, "form_index": 89.0},
        {"name": "Matthew Wade", "country": "Australia", "role": "Wicketkeeper", "batting_style": "Left-hand bat", "bowling_style": "Right-arm medium", "matches": 92, "runs": 1202, "batting_avg": 26.1, "strike_rate": 134.3, "wickets": 0, "bowling_avg": 0.0, "economy_rate": 0.0, "catches": 58, "stumpings": 8, "scout_score": 83.0, "form_index": 81.0},
        {"name": "Pat Cummins", "country": "Australia", "role": "Fast Bowler", "batting_style": "Right-hand bat", "bowling_style": "Right-arm fast", "matches": 57, "runs": 178, "batting_avg": 13.7, "strike_rate": 121.9, "wickets": 66, "bowling_avg": 24.5, "economy_rate": 7.4, "catches": 19, "stumpings": 0, "scout_score": 94.2, "form_index": 94.0},
        {"name": "Mitchell Starc", "country": "Australia", "role": "Fast Bowler", "batting_style": "Left-hand bat", "bowling_style": "Left-arm fast", "matches": 65, "runs": 94, "batting_avg": 9.4, "strike_rate": 95.0, "wickets": 79, "bowling_avg": 23.8, "economy_rate": 7.7, "catches": 15, "stumpings": 0, "scout_score": 92.8, "form_index": 89.0},
        {"name": "Josh Hazlewood", "country": "Australia", "role": "Fast Bowler", "batting_style": "Left-hand bat", "bowling_style": "Right-arm fast-medium", "matches": 51, "runs": 22, "batting_avg": 5.5, "strike_rate": 62.8, "wickets": 64, "bowling_avg": 21.1, "economy_rate": 7.3, "catches": 11, "stumpings": 0, "scout_score": 91.0, "form_index": 88.0},
        {"name": "Adam Zampa", "country": "Australia", "role": "Spin Bowler", "batting_style": "Right-hand bat", "bowling_style": "Right-arm leg spin", "matches": 92, "runs": 61, "batting_avg": 6.1, "strike_rate": 70.0, "wickets": 118, "bowling_avg": 21.6, "economy_rate": 7.2, "catches": 18, "stumpings": 0, "scout_score": 93.6, "form_index": 92.0}
    ]

    player_objects = []
    for rp in raw_players:
        p = Player(**rp)
        player_objects.append(p)
    db.add_all(player_objects)
    db.commit()

    # 3. Seed Teams
    india_team = Team(name="India National Team", short_name="IND", logo_url="https://flagcdn.com/w80/in.png", coach_name="Rahul Dravid")
    aus_team = Team(name="Australia National Team", short_name="AUS", logo_url="https://flagcdn.com/w80/au.png", coach_name="Andrew McDonald")
    eng_team = Team(name="England National Team", short_name="ENG", logo_url="https://flagcdn.com/w80/gb-eng.png", coach_name="Brendon McCullum")
    db.add_all([india_team, aus_team, eng_team])
    db.commit()

    # Link Squads
    ind_players = db.query(Player).filter(Player.country == "India").all()
    aus_players = db.query(Player).filter(Player.country == "Australia").all()

    for idx, p in enumerate(ind_players):
        db.add(TeamSquad(
            team_id=india_team.id,
            player_id=p.id,
            is_captain=(p.name == "Rohit Sharma"),
            is_vice_captain=(p.name == "Hardik Pandya"),
            is_wicketkeeper=(p.name == "Rishabh Pant"),
            squad_role=p.role
        ))

    for idx, p in enumerate(aus_players):
        db.add(TeamSquad(
            team_id=aus_team.id,
            player_id=p.id,
            is_captain=(p.name == "Mitchell Marsh"),
            is_vice_captain=(p.name == "Travis Head"),
            is_wicketkeeper=(p.name == "Matthew Wade"),
            squad_role=p.role
        ))
    db.commit()

    # 4. Seed Matches
    match1 = Match(
        title="T20 World Championship Final: India vs Australia",
        tournament="ICC T20 World Cup 2026",
        match_type="T20",
        venue="Melbourne Cricket Ground",
        status="live",
        team1_id=india_team.id,
        team2_id=aus_team.id,
        toss_winner="Australia",
        toss_decision="bowl",
        current_innings=2,
        current_over=16.4,
        current_ball=4,
        required_rr=9.6,
        current_rr=8.7,
        is_demo=True
    )

    match2 = Match(
        title="Semi-Final 1: India vs England",
        tournament="ICC T20 World Cup 2026",
        match_type="T20",
        venue="Sydney Cricket Ground",
        status="completed",
        team1_id=india_team.id,
        team2_id=eng_team.id,
        toss_winner="India",
        toss_decision="bat",
        winner_id=india_team.id,
        win_margin="India won by 24 runs",
        current_innings=2,
        current_over=20.0,
        current_ball=6,
        required_rr=0.0,
        current_rr=8.95,
        is_demo=True
    )
    db.add_all([match1, match2])
    db.commit()

    # Seed Innings for Match 1
    inn1 = Innings(
        match_id=match1.id,
        innings_number=1,
        batting_team_id=india_team.id,
        bowling_team_id=aus_team.id,
        total_runs=182,
        total_wickets=5,
        total_overs=20.0,
        is_completed=True
    )
    inn2 = Innings(
        match_id=match1.id,
        innings_number=2,
        batting_team_id=aus_team.id,
        bowling_team_id=india_team.id,
        total_runs=145,
        total_wickets=4,
        total_overs=16.4,
        is_completed=False
    )
    db.add_all([inn1, inn2])
    db.commit()

    # Seed Sample Balls with Realistic Commentary for Innings 2
    sample_deliveries = [
        (15, 1, 1, 0, False, "Cover", 141.2, "Bumrah angles in full on off-stump, Head punches solidly to extra cover for a single."),
        (15, 2, 4, 0, False, "Point", 137.8, "FOUR! Short of length outside off, Head rocks back and cuts ferociously past point!"),
        (15, 3, 0, 0, False, "Mid-Off", 144.5, "Pace on! Rapid seam delivery beating the inside edge through to Pant."),
        (15, 4, 2, 0, False, "Midwicket", 139.0, "Worked off the hips into deep midwicket pocket, excellent running between the wickets."),
        (15, 5, 6, 0, False, "Long On", 134.0, "SIX! Starc heaves down the ground! Huge clearance 91 meters over long-on!"),
        (15, 6, 0, 0, True, "Behind", 143.2, "OUT! CLEAN BOWLED! Toe-crushing yorker at 143.2 kph from Bumrah destroys the off-stump!"),
        (16, 1, 1, 0, False, "Fine Leg", 132.5, "Arshdeep slides one down leg, clipped neatly for a single to fine leg."),
        (16, 2, 0, 0, False, "Cover", 135.0, "Dot ball! Slower off-cutter gripping the surface, batter beaten completely."),
        (16, 3, 2, 0, False, "Point", 136.2, "Guiding the yorker deftly past backward point for two."),
        (16, 4, 1, 0, False, "Mid-On", 138.0, "Full toss pushed straight to mid-on, quick single taken.")
    ]

    rohit = ind_players[0]
    bumrah = ind_players[7]

    for ov, b_num, r, ext, wkt, zone, spd, comm in sample_deliveries:
        b_event = BallEvent(
            innings_id=inn2.id,
            over=ov,
            ball=b_num,
            batter_id=aus_players[0].id,
            bowler_id=bumrah.id,
            runs_scored=r,
            extras=ext,
            is_wicket=wkt,
            wicket_type="bowled" if wkt else None,
            pitch_x=0.08,
            pitch_y=8.2,
            shot_zone=zone,
            ball_speed_kph=spd,
            commentary=comm
        )
        db.add(b_event)

    # Seed Partnerships
    db.add(Partnership(
        innings_id=inn2.id,
        batter1_id=aus_players[0].id,
        batter2_id=aus_players[2].id,
        runs=68,
        balls=44
    ))

    # 5. Seed Field Formations
    for name, mtype, btype, intent, pos in [
        ("Powerplay Attacking (2-Out)", "T20", "Fast", "Attacking", PRESET_FORMATIONS["powerplay_attacking"]),
        ("Death Overs Yorker Trap (5-Out)", "T20", "Fast", "Death Overs", PRESET_FORMATIONS["death_overs_yorker"]),
        ("Spin Web Ring & Trap", "T20", "Spin", "Spin Trap", PRESET_FORMATIONS["spin_web_trap"])
    ]:
        db.add(FieldFormation(
            name=name,
            match_type=mtype,
            bowling_type=btype,
            tactical_intent=intent,
            positions_json=json.dumps(pos),
            is_preset=True
        ))

    db.commit()
    db.close()
    print("CRICKETVERSE AI database seeded successfully with authentic players, teams, matches & tactical presets!")

if __name__ == "__main__":
    seed_database()
