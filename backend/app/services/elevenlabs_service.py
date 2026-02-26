import os
import uuid
from pathlib import Path
from elevenlabs import ElevenLabs

client = ElevenLabs(api_key=os.getenv("ELEVENLABS_API_KEY"))

VOICE_REPLIES_DIR = Path("voice_replies")
VOICE_REPLIES_DIR.mkdir(exist_ok=True)

# You can change this to any ElevenLabs voice ID you prefer
# This is "Rachel" — calm, warm, professional
VOICE_ID = "21m00Tcm4TlvDq8ikWAM"

def generate_voice_reply(text: str) -> str:
    """
    Converts text to speech using ElevenLabs.
    Saves the MP3 and returns the file_id.
    """
    file_id = str(uuid.uuid4())
    output_path = VOICE_REPLIES_DIR / f"{file_id}.mp3"

    audio = client.text_to_speech.convert(
        voice_id=VOICE_ID,
        text=text,
        model_id="eleven_turbo_v2",  # fastest + highest quality
        output_format="mp3_44100_128",
    )

    with open(output_path, "wb") as f:
        for chunk in audio:
            f.write(chunk)

    return file_id