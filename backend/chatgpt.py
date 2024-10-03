import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

class ChatGPT:
    def __init__(self):
        self.model = "gpt-4"  # ou le modèle que vous souhaitez utiliser

    async def generate_response(self, message: str, command: str = None):
        system_prompt = self.get_command_prompt(command) if command else "You are a helpful AI assistant."
        
        response = client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": message}
            ],
            temperature=0.7,
        )
        return response.choices[0].message.content

    async def stream_response(self, message: str, agent_name: str, manager, room_name: str):
        system_prompt = f"You are {agent_name}, an AI assistant."
        
        stream = client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": message}
            ],
            temperature=0.7,
            stream=True,
        )

        partial_message = ""
        for chunk in stream:
            if chunk.choices[0].delta.content is not None:
                partial_message += chunk.choices[0].delta.content
                await manager.broadcast_partial(
                    partial_message, room_name, agent_name
                )

    def get_command_prompt(self, command: str) -> str:
        command_prompts = {
            "iask": "You are an intelligent AI assistant. Answer the following question concisely and accurately.",
            "iexplain": "You are an educational AI. Explain the following concept in simple terms, as if teaching a beginner.",
            "ianalyze": "You are an analytical AI. Provide a detailed analysis of the following topic, considering multiple perspectives.",
            # Add more commands and their corresponding prompts as needed
        }
        return command_prompts.get(command, "You are a helpful AI assistant.")