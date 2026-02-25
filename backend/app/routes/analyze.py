from fastapi import APIRouter
from fastapi.responses import JSONResponse
import os
from app.emotion.transcription import transcribe_audio
from app.emotion.emotion_model import analyze_emotion

router = APIRouter()

AUDIO_FOLDER = "uploaded_audio"

@router.get("/analyze_audio/{file_id}")
async def analyze_audio(file_id: str):
    filepath = os.path.join(AUDIO_FOLDER, f"{file_id}.webm")

    if not os.path.exists(filepath):
        return JSONResponse({"error": "file not found"}, status_code=404)

    # Step 1: Transcribe
    transcript = transcribe_audio(filepath)

    # Step 2: Analyze emotion
    emotion, confidence = analyze_emotion(transcript)

    return {
        "file_id": file_id,
        "transcript": transcript,
        "emotion": emotion,
        "confidence": confidence
    }
