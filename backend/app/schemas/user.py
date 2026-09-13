from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional

class UserBase(BaseModel):
    display_name: str
    email: EmailStr

class UserCreate(UserBase):
    password: str
    invite_code: str

class UserResponse(UserBase):
    id: int
    role: str
    created_at: datetime

    class Config:
        from_attributes = True

class InviteCodeCreate(BaseModel):
    pass

class InviteCodeResponse(BaseModel):
    id: int
    code: str
    created_by: int
    used_by: Optional[int]
    expires_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True
