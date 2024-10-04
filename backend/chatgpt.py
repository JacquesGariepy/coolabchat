from typing import AsyncGenerator

from dotenv import load_dotenv
from openai import AsyncOpenAI

load_dotenv()

client = AsyncOpenAI()

async def get_ai_response(message: str) -> AsyncGenerator[str, None]:
    """
    OpenAI Response
    """
    response = await client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a helpful assistant, skilled in explaining "
                    "complex concepts in simple terms."
                ),
            },
            {
                "role": "user",
                "content": message,
            },
        ],
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