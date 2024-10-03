# backend/main.py
import json
import asyncio
from fastapi import FastAPI, Query, Request, WebSocket, WebSocketDisconnect, Depends, HTTPException, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from jose import JWTError
from models import User, Room, Agent, RoomAgent
from database import SessionLocal, engine
from sqlalchemy.orm import Session
from chatgpt import ChatGPT
from agent_manager import AgentManager
from schemas import RefreshTokenRequest, RoomUpdate, UserCreate, UserLogin, UserResponse, UserUpdate, RoomCreate, RoomResponse, AgentCreate, AgentResponse, AgentUpdate
from auth import create_user, authenticate_user, get_current_user, create_access_token, get_user_from_refresh_token, get_user_from_token
from fastapi import APIRouter
from typing import List
import models
from fastapi.security import OAuth2PasswordRequestForm

app = FastAPI()

# Configuration CORS
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000"
    # Ajoutez d'autres origines si nécessaire
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend address
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Créer les tables de la base de données
models.Base.metadata.create_all(bind=engine)

# Instances
chatgpt = ChatGPT()
agent_manager = AgentManager()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.post("/register", response_model=UserResponse)
def register(user: UserCreate, db: Session = Depends(get_db)):
    try:
        print(f"Attempting to create user: {user.username}")
        new_user = create_user(db, user)
        print(f"User created successfully: {new_user.username}")
        return new_user
    except HTTPException as he:
        print(f"HTTP exception during user creation: {str(he)}")
        raise he
    except Exception as e:
        print(f"Unexpected error creating user: {str(e)}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred")

@app.post("/login")
def login(user: UserLogin, db: Session = Depends(get_db)):
    try:
        print(f"Attempting login for user: {user.username}")
        authenticated_user = authenticate_user(db, user)
        # Here you would typically create and return a JWT token
        print(f"Login successful for user: {authenticated_user.username}")
        return {"message": "Login successful"}
    except HTTPException as he:
        print(f"HTTP exception during login: {str(he)}")
        raise he
    except Exception as e:
        print(f"Unexpected error during login: {str(e)}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred")

@app.post("/token")
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}
   
@app.post("/test_register")
def test_register(user: UserCreate):
    print("Validation réussie :", user.dict())
    return {"message": "Validation réussie"}


@app.post("/token/refresh")
async def refresh_access_token(request: RefreshTokenRequest, db: Session = Depends(get_db)):
    try:
        user = get_user_from_refresh_token(request.refresh_token, db)
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token",
                headers={"WWW-Authenticate": "Bearer"},
            )
        # Create a new access token
        new_access_token = create_access_token(data={"sub": user.username})
        return {"access_token": new_access_token, "token_type": "bearer"}
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )


@app.websocket("/ws/{room_name}")
async def websocket_endpoint(
    websocket: WebSocket,
    room_name: str,
    token: str = Query(...)
):
    db = SessionLocal()
    try:
        # Authenticate the user via token
        user = get_user_from_token(token, db)
        if not user:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Invalid token")
            return

        await websocket.accept()
        await agent_manager.connect(websocket, room_name, user)
        print(f"User {user.username} connected to room {room_name}")

        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)
            event_type = message_data.get("event")
            message = message_data.get("message")

            if event_type == "typing":
                await agent_manager.broadcast_typing(room_name, user.username)
            else:
                # Broadcast message to other users
                await agent_manager.broadcast(message, room_name, user.username)
                await agent_manager.handle_triggers(message, room_name, user.username)

    except WebSocketDisconnect:
        print(f"User {user.username} disconnected")
        agent_manager.disconnect(websocket, room_name)
        await agent_manager.broadcast(f"{user.username} has left the chat", room_name)
    except Exception as e:
        print(f"WebSocket error for user {user.username}: {str(e)}")
        await websocket.close(code=status.WS_1011_INTERNAL_ERROR, reason="Server error occurred")
    finally:
        db.close()


