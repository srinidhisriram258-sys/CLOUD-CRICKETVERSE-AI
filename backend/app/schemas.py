import datetime
from typing import Optional, List, Any, Dict
from pydantic import BaseModel, Field

# User Schemas
class UserBase(BaseModel):
    email: str
    username: str
    role: str = "player"
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    username_or_email: str
    password: str

class UserResponse(UserBase):
    id: int
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse


# Player Schemas
class PlayerBase(BaseModel):
    name: str
    country: str
    role: str
    batting_style: str = "Right-hand bat"
    bowling_style: str = "Right-arm fast"
    matches: int = 0
    runs: int = 0
    batting_avg: float = 0.0
    strike_rate: float = 0.0
    wickets: int = 0
    bowling_avg: float = 0.0
    economy_rate: float = 0.0
    catches: int = 0
    stumpings: int = 0
    scout_score: float = 75.0
    form_index: float = 80.0
    profile_img: Optional[str] = None

class PlayerCreate(PlayerBase):
    pass

class PlayerResponse(PlayerBase):
    id: int
    created_at: datetime.datetime

    class Config:
        from_attributes = True


# Team & Squad Schemas
class TeamBase(BaseModel):
    name: str
    short_name: str
    logo_url: Optional[str] = None
    coach_name: Optional[str] = None
    captain_player_id: Optional[int] = None

class TeamCreate(TeamBase):
    pass

class TeamResponse(TeamBase):
    id: int
    created_at: datetime.datetime

    class Config:
        from_attributes = True


# Match & Innings Schemas
class BallEventResponse(BaseModel):
    id: int
    over: int
    ball: int
    batter_id: int
    bowler_id: int
    runs_scored: int
    extras: int
    is_wicket: bool
    wicket_type: Optional[str]
    pitch_x: float
    pitch_y: float
    shot_zone: str
    ball_speed_kph: float
    commentary: Optional[str]

    class Config:
        from_attributes = True

class InningsResponse(BaseModel):
    id: int
    match_id: int
    innings_number: int
    batting_team_id: int
    bowling_team_id: int
    total_runs: int
    total_wickets: int
    total_overs: float
    is_completed: bool

    class Config:
        from_attributes = True

class MatchResponse(BaseModel):
    id: int
    title: str
    tournament: str
    match_type: str
    venue: str
    date: datetime.datetime
    status: str
    team1_id: int
    team2_id: int
    toss_winner: Optional[str]
    toss_decision: Optional[str]
    winner_id: Optional[int]
    win_margin: Optional[str]
    current_innings: int
    current_over: float
    current_ball: int
    required_rr: float
    current_rr: float
    is_demo: bool
    created_at: datetime.datetime
    team1: Optional[TeamResponse] = None
    team2: Optional[TeamResponse] = None

    class Config:
        from_attributes = True


# Field Formation Schemas
class PositionCoord(BaseModel):
    id: int
    name: str
    role: str
    x: float
    y: float
    z: float
    label: str

class FieldFormationBase(BaseModel):
    name: str
    match_type: str = "T20"
    bowling_type: str = "Fast"
    tactical_intent: str = "Attacking"
    positions_json: str
    is_preset: bool = False

class FieldFormationCreate(FieldFormationBase):
    pass

class FieldFormationResponse(FieldFormationBase):
    id: int
    user_id: Optional[int]
    created_at: datetime.datetime

    class Config:
        from_attributes = True


# Team Builder Lineup Schemas
class TeamLineupCreate(BaseModel):
    team_id: int
    name: str
    playing_xi: List[int]  # 11 player IDs
    batting_order: Optional[List[int]] = None
    captain_id: Optional[int] = None
    wicketkeeper_id: Optional[int] = None

class TeamLineupResponse(BaseModel):
    id: int
    user_id: int
    team_id: int
    name: str
    playing_xi_json: str
    batting_order_json: Optional[str]
    balance_score: float
    explanation: Optional[str]
    created_at: datetime.datetime

    class Config:
        from_attributes = True


# Video Job Schemas
class VideoJobResponse(BaseModel):
    id: int
    user_id: int
    module_type: str
    filename: str
    status: str
    progress: int
    result_json: Optional[str]
    error_message: Optional[str]
    created_at: datetime.datetime
    updated_at: datetime.datetime

    class Config:
        from_attributes = True


# Pitch Analysis Schemas
class PitchAnalysisCreate(BaseModel):
    pitch_type: str
    moisture_level: float
    crack_density: float
    grass_coverage: float
    pace_prediction: str
    spin_prediction: str
    bounce_prediction: str
    toss_recommendation: str
    weather_json: Optional[str] = None
    observable_features_json: Optional[str] = None

class PitchAnalysisResponse(BaseModel):
    id: int
    user_id: int
    pitch_type: str
    moisture_level: float
    crack_density: float
    grass_coverage: float
    pace_prediction: str
    spin_prediction: str
    bounce_prediction: str
    toss_recommendation: str
    weather_json: Optional[str]
    observable_features_json: Optional[str]
    image_path: Optional[str]
    created_at: datetime.datetime

    class Config:
        from_attributes = True


# Scouting Report Schemas
class ScoutingReportCreate(BaseModel):
    player_id: int
    summary: str
    strengths: List[str]
    weaknesses: List[str]
    match_up_analysis: Optional[str] = None
    overall_score: float = 85.0

class ScoutingReportResponse(BaseModel):
    id: int
    user_id: int
    player_id: int
    summary: str
    strengths_json: str
    weaknesses_json: str
    match_up_analysis: Optional[str]
    overall_score: float
    created_at: datetime.datetime
    player: Optional[PlayerResponse] = None

    class Config:
        from_attributes = True


# Notification Schemas
class NotificationResponse(BaseModel):
    id: int
    title: str
    message: str
    type: str
    is_read: bool
    created_at: datetime.datetime

    class Config:
        from_attributes = True
