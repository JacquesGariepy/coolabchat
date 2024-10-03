# backend/models.py
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_moderator = Column(Boolean, default=False)
    avatar = Column(String, nullable=True)
    status = Column(String, default="online")

    rooms = relationship("Room", secondary="room_users", back_populates="users")

class Room(Base):
    __tablename__ = "rooms"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    is_public = Column(Boolean, default=True)
    created_by = Column(Integer, ForeignKey('users.id'))

    users = relationship("User", secondary="room_users", back_populates="rooms")
    agents = relationship("Agent", secondary="room_agents", back_populates="rooms")
    commands = relationship("RoomCommand", back_populates="room")

class RoomUser(Base):
    __tablename__ = "room_users"
    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(Integer, ForeignKey('rooms.id'))
    user_id = Column(Integer, ForeignKey('users.id'))

class Agent(Base):
    __tablename__ = "agents"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    personality = Column(String)
    context = Column(String)
    is_active = Column(Boolean, default=True)

    rooms = relationship("Room", secondary="room_agents", back_populates="agents")

class RoomAgent(Base):
    __tablename__ = "room_agents"
    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(Integer, ForeignKey('rooms.id'))
    agent_id = Column(Integer, ForeignKey('agents.id'))
    is_active = Column(Boolean, default=True)

class RoomCommand(Base):
    __tablename__ = "room_commands"

    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(Integer, ForeignKey("rooms.id"))
    command = Column(String, index=True)
    is_active = Column(Boolean, default=True)

    room = relationship("Room", back_populates="commands")

    