@app.post("/rooms", response_model=RoomResponse)
async def create_room(room: RoomCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db_room = Room(name=room.name, is_public=room.is_public, created_by=current_user.id)
    db.add(db_room)
    db.commit()
    db.refresh(db_room)
    return db_room

@app.put("/rooms/{room_id}", response_model=RoomResponse)
def update_room(room_id: int, room_update: RoomUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not current_user.is_moderator:
        raise HTTPException(status_code=403, detail="Only moderators can update rooms")
    
    db_room = db.query(models.Room).filter(models.Room.id == room_id).first()
    if db_room is None:
        raise HTTPException(status_code=404, detail="Room not found")
    
    for key, value in room_update.dict(exclude_unset=True).items():
        if key == "user_ids":
            # Mettre à jour les utilisateurs de la salle
            new_users = db.query(models.User).filter(models.User.id.in_(value)).all()
            db_room.users = new_users
        else:
            setattr(db_room, key, value)
    
    db.commit()
    db.refresh(db_room)
    return db_room

@app.post("/rooms/{room_id}/agents/{agent_id}")
def toggle_agent_in_room(room_id: int, agent_id: int, is_active: bool, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not current_user.is_moderator:
        raise HTTPException(status_code=403, detail="Only moderators can toggle agents")
    
    db_room = db.query(models.Room).filter(models.Room.id == room_id).first()
    if db_room is None:
        raise HTTPException(status_code=404, detail="Room not found")
    
    db_agent = db.query(models.Agent).filter(models.Agent.id == agent_id).first()
    if db_agent is None:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    # Vérifier si l'agent est déjà dans la salle
    room_agent = db.query(models.RoomAgent).filter(
        models.RoomAgent.room_id == room_id,
        models.RoomAgent.agent_id == agent_id
    ).first()
    
    if room_agent:
        # Mettre à jour l'état de l'agent dans la salle
        room_agent.is_active = is_active
    else:
        # Ajouter l'agent à la salle
        new_room_agent = models.RoomAgent(room_id=room_id, agent_id=agent_id, is_active=is_active)
        db.add(new_room_agent)
    
    db.commit()
    
    return {"message": f"Agent {'activated' if is_active else 'deactivated'} in room successfully"}

@app.get("/rooms/{room_id}", response_model=RoomResponse)
async def read_room(room_id: int, db: Session = Depends(get_db)):
    room = db.query(models.Room).filter(models.Room.id == room_id).first()
    if room is None:
        raise HTTPException(status_code=404, detail="Room not found")
    return room

@app.get("/rooms", response_model=List[RoomResponse])
def get_rooms(db: Session = Depends(get_db)):
    rooms = db.query(models.Room).all()
    return rooms

@app.get("/rooms/{room_name}", response_model=RoomResponse)
async def get_room(room_name: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    room = db.query(Room).filter(Room.name == room_name).first()
    if room is None:
        raise HTTPException(status_code=404, detail="Room not found")
    return {
        "id": room.id,
        "name": room.name,
        "is_public": room.is_public,
        "created_by": room.created_by,
        "users": [],  # Vous pouvez remplir cela si nécessaire
        "agents": [],  # Vous pouvez remplir cela si nécessaire
        "active_commands": []  # Vous pouvez remplir cela si nécessaire
    }

@app.post("/rooms/{room_id}/commands/{command}")
def toggle_command_in_room(
    room_id: int, 
    command: str, 
    is_active: bool, 
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    if not current_user.is_moderator:
        raise HTTPException(status_code=403, detail="Only moderators can toggle commands")
    
    # Vérifier si la salle existe
    room = db.query(models.Room).filter(models.Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    # Vérifier si la commande existe déjà pour cette salle
    room_command = db.query(models.RoomCommand).filter(
        models.RoomCommand.room_id == room_id,
        models.RoomCommand.command == command
    ).first()
    
    if room_command:
        # Mettre à jour l'état de la commande
        room_command.is_active = is_active
    else:
        # Créer une nouvelle entrée pour la commande dans cette salle
        room_command = models.RoomCommand(room_id=room_id, command=command, is_active=is_active)
        db.add(room_command)
    
    db.commit()
    
    return {
        "message": f"Command '{command}' {'activated' if is_active else 'deactivated'} in room {room_id}",
        "room_id": room_id,
        "command": command,
        "is_active": is_active
    }

@app.put("/users/me", response_model=UserResponse)
def update_user(user_update: UserUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    for key, value in user_update.dict(exclude_unset=True).items():
        setattr(current_user, key, value)
    db.commit()
    db.refresh(current_user)
    return current_user

@app.get("/users/me", response_model=UserResponse)
async def read_users_me(current_user: models.User = Depends(get_current_user)):
    return current_user

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={
            "detail": exc.errors(),
            "body": exc.body,
        },
    )

@app.post("/agents", response_model=AgentResponse)
def create_agent(agent: AgentCreate, db: Session = Depends(get_db)):
    db_agent = models.Agent(**agent.dict())
    db.add(db_agent)
    db.commit()
    db.refresh(db_agent)
    return db_agent

@app.get("/agents", response_model=List[AgentResponse])
def get_agents(db: Session = Depends(get_db)):
    agents = db.query(models.Agent).all()
    return agents

@app.patch("/agents/{agent_id}", response_model=AgentResponse)
def update_agent(agent_id: int, agent_update: AgentUpdate, db: Session = Depends(get_db)):
    db_agent = db.query(models.Agent).filter(models.Agent.id == agent_id).first()
    if not db_agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    for key, value in agent_update.dict(exclude_unset=True).items():
        setattr(db_agent, key, value)
    db.commit()
    db.refresh(db_agent)
    return db_agent

@app.middleware("http")
async def log_requests(request: Request, call_next):
    body = await request.body()
    print(f"Request: {request.method} {request.url}")
    print(f"Headers: {request.headers}")
    print(f"Body: {body.decode()}")
    response = await call_next(request)
    return response