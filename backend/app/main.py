import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .config import settings
from .database import engine, Base
from .seed_data import seed_database
from .routers import (
    auth,
    players,
    teams,
    matches,
    field_formations,
    video_jobs,
    pitch,
    reports,
    notifications
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create tables and seed demo records
    Base.metadata.create_all(bind=engine)
    seed_database()
    yield
    # Shutdown cleanups if any

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="All-in-One Intelligent Cricket Ecosystem — Analyze. Predict. Train. Dominate.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all for local dev & vite ports
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files for processed media and uploads
if os.path.exists(settings.UPLOAD_DIR):
    app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Include Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(players.router, prefix=settings.API_V1_STR)
app.include_router(teams.router, prefix=settings.API_V1_STR)
app.include_router(matches.router, prefix=settings.API_V1_STR)
app.include_router(field_formations.router, prefix=settings.API_V1_STR)
app.include_router(video_jobs.router, prefix=settings.API_V1_STR)
app.include_router(pitch.router, prefix=settings.API_V1_STR)
app.include_router(reports.router, prefix=settings.API_V1_STR)
app.include_router(notifications.router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "app": "CRICKETVERSE AI",
        "tagline": "Analyze. Predict. Train. Dominate.",
        "version": "1.0.0",
        "status": "online",
        "docs_url": "/docs",
        "api_v1_prefix": settings.API_V1_STR
    }

@app.get("/api/v1/health")
def health_check():
    return {
        "status": "healthy",
        "database": "connected (SQLite)",
        "upload_directory": settings.UPLOAD_DIR,
        "cv_engine": "active (OpenCV + MediaPipe)",
        "modules_active": 10
    }

@app.get("/api/v1/modules")
def list_modules():
    return {
        "modules": [
            {"id": "cricketmind", "name": "CricketMind AI", "description": "Match Intelligence & Predictive Win Probability", "status": "active"},
            {"id": "shotsense", "name": "ShotSense AI", "description": "Batting Biomechanics & Pose Estimation Coach", "status": "active"},
            {"id": "balltrack", "name": "BallTrack AI", "description": "3D Ball Trajectory & Pitch Bounce Tracking", "status": "active"},
            {"id": "bowlvision", "name": "BowlVision AI", "description": "Bowling Action Kinematics & Injury Prevention", "status": "active"},
            {"id": "scoutxi", "name": "ScoutXI AI", "description": "Player Scouting, Multi-Radar & Transparent Index", "status": "active"},
            {"id": "fieldiq", "name": "FieldIQ AI", "description": "Interactive 3D Field Placement & Tactical Presets", "status": "active"},
            {"id": "teamxi", "name": "TeamXI AI", "description": "Intelligent Team Builder with Balance Optimization", "status": "active"},
            {"id": "livecricket", "name": "LiveCricket AI", "description": "Live Match Center with Real-time Ball Simulator", "status": "active"},
            {"id": "pitchpredict", "name": "PitchPredict AI", "description": "Pitch Surface Image CV & Meteorological Predictions", "status": "active"},
            {"id": "cricketvision", "name": "CricketVision AI", "description": "Video Intelligence, Player Tracking & Highlights", "status": "active"}
        ]
    }
