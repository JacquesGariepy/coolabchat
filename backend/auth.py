from passlib.context import CryptContext
from sqlalchemy.orm import Session
from models import User
from schemas import UserCreate, UserLogin, UserResponse
from fastapi import Depends, HTTPException, status
from database import SessionLocal
from typing import Optional

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a given password against the hashed password."""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Hash a given password."""
    return pwd_context.hash(password)

def create_user(db: Session, user: UserCreate) -> User:
    """Create a new user in the database."""
    try:
        # Check if the user already exists
        db_user = db.query(User).filter(User.username == user.username).first()
        if db_user:
            raise HTTPException(status_code=400, detail="Username already registered")
        
        # Create a new user
        hashed_password = get_password_hash(user.password)
        db_user = User(username=user.username, hashed_password=hashed_password)
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user
    except Exception as e:
        db.rollback()
        print(f"Error in create_user: {str(e)}")
        raise

def authenticate_user(db: Session, username: str, password: str) -> Optional[User]:
    """Authenticate user by username and password."""
    user = db.query(User).filter(User.username == username).first()
    if not user or not verify_password(password, user.hashed_password):
        return None
    return user

async def login(user: UserLogin, db: Session = Depends(get_db)) -> UserResponse:
    """Login endpoint without token, returning the user details if authentication is successful."""
    authenticated_user = authenticate_user(db, user.username, user.password)
    if not authenticated_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )
    return UserResponse(id=authenticated_user.id, username=authenticated_user.username)

async def get_current_user(username: str, db: Session = Depends(get_db)) -> Optional[User]:
    """Get current user from the username."""
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user
