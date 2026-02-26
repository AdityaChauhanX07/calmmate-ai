from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import uuid
import os
import logging

from app.services.whisper_service import transcribe_audio
from app.services.emotion_service import analyze_emotion
from app.services.therapist import generate_therapist_reply
from app.services.elevenlabs_service import generate_voice_reply

router = APIRouter()
logger = logging.getLogger(__name__)

UPLOAD_FOLDER = "uploaded_audio"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


class SpeakRequest(BaseModel):
    text: str


@router.post("/upload_audio")
async def upload_audio(file: UploadFile = File(...)):
    try:
        if not file.filename.endswith((".webm", ".wav", ".mp3", ".ogg")):
            raise HTTPException(status_code=400, detail="Unsupported audio format")

        file_id = str(uuid.uuid4())
        filepath = os.path.join(UPLOAD_FOLDER, f"{file_id}.webm")

        with open(filepath, "wb") as f:
            f.write(await file.read())

        logger.info(f"Audio uploaded: {file_id}")
        return {"status": "success", "file_id": file_id}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Upload failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to upload audio")


@router.get("/analyze_audio/{file_id}")
async def analyze_audio(file_id: str):
    try:
        filepath = os.path.join(UPLOAD_FOLDER, f"{file_id}.webm")

        if not os.path.exists(filepath):
            raise HTTPException(status_code=404, detail="Audio file not found")

        # Step 1: Transcribe
        try:
            transcript = transcribe_audio(filepath)
        except Exception as e:
            logger.error(f"Transcription failed: {e}")
            raise HTTPException(status_code=500, detail="Transcription failed")

        if not transcript or transcript.strip() == "":
            raise HTTPException(status_code=422, detail="Could not transcribe audio — please speak clearly and try again")

        # Step 2: Emotion analysis
        try:
            emotion, confidence = analyze_emotion(transcript)
        except Exception as e:
            logger.error(f"Emotion analysis failed: {e}")
            emotion, confidence = "neutral", 0.0  # graceful fallback

        # Step 3: Therapist reply
        try:
            reply = generate_therapist_reply(transcript, emotion)
        except Exception as e:
            logger.error(f"Therapist reply failed: {e}")
            raise HTTPException(status_code=500, detail="Failed to generate therapist response")

        return {
            "transcript": transcript,
            "emotion": emotion,
            "confidence": confidence,
            "reply": reply,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Analysis pipeline failed: {e}")
        raise HTTPException(status_code=500, detail="Analysis failed unexpectedly")


@router.post("/speak")
async def speak(payload: SpeakRequest):
    try:
        if not payload.text.strip():
            raise HTTPException(status_code=400, detail="No text provided")

        file_id = generate_voice_reply(payload.text)
        logger.info(f"Voice reply generated: {file_id}")
        return {"file_id": file_id}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Voice generation failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate voice response")