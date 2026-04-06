from pydantic import BaseModel, EmailStr, Field


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1)


class SignupRequest(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8)
    phone: str | None = None
    role: str = "citizen"   # citizen | collector  (admin created by other admins)
    zone_id: int | None = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserPublic"


class UserPublic(BaseModel):
    id: int
    full_name: str
    email: str
    role: str
    zone_id: int | None

    model_config = {"from_attributes": True}


TokenResponse.model_rebuild()
