import subprocess
import uuid
from pathlib import Path

UPLOAD_DIR = Path("uploaded_audio")

def transcribe_audio(file):
    """
    Saves uploaded audio, runs ffmpeg → wav, sends to OpenAI Whisper API.
    """

    # Save raw upload
    file_id = str(uuid.uuid4())
    raw_path = UPLOAD_DIR / f"{file_id}.webm"

    with open(raw_path, "wb") as f:
        f.write(file.file.read())

    # Convert to WAV
    wav_path = UPLOAD_DIR / f"{file_id}.wav"
    subprocess.run(
        ["ffmpeg", "-i", str(raw_path), str(wav_path), "-y"],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )

    # Call Whisper API
    from openai import OpenAI
    client = OpenAI()

    transcript = client.audio.transcriptions.create(
        model="gpt-4o-mini-tts",  # OpenAI STT
        file=open(wav_path, "rb")
    )

    return transcript.text
