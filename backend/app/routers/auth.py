from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User
from ..schemas import UserCreate, UserLogin, UserResponse, TokenResponse
from ..auth_utils import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=TokenResponse)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    # Check existing email/username
    if db.query(User).filter(User.email == user_in.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    if db.query(User).filter(User.username == user_in.username).first():
        raise HTTPException(status_code=400, detail="Username already taken")
    
    new_user = User(
        email=user_in.email,
        username=user_in.username,
        hashed_password=hash_password(user_in.password),
        role=user_in.role or "player",
        full_name=user_in.full_name or user_in.username.title(),
        avatar_url=user_in.avatar_url or f"https://api.dicebear.com/7.x/bottts/svg?seed={user_in.username}"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = create_access_token({"sub": new_user.username, "role": new_user.role, "id": new_user.id})
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(new_user)
    )

@router.post("/login", response_model=TokenResponse)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(
        (User.username == credentials.username_or_email) | (User.email == credentials.username_or_email)
    ).first()
    
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid username/email or password")

    token = create_access_token({"sub": user.username, "role": user.role, "id": user.id})
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )

@router.post("/token")
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(
        (User.username == form_data.username) | (User.email == form_data.username)
    ).first()
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect username or password")

    token = create_access_token({"sub": user.username, "role": user.role, "id": user.id})
    return {"access_token": token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)

@router.post("/quick-login/{role}", response_model=TokenResponse)
def quick_demo_login(role: str, db: Session = Depends(get_db)):
    role_map = {
        "admin": ("admin_rahul", "admin@cricketverse.ai", "Rahul Dravid (Director)", "admin"),
        "coach": ("coach_virat", "coach@cricketverse.ai", "Virat Kohli (Head Coach)", "coach"),
        "player": ("player_shubman", "player@cricketverse.ai", "Shubman Gill (Player)", "player")
    }
    if role not in role_map:
        role = "coach"
    
    username, email, full_name, user_role = role_map[role]
    user = db.query(User).filter(User.username == username).first()
    if not user:
        user = User(
            email=email,
            username=username,
            hashed_password=hash_password("cricketverse123"),
            role=user_role,
            full_name=full_name,
            avatar_url=f"https://api.dicebear.com/7.x/bottts/svg?seed={username}"
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    token = create_access_token({"sub": user.username, "role": user.role, "id": user.id})
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )
