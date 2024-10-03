# backend/chatgpt.py
import os
import openai
from dotenv import load_dotenv
from sqlalchemy.orm import Session
from database import SessionLocal
from models import Agent

load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")

class ChatGPT:
    def __init__(self):
        self.model = "gpt-4"

    def get_agent_prompt(self, agent_name: str) -> str:
        db = SessionLocal()
        agent = db.query(Agent).filter(Agent.name == agent_name).first()
        db.close()
        if agent:
            return f"You are {agent_name}. Personality: {agent.personality}. Context: {agent.context}"
        return f"You are {agent_name}, an AI assistant."

    async def stream_response(self, message: str, agent_name: str, manager, room_name: str):
        system_prompt = self.get_agent_prompt(agent_name)
        
        response = openai.ChatCompletion.create(
            model=self.model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": message}
            ],
            temperature=0.7,
            stream=True,
        )

        partial_message = ""
        for chunk in response:
            if "choices" in chunk:
                delta = chunk["choices"][0]["delta"]
                content = delta.get("content", "")
                partial_message += content
                await manager.broadcast_partial(
                    partial_message, room_name, agent_name
                )

    async def generate_response(self, message: str, command: str = None):
        system_prompt = self.get_command_prompt(command) if command else "You are a helpful AI assistant."
        
        response = openai.ChatCompletion.create(
            model=self.model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": message}
            ],
            temperature=0.7,
        )
        return response.choices[0].message['content']

    def get_command_prompt(self, command: str) -> str:
        command_prompts = {
            "iask": "You are an intelligent AI assistant. Answer the following question concisely and accurately.",
            "iexplain": "You are an educational AI. Explain the following concept in simple terms, as if teaching a beginner.",
            "ianalyze": "You are an analytical AI. Provide a detailed analysis of the following topic, considering multiple perspectives.",
            # Add more commands and their corresponding prompts as needed
        }
        return command_prompts.get(command, "You are a helpful AI assistant.")