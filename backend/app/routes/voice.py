from fastapi import APIRouter, UploadFile, File
from fastapi.responses import JSONResponse
import uuid
import os
from app.services.therapist import generate_therapist_reply
from app.services.stt import transcribe_audio, detect_emotion   # <-- you already have these
from app.services.voice import generate_voice_reply            # <-- your TTS system

router = APIRouter()

UPLOAD_FOLDER = "uploaded_audio"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# ===========================
# 1) Upload raw audio file
# ===========================
@router.post("/upload_audio")
async def upload_audio(file: UploadFile = File(...)):
    file_id = str(uuid.uuid4())
    filename = f"{file_id}.webm"
    filepath = os.path.join(UPLOAD_FOLDER, filename)

    with open(filepath, "wb") as f:
        f.write(await file.read())

    return {"status": "success", "file_id": file_id}


# ===========================
# 2) Analyze Audio
# ===========================
@router.get("/analyze_audio/{file_id}")
async def analyze_audio(file_id: str):
    path = f"uploaded_audio/{file_id}.webm"

    transcript = transcribe_audio(path)
    emotion, confidence = detect_emotion(transcript)

    # Therapist reply (text)
    reply = generate_therapist_reply(transcript, emotion)

    return {
        "transcript": transcript,
        "emotion": emotion,
        "confidence": confidence,
        "reply": reply
    }


# ===========================
# 3) SPEAK endpoint (generate AI voice)
# ===========================
@router.post("/speak")
async def speak(payload: dict):
    text = payload.get("text", "")

    file_id = generate_voice_reply(text)  # returns uuid of mp3 file saved

    return {"file_id": file_id}
