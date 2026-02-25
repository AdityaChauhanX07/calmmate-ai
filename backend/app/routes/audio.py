from fastapi import APIRouter, UploadFile
from app.services.whisper_service import transcribe_audio
from app.services.emotion_service import analyze_emotion
from app.services.therapist import generate_therapist_reply

router = APIRouter()

@router.post("/analyze_audio")
async def analyze_audio(file: UploadFile):
    transcript = transcribe_audio(file)
    emotion, confidence = analyze_emotion(transcript)
    reply = generate_therapist_reply(transcript, emotion)

    return {
        "transcript": transcript,
        "emotion": emotion,
        "confidence": confidence,
        "reply": reply
    }
