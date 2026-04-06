from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from api.db.database import get_db
from api.schemas.auth import LoginRequest, SignupRequest, TokenResponse, UserPublic
from api.services.auth_service import authenticate_user, register_user

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/login", response_model=TokenResponse, summary="Sign in with email + password")
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)):
    user, token = await authenticate_user(db, payload)
    return TokenResponse(access_token=token, user=UserPublic.model_validate(user))


@router.post("/signup", response_model=TokenResponse, status_code=201, summary="Create a new account")
async def signup(payload: SignupRequest, db: AsyncSession = Depends(get_db)):
    user, token = await register_user(db, payload)
    return TokenResponse(access_token=token, user=UserPublic.model_validate(user))
