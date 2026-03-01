import json
import os
from groq import Groq

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

SYSTEM_PROMPT = (
    'You are an emotion classifier. Analyze the text and respond with ONLY a JSON object '
    'in this exact format: {"emotion": "joy", "confidence": 0.85}. '
    'The emotion must be one of: joy, sadness, anger, fear, surprise, disgust, neutral. '
    'Confidence must be between 0 and 1.'
)

def analyze_emotion(text: str) -> dict:
    if not text or text.strip() == "":
        return {"emotion": "neutral", "confidence": 0.5}

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": text},
            ],
            temperature=0,
        )
        content = response.choices[0].message.content
        result = json.loads(content)
        return {"emotion": str(result["emotion"]), "confidence": float(result["confidence"])}
    except Exception:
        return {"emotion": "neutral", "confidence": 0.5}
