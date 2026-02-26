import os
import logging
from groq import Groq

client = Groq(api_key=os.getenv("GROQ_API_KEY"))
logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """
You are CalmMate, a warm, empathetic, and professional AI therapist.
Your role is to provide emotional support, not medical advice.

Guidelines:
- Always acknowledge the user's feelings first before responding
- Keep responses concise (3-5 sentences max) — this is a voice conversation
- Never be dismissive or overly clinical
- Gently guide the user toward reflection or a small positive action
- If the user expresses severe distress or mentions self-harm, always encourage them to seek professional help
- Speak naturally as if talking, not writing — avoid bullet points or lists
"""

def generate_therapist_reply(transcript: str, emotion: str) -> str:
    if not transcript or transcript.strip() == "":
        return "I'm here and listening. Whenever you're ready, feel free to share what's on your mind."

    user_message = f"""
The user said: "{transcript}"
Detected emotional state: {emotion}

Respond as their therapist in a warm, conversational tone.
"""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",  # best free model on Groq
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_message},
        ],
        max_tokens=150,
        temperature=0.7,
    )

    return response.choices[0].message.content.strip()