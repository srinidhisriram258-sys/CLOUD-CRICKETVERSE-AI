import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, Text, DateTime, ForeignKey, Index
)
from sqlalchemy.orm import relationship
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), default="player")  # admin, coach, player
    full_name = Column(String(255), nullable=True)
    avatar_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    video_jobs = relationship("VideoJob", back_populates="user", cascade="all, delete-orphan")
    pitch_analyses = relationship("PitchAnalysis", back_populates="user", cascade="all, delete-orphan")
    field_formations = relationship("FieldFormation", back_populates="user", cascade="all, delete-orphan")
    team_lineups = relationship("TeamLineup", back_populates="user", cascade="all, delete-orphan")
    scouting_reports = relationship("ScoutingReport", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")


class Player(Base):
    __tablename__ = "players"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), index=True, nullable=False)
    country = Column(String(100), index=True, nullable=False)
    role = Column(String(100), index=True, nullable=False)  # Batter, Fast Bowler, Spin Bowler, All-Rounder, Wicketkeeper
    batting_style = Column(String(100), default="Right-hand bat")  # Right-hand bat, Left-hand bat
    bowling_style = Column(String(100), default="Right-arm fast")  # Right-arm fast, Right-arm off spin, Left-arm orthodox, etc.
    matches = Column(Integer, default=0)
    runs = Column(Integer, default=0)
    batting_avg = Column(Float, default=0.0)
    strike_rate = Column(Float, default=0.0)
    wickets = Column(Integer, default=0)
    bowling_avg = Column(Float, default=0.0)
    economy_rate = Column(Float, default=0.0)
    catches = Column(Integer, default=0)
    stumpings = Column(Integer, default=0)
    scout_score = Column(Float, default=75.0)  # 0-100 score
    form_index = Column(Float, default=80.0)   # 0-100 form
    profile_img = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    squad_entries = relationship("TeamSquad", back_populates="player")
    scouting_reports = relationship("ScoutingReport", back_populates="player")


