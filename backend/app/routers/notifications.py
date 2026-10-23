from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from ..database import get_db
from ..models import Notification, User
from ..schemas import NotificationResponse
from ..auth_utils import get_current_user

router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.get("", response_model=List[NotificationResponse])
def get_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    notifs = db.query(Notification).filter(Notification.user_id == current_user.id).order_by(desc(Notification.created_at)).limit(25).all()
    if not notifs:
        # Create initial welcoming notifications for demo convenience
        initial = [
            Notification(
                user_id=current_user.id,
                title="Welcome to CricketVerse AI",
                message="Your intelligent cricket command center is active. Try the 3D ground or ShotSense AI batting analyzer.",
                type="info"
            ),
            Notification(
                user_id=current_user.id,
                title="Live World Cup Clash Scheduled",
                message="India vs Australia Final preview is ready in LiveCricket AI and CricketMind.",
                type="success"
            )
        ]
        db.add_all(initial)
        db.commit()
        notifs = db.query(Notification).filter(Notification.user_id == current_user.id).order_by(desc(Notification.created_at)).all()

    return [NotificationResponse.model_validate(n) for n in notifs]

@router.put("/{notif_id}/read")
def mark_notification_read(
    notif_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    notif = db.query(Notification).filter(Notification.id == notif_id, Notification.user_id == current_user.id).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    notif.is_read = True
    db.commit()
    return {"message": "Notification marked as read"}
