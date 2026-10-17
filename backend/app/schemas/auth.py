from pydantic import BaseModel, EmailStr
from typing import Optional
from backend.app.models.user import UserRole


class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    full_name: str
    email: str
    user_id: int


class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: UserRole = UserRole.EMPLOYEE


class UserOut(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    is_active: bool

    class Config:
        from_attributes = True
