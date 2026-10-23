import os
import shutil
import uuid
import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import desc
from ..database import get_db
from ..config import settings
from ..models import VideoJob, User
from ..schemas import VideoJobResponse
from ..auth_utils import get_current_user
from ..services.video_service import process_video_job_async
from ..services.cv_pipelines import (
    run_shotsense_analysis,
    run_balltrack_analysis,
    run_bowlvision_analysis,
    run_cricketvision_analysis
)

router = APIRouter(prefix="/video-jobs", tags=["Video Processing & CV"])

ALLOWED_EXTENSIONS = {".mp4", ".webm", ".avi", ".mov", ".m4v"}

@router.post("/upload", response_model=VideoJobResponse)
async def upload_video(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    module_type: str = Form("shotsense"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported video format: '{ext}'. Supported formats: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    # Save video file
    unique_name = f"{uuid.uuid4().hex[:10]}_{file.filename}"
    save_path = os.path.join(settings.UPLOAD_DIR, "videos", unique_name)
    
    with open(save_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    file_size_mb = os.path.getsize(save_path) / (1024 * 1024)
    if file_size_mb > settings.MAX_UPLOAD_SIZE_MB:
        os.remove(save_path)
        raise HTTPException(
            status_code=400,
            detail=f"File exceeds maximum upload size of {settings.MAX_UPLOAD_SIZE_MB}MB (current: {file_size_mb:.1f}MB)"
        )

    job = VideoJob(
        user_id=current_user.id,
        module_type=module_type.lower(),
        filename=file.filename,
        file_path=save_path,
        status="pending",
        progress=0
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    # Schedule background processing
    background_tasks.add_task(process_video_job_async, job.id)

    return VideoJobResponse.model_validate(job)

@router.get("/jobs/{job_id}", response_model=VideoJobResponse)
def get_job_status(job_id: int, db: Session = Depends(get_db)):
    job = db.query(VideoJob).filter(VideoJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Video job not found")
    return VideoJobResponse.model_validate(job)

@router.get("/user", response_model=List[VideoJobResponse])
def get_user_jobs(
    module_type: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    q = db.query(VideoJob).filter(VideoJob.user_id == current_user.id)
    if module_type:
        q = q.filter(VideoJob.module_type == module_type.lower())
    jobs = q.order_by(desc(VideoJob.created_at)).all()
    return [VideoJobResponse.model_validate(j) for j in jobs]

@router.post("/demo/{module_type}", response_model=VideoJobResponse)
def run_demo_video_job(
    module_type: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Instantly generates and completes a demo analysis job for testing."""
    valid_modules = {"shotsense", "balltrack", "bowlvision", "cricketvision"}
    m_type = module_type.lower()
    if m_type not in valid_modules:
        m_type = "shotsense"

    sample_names = {
        "shotsense": "cover_drive_practice_nets_hd.mp4",
        "balltrack": "stump_camera_yorker_delivery.mp4",
        "bowlvision": "fast_bowling_biomechanics_side_angle.mp4",
        "cricketvision": "match_highlight_field_tracking.mp4"
    }

    dummy_path = os.path.join(settings.UPLOAD_DIR, "videos", sample_names[m_type])
    if not os.path.exists(dummy_path):
        with open(dummy_path, "w") as f:
            f.write("SAMPLE_CRICKET_VIDEO_PLACEHOLDER")

    # Run analysis pipeline
    output_dir = os.path.join(settings.UPLOAD_DIR, "processed")
    if m_type == "shotsense":
        res = run_shotsense_analysis(dummy_path, output_dir)
    elif m_type == "balltrack":
        res = run_balltrack_analysis(dummy_path, output_dir)
    elif m_type == "bowlvision":
        res = run_bowlvision_analysis(dummy_path, output_dir)
    else:
        res = run_cricketvision_analysis(dummy_path, output_dir)

    job = VideoJob(
        user_id=current_user.id,
        module_type=m_type,
        filename=sample_names[m_type],
        file_path=dummy_path,
        status="completed",
        progress=100,
        result_json=json.dumps(res)
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    return VideoJobResponse.model_validate(job)

@router.get("/keyframes/{filename}")
def get_keyframe(filename: str):
    path = os.path.join(settings.UPLOAD_DIR, "processed", filename)
    if os.path.exists(path):
        return FileResponse(path)
    raise HTTPException(status_code=404, detail="Keyframe image not found")
