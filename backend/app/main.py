from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.routes.voice import router as voice_router
import logging
import os

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)

app = FastAPI(title="CalmMate AI Voice Therapist")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve generated voice reply MP3s as static files
os.makedirs("voice_replies", exist_ok=True)
app.mount("/voice_replies", StaticFiles(directory="voice_replies"), name="voice_replies")

app.include_router(voice_router)

@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "CalmMate backend running"}