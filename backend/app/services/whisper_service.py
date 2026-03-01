import subprocess
from pathlib import Path
from groq import Groq
import logging
import os

UPLOAD_DIR = Path("uploaded_audio")
client = Groq(api_key=os.getenv("GROQ_API_KEY"))
logger = logging.getLogger(__name__)

MIN_DURATION_SECONDS = 1.0


def _get_audio_duration(filepath: Path) -> float | None:
    """Return duration in seconds via ffprobe, or None if it cannot be determined."""
    try:
        result = subprocess.run(
            [
                "ffprobe", "-v", "quiet",
                "-show_entries", "format=duration",
                "-of", "csv=p=0",
                str(filepath),
            ],
            capture_output=True,
            text=True,
            timeout=10,
        )
        return float(result.stdout.strip())
    except Exception as e:
        logger.warning(f"ffprobe duration check failed for {filepath}: {e}")
        return None


def transcribe_audio(filepath: str) -> str:
    webm_path = Path(filepath)

    duration = _get_audio_duration(webm_path)
    if duration is not None and duration < MIN_DURATION_SECONDS:
        raise ValueError("Recording too short - please speak for at least 1 second")

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