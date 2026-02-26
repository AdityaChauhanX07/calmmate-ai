import subprocess
from pathlib import Path
from groq import Groq
import logging
import os

UPLOAD_DIR = Path("uploaded_audio")
client = Groq(api_key=os.getenv("GROQ_API_KEY"))
logger = logging.getLogger(__name__)

def transcribe_audio(filepath: str) -> str:
    webm_path = Path(filepath)

    # Try sending webm directly first (Groq supports it)
    try:
        with open(webm_path, "rb") as audio_file:
            transcription = client.audio.transcriptions.create(
                model="whisper-large-v3-turbo",
                file=(webm_path.name, audio_file, "audio/webm"),
                response_format="text"
            )
        logger.info("Transcription succeeded directly from webm")
        return transcription

    except Exception as e:
        logger.warning(f"Direct webm failed, trying wav conversion: {e}")

    # Fallback: convert to wav
    wav_path = webm_path.with_suffix(".wav")
    result = subprocess.run(
        ["ffmpeg", "-i", str(webm_path), "-ar", "16000", "-ac", "1", str(wav_path), "-y"],
        capture_output=True,
        text=True
    )

    logger.info(f"ffmpeg return code: {result.returncode}")

    if not wav_path.exists():
        raise RuntimeError(f"ffmpeg failed. stderr: {result.stderr}")

    with open(wav_path, "rb") as audio_file:
        transcription = client.audio.transcriptions.create(
            model="whisper-large-v3-turbo",
            file=audio_file,
            response_format="text"
        )

    return transcription