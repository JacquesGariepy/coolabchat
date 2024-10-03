# backend/agent_manager.py
import json
import re
from typing import List, Dict
from fastapi import WebSocket
from models import Agent
from database import SessionLocal
from chatgpt import ChatGPT

class AgentManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}  # room_name -> List[WebSocket]
        self.chatgpt = ChatGPT()

    async def connect(self, websocket: WebSocket, room_name: str, user):
        await websocket.accept()
        if room_name not in self.active_connections:
            self.active_connections[room_name] = []
        self.active_connections[room_name].append(websocket)

    def disconnect(self, websocket: WebSocket, room_name: str):
        self.active_connections[room_name].remove(websocket)

    async def broadcast(self, message: str, room_name: str, username: str):
        data = {"message": message, "username": username}
        for connection in self.active_connections.get(room_name, []):
            await connection.send_text(json.dumps(data))

    async def broadcast_partial(self, message: str, room_name: str, username: str):
        data = {"message": message, "username": username, "partial": True}
        for connection in self.active_connections.get(room_name, []):
            await connection.send_text(json.dumps(data))

    async def broadcast_typing(self, room_name: str, username: str):
        data = {"event": "typing", "username": username}
        for connection in self.active_connections.get(room_name, []):
            await connection.send_text(json.dumps(data))

    async def handle_triggers(self, message: str, room_name: str, username: str):
        db = SessionLocal()
        agents = db.query(Agent).filter(Agent.is_active == True).all()

        # Check for commands
        command_match = re.match(r'^i(\w+)\((.*)\)$', message)
        if command_match:
            command, question = command_match.groups()
            response = await self.chatgpt.generate_response(question, command)
            await self.broadcast(response, room_name, f"AI_{command.capitalize()}")
        else:
            # Rechercher les mentions d'agents
            for word in message.split():
                if word.startswith("@"):
                    agent_name = word[1:]
                    agent = db.query(Agent).filter(Agent.name == agent_name).first()
                    if not agent:
                        # Auto-générer l'agent si non existant
                        self.auto_generate_agent(agent_name)
                        agent = db.query(Agent).filter(Agent.name == agent_name).first()

                    user_message = message.replace(f"@{agent_name}", "").strip()
                    await self.chatgpt.stream_response(user_message, agent.name, self, room_name)
        db.close()

    def auto_generate_agent(self, trigger_word: str):
        db = SessionLocal()
        # Vérifier si un agent avec le nom du trigger existe déjà
        existing_agent = db.query(Agent).filter(Agent.name == trigger_word).first()
        if not existing_agent:
            new_agent = Agent(
                name=trigger_word,
                personality="Généré automatiquement",
                context="",
                is_active=True
            )
            db.add(new_agent)
            db.commit()
            db.refresh(new_agent)
        db.close()
