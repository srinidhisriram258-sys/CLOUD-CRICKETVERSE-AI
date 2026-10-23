import os
import json
import asyncio
from datetime import datetime
from sqlalchemy.orm import Session
from ..database import SessionLocal
from ..models import VideoJob, Notification
from .cv_pipelines import (
    run_shotsense_analysis,
    run_balltrack_analysis,
    run_bowlvision_analysis,
    run_cricketvision_analysis
)

async def process_video_job_async(job_id: int):
    """Processes video job asynchronously in background, updating progress and saving results."""
    db: Session = SessionLocal()
    try:
        job = db.query(VideoJob).filter(VideoJob.id == job_id).first()
        if not job:
            return

        job.status = "processing"
        job.progress = 15
        db.commit()

        output_dir = os.path.dirname(job.file_path)

        # Simulate gradual CV inference steps
        await asyncio.sleep(0.5)
        job.progress = 45
        db.commit()

        result = {}
        if job.module_type == "shotsense":
            result = run_shotsense_analysis(job.file_path, output_dir)
        elif job.module_type == "balltrack":
            result = run_balltrack_analysis(job.file_path, output_dir)
        elif job.module_type == "bowlvision":
            result = run_bowlvision_analysis(job.file_path, output_dir)
        elif job.module_type == "cricketvision":
            result = run_cricketvision_analysis(job.file_path, output_dir)
        else:
            result = run_shotsense_analysis(job.file_path, output_dir)

        await asyncio.sleep(0.5)
        job.progress = 85
        db.commit()

        job.status = "completed"
        job.progress = 100
        job.result_json = json.dumps(result)
        job.updated_at = datetime.utcnow()

        # Create user notification
        notif = Notification(
            user_id=job.user_id,
            title=f"{job.module_type.upper()} Analysis Complete",
            message=f"Your {job.module_type} analysis for '{job.filename}' has completed successfully.",
            type="success"
        )
        db.add(notif)
        db.commit()

    except Exception as e:
        if job:
            job.status = "failed"
            job.error_message = str(e)
            job.updated_at = datetime.utcnow()
            db.commit()
    finally:
        db.close()
