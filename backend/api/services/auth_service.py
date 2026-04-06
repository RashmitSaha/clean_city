from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from api.models.user import User, Role
from api.schemas.auth import LoginRequest, SignupRequest
from api.core.security import hash_password, verify_password, create_access_token


async def authenticate_user(db: AsyncSession, payload: LoginRequest) -> tuple[User, str]:
    result = await db.execute(select(User).where(User.email == payload.email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is disabled")

    token = create_access_token(subject=user.id, extra={"role": user.role})
    return user, token


async def register_user(db: AsyncSession, payload: SignupRequest) -> tuple[User, str]:
    # Check email uniqueness
    existing = await db.execute(select(User).where(User.email == payload.email))
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists",
        )

    # Only citizen / collector self-registration allowed
    allowed_roles = {Role.citizen, Role.collector}
    try:
        role = Role(payload.role)
    except ValueError:
        role = Role.citizen

    if role not in allowed_roles:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot self-register as admin")

    user = User(
        full_name=payload.full_name,
        email=payload.email,
        hashed_password=hash_password(payload.password),
        role=role,
        phone=payload.phone,
        zone_id=payload.zone_id,
        is_active=True,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    token = create_access_token(subject=user.id, extra={"role": user.role})
    return user, token
