from passlib.context import CryptContext
from sqlalchemy.orm import Session
from models import User
from schemas import UserCreate, UserLogin, UserResponse
from fastapi import Depends, HTTPException, status
from jose import JWTError, jwt
from datetime import datetime, timedelta
from fastapi.security import OAuth2PasswordBearer
from database import SessionLocal
import os

SECRET_KEY = "votre_cle_secrete_pour_le_jwt"
REFRESH_SECRET_KEY = "votre_cle_secrete_pour_le_refresh_jwt"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_user(db: Session, user: UserCreate):
    try:
        # Vérifier si l'utilisateur existe déjà
        db_user = db.query(User).filter(User.username == user.username).first()
        if db_user:
            raise HTTPException(status_code=400, detail="Nom d'utilisateur déjà enregistré")
        
        # Créer un nouvel utilisateur
        hashed_password = get_password_hash(user.password)
        db_user = User(username=user.username, hashed_password=hashed_password)
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user
    except Exception as e:
        db.rollback()
        print(f"Erreur dans create_user: {str(e)}")
        raise

def authenticate_user(db: Session, username: str, password: str):
    user = db.query(User).filter(User.username == username).first()
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def create_refresh_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, REFRESH_SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    return get_user_from_token(token, db)

def get_user_from_token(token: str, db: Session):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        print(f"Token payload: {payload}")  # Debugging output
        username: str = payload.get("sub")
        if username is None:
            print("Username is None in token")
            return None
    except JWTError as e:
        print(f"JWTError: {e}")
        return None
    user = db.query(User).filter(User.username == username).first()
    return user


def get_user_from_refresh_token(refresh_token: str, db: Session):
    try:
        payload = jwt.decode(refresh_token, REFRESH_SECRET_KEY, algorithms=[ALGORITHM])
        print(f"Refresh token payload: {payload}")
        username: str = payload.get("sub")
        if username is None:
            print("Username is None in refresh token")
            return None
    except JWTError as e:
        print(f"JWTError: {e}")
        return None
    user = db.query(User).filter(User.username == username).first()
    if user is None:
        print(f"User '{username}' not found in database")
    else:
        print(f"User '{username}' found in database")
    return user
