import json
import asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from typing import List, AsyncGenerator
import os
from dotenv import load_dotenv
from openai import AsyncOpenAI

from chatgpt import get_ai_response

load_dotenv()

client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

app = FastAPI()

# Configuration CORS plus permissive
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        print(f"Broadcasting message: {message}")  # Log pour le débogage
        for connection in self.active_connections:
            await connection.send_json(message)

manager = ConnectionManager()

async def get_complete_ai_response(message: str) -> str:
    """
    Collecte la réponse complète de get_ai_response.
    """
    response = ""
    async for chunk in get_ai_response(message):
        response = chunk  # On récupère uniquement le contenu final à chaque itération, accumulé dans `get_ai_response`.
    return response


@app.websocket("/ws/{username}")
async def websocket_endpoint(websocket: WebSocket, username: str):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            try:
                message_data = json.loads(data)
                print(f"Received message from {username}: {message_data}")  # Log pour le débogage

                if 'event' in message_data and message_data['event'] == 'typing':
                    await manager.broadcast({
                        'event': 'typing',
                        'username': username
                    })
                elif 'event' in message_data and message_data['event'] == 'message':
                    user_message = message_data.get('message', '')

                    # Vérifie si "iaask" est dans le message
                    if "iaask" in user_message.lower():
                        # Demande à ChatGPT de générer une réponse sans bloquer l'événement

                        response = await get_complete_ai_response(user_message)

                        # Envoi du message complet après réception de la réponse entière
                        await manager.broadcast({
                            'event': 'message',
                            'id': f"{username}_{asyncio.get_event_loop().time()}",  # Génère un ID unique
                            'username': 'ChatGPT',
                            'message': response
                        })
                    else:
                        # Envoi du message standard si "iaask" n'est pas présent
                        await manager.broadcast({
                            'event': 'message',
                            'id': f"{username}_{asyncio.get_event_loop().time()}",  # Génère un ID unique
                            'username': username,
                            'message': user_message
                        })
            except json.JSONDecodeError:
                print(f"Received invalid JSON from {username}: {data}")  # Log pour le débogage
                # Fallback pour les messages en texte brut
                await manager.broadcast({
                    'event': 'message',
                    'id': f"{username}_{asyncio.get_event_loop().time()}",  # Génère un ID unique
                    'username': username,
                    'message': data
                })
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        await manager.broadcast({
            'event': 'message',
            'id': f"system_{asyncio.get_event_loop().time()}",  # Génère un ID unique
            'username': 'System',
            'message': f"{username} has left the chat."
        })

# Route de test pour vérifier que le serveur fonctionne
@app.get("/")
async def root():
    return {"message": "Hello World"}

# Route de test pour vérifier la configuration CORS
@app.options("/ws/{username}")
async def websocket_cors(username: str):
    return {}
