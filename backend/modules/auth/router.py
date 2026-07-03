from datetime import datetime, timedelta, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from jose import jwt
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.security import CurrentUser, get_current_user
from modules.auth.password import verify_password
from modules.production.models import User

router = APIRouter(tags=["auth"])


class LoginRequest(BaseModel):
    login: str = Field(min_length=1)
    password: str = Field(min_length=1)


class AuthUserRead(BaseModel):
    id: int
    name: str
    email: str
    username: str | None = None
    role: str


class LoginResponse(BaseModel):
    token: str
    token_type: str = "bearer"
    user: AuthUserRead


def _issue_token(user: User) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_expire_minutes)
    return jwt.encode(
        {"sub": user.username, "role": user.role, "uid": user.id, "exp": expire},
        settings.jwt_secret,
        algorithm="HS256",
    )


def _user_read(user: User) -> AuthUserRead:
    return AuthUserRead(
        id=user.id,
        name=user.name,
        email=user.email,
        username=user.username,
        role=user.role,
    )


@router.post("/auth/login", response_model=LoginResponse)
def login(payload: LoginRequest, db: Annotated[Session, Depends(get_db)]) -> LoginResponse:
    username = payload.login.strip().lower()
    user = (
        db.query(User)
        .filter(User.username == username, User.active.is_(True))
        .first()
    )

    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=422,
            detail={
                "message": "Datos inválidos",
                "errors": {"login": ["Usuario o contraseña incorrectos."]},
            },
        )

    return LoginResponse(token=_issue_token(user), user=_user_read(user))


@router.get("/auth/me", response_model=AuthUserRead)
def me(current_user: Annotated[CurrentUser, Depends(get_current_user)]) -> AuthUserRead:
    return AuthUserRead(
        id=current_user.id,
        name=current_user.name,
        email=current_user.email,
        username=current_user.username,
        role=current_user.role,
    )
