# backend/schemas.py
from typing import List, Optional
from pydantic import BaseModel

class UserBase(BaseModel):
    username: str

class UserCreate(BaseModel):
    username: str
    password: str

    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    username: str
    password: str

class UserInDB(UserBase):
    hashed_password: str
    is_moderator: bool

    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    avatar: Optional[str] = None
    status: Optional[str] = None

class UserResponse(BaseModel):
    id: int
    username: str
    is_moderator: bool
    avatar: Optional[str] = None
    status: str

    class Config:
        from_attributes = True

class RoomCreate(BaseModel):
    name: str
    is_public: bool = True
    user_ids: List[int] = []

class RoomUpdate(BaseModel):
    name: Optional[str] = None
    is_public: Optional[bool] = None
    user_ids: Optional[List[int]] = None

class AgentBase(BaseModel):
    name: str
    personality: str
    context: str

class AgentCreate(AgentBase):
    pass

class AgentUpdate(BaseModel):
    name: Optional[str] = None
    personality: Optional[str] = None
    context: Optional[str] = None
    is_active: Optional[bool] = None

class AgentResponse(BaseModel):
    id: int
    name: str
    is_active: bool

    class Config:
        from_attributes = True

class RoomResponse(BaseModel):
    id: int
    name: str
    is_public: bool
    created_by: int
    users: List[UserResponse] = []
    agents: List[AgentResponse] = []
    active_commands: List[str] = []

    class Config:
        from_attributes = True

class RefreshTokenRequest(BaseModel):
    refresh_token: str