class Team(Base):
    __tablename__ = "teams"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), unique=True, nullable=False)
    short_name = Column(String(10), nullable=False)
    logo_url = Column(String(500), nullable=True)
    coach_name = Column(String(255), nullable=True)
    captain_player_id = Column(Integer, ForeignKey("players.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    squad = relationship("TeamSquad", back_populates="team", cascade="all, delete-orphan")
    lineups = relationship("TeamLineup", back_populates="team", cascade="all, delete-orphan")


class TeamSquad(Base):
    __tablename__ = "team_squads"

    id = Column(Integer, primary_key=True, index=True)
    team_id = Column(Integer, ForeignKey("teams.id", ondelete="CASCADE"), nullable=False)
    player_id = Column(Integer, ForeignKey("players.id", ondelete="CASCADE"), nullable=False)
    is_captain = Column(Boolean, default=False)
    is_vice_captain = Column(Boolean, default=False)
    is_wicketkeeper = Column(Boolean, default=False)
    squad_role = Column(String(100), default="Primary")

    team = relationship("Team", back_populates="squad")
    player = relationship("Player", back_populates="squad_entries")


class Match(Base):
    __tablename__ = "matches"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    tournament = Column(String(255), default="T20 Championship")
    match_type = Column(String(50), default="T20")  # T20, ODI, Test
    venue = Column(String(255), default="Melbourne Cricket Ground")
    date = Column(DateTime, default=datetime.datetime.utcnow)
    status = Column(String(50), default="upcoming")  # upcoming, live, completed
    team1_id = Column(Integer, ForeignKey("teams.id"), nullable=False)
    team2_id = Column(Integer, ForeignKey("teams.id"), nullable=False)
    toss_winner = Column(String(255), nullable=True)
    toss_decision = Column(String(50), nullable=True)  # bat, bowl
    winner_id = Column(Integer, ForeignKey("teams.id"), nullable=True)
    win_margin = Column(String(255), nullable=True)
    current_innings = Column(Integer, default=1)
    current_over = Column(Float, default=0.0)
    current_ball = Column(Integer, default=0)
    required_rr = Column(Float, default=0.0)
    current_rr = Column(Float, default=0.0)
    is_demo = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    team1 = relationship("Team", foreign_keys=[team1_id])
    team2 = relationship("Team", foreign_keys=[team2_id])
    winner = relationship("Team", foreign_keys=[winner_id])
    innings = relationship("Innings", back_populates="match", cascade="all, delete-orphan")


class Innings(Base):
    __tablename__ = "innings"

    id = Column(Integer, primary_key=True, index=True)
    match_id = Column(Integer, ForeignKey("matches.id", ondelete="CASCADE"), nullable=False)
    innings_number = Column(Integer, default=1)
    batting_team_id = Column(Integer, ForeignKey("teams.id"), nullable=False)
    bowling_team_id = Column(Integer, ForeignKey("teams.id"), nullable=False)
    total_runs = Column(Integer, default=0)
    total_wickets = Column(Integer, default=0)
    total_overs = Column(Float, default=0.0)
    is_completed = Column(Boolean, default=False)

    match = relationship("Match", back_populates="innings")
    batting_team = relationship("Team", foreign_keys=[batting_team_id])
    bowling_team = relationship("Team", foreign_keys=[bowling_team_id])
    balls = relationship("BallEvent", back_populates="innings", cascade="all, delete-orphan")
    partnerships = relationship("Partnership", back_populates="innings", cascade="all, delete-orphan")


class BallEvent(Base):
    __tablename__ = "ball_events"

    id = Column(Integer, primary_key=True, index=True)
    innings_id = Column(Integer, ForeignKey("innings.id", ondelete="CASCADE"), nullable=False)
    over = Column(Integer, nullable=False)
    ball = Column(Integer, nullable=False)
    batter_id = Column(Integer, ForeignKey("players.id"), nullable=False)
    bowler_id = Column(Integer, ForeignKey("players.id"), nullable=False)
    runs_scored = Column(Integer, default=0)
    extras = Column(Integer, default=0)
    is_wicket = Column(Boolean, default=False)
    wicket_type = Column(String(50), nullable=True)  # bowled, caught, lbw, run_out, stumped
    dismissal_player_id = Column(Integer, ForeignKey("players.id"), nullable=True)
    pitch_x = Column(Float, default=0.0)  # coordinate on pitch
    pitch_y = Column(Float, default=0.0)
    shot_zone = Column(String(50), default="Cover")  # Cover, Point, Midwicket, etc.
    ball_speed_kph = Column(Float, default=135.0)
    commentary = Column(Text, nullable=True)

    innings = relationship("Innings", back_populates="balls")
    batter = relationship("Player", foreign_keys=[batter_id])
    bowler = relationship("Player", foreign_keys=[bowler_id])


class Partnership(Base):
    __tablename__ = "partnerships"

    id = Column(Integer, primary_key=True, index=True)
    innings_id = Column(Integer, ForeignKey("innings.id", ondelete="CASCADE"), nullable=False)
    batter1_id = Column(Integer, ForeignKey("players.id"), nullable=False)
    batter2_id = Column(Integer, ForeignKey("players.id"), nullable=False)
    runs = Column(Integer, default=0)
    balls = Column(Integer, default=0)

    innings = relationship("Innings", back_populates="partnerships")
    batter1 = relationship("Player", foreign_keys=[batter1_id])
    batter2 = relationship("Player", foreign_keys=[batter2_id])


class FieldFormation(Base):
    __tablename__ = "field_formations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    match_type = Column(String(50), default="T20")
    bowling_type = Column(String(50), default="Fast")  # Fast, Spin
    tactical_intent = Column(String(100), default="Attacking")  # Attacking, Defensive, Death Overs, Spin Trap
    positions_json = Column(Text, nullable=False)  # JSON array of 11 positions with {id, name, role, x, y, z, label}
    is_preset = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="field_formations")


class TeamLineup(Base):
    __tablename__ = "team_lineups"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=False)
    name = Column(String(255), default="My Custom XI")
    playing_xi_json = Column(Text, nullable=False)  # JSON array of 11 player IDs and roles
    batting_order_json = Column(Text, nullable=True)  # JSON array of player IDs in order 1-11
    balance_score = Column(Float, default=85.0)
    explanation = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="team_lineups")
    team = relationship("Team", back_populates="lineups")


class VideoJob(Base):
    __tablename__ = "video_jobs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    module_type = Column(String(50), nullable=False)  # shotsense, bowlvision, balltrack, cricketvision
    filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    status = Column(String(50), default="pending")  # pending, processing, completed, failed
    progress = Column(Integer, default=0)  # 0-100%
    result_json = Column(Text, nullable=True)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    user = relationship("User", back_populates="video_jobs")


class PitchAnalysis(Base):
    __tablename__ = "pitch_analyses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    pitch_type = Column(String(100), default="Green Seamer")  # Green Seamer, Dusty Spinner, Flat Track, Hard Bouncy
    moisture_level = Column(Float, default=35.0)  # 0-100%
    crack_density = Column(Float, default=20.0)   # 0-100%
    grass_coverage = Column(Float, default=45.0)  # 0-100%
    pace_prediction = Column(String(50), default="High")
    spin_prediction = Column(String(50), default="Moderate")
    bounce_prediction = Column(String(50), default="True & High")
    toss_recommendation = Column(String(50), default="Bowl First")
    weather_json = Column(Text, nullable=True)
    observable_features_json = Column(Text, nullable=True)
    image_path = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="pitch_analyses")


class ScoutingReport(Base):
    __tablename__ = "scouting_reports"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    player_id = Column(Integer, ForeignKey("players.id"), nullable=False)
    summary = Column(Text, nullable=False)
    strengths_json = Column(Text, nullable=False)
    weaknesses_json = Column(Text, nullable=False)
    match_up_analysis = Column(Text, nullable=True)
    overall_score = Column(Float, default=85.0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="scouting_reports")
    player = relationship("Player", back_populates="scouting_reports")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String(50), default="info")  # info, success, warning, alert
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="notifications")


class AuditEvent(Base):
    __tablename__ = "audit_events"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=True)
    action = Column(String(100), nullable=False)
    resource = Column(String(100), nullable=False)
    details = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
