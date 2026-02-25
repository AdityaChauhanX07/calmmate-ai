from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.audio import router as audio_router
from app.routes.analyze import router as analyze_router
from app.routes.voice import router as voice_router

app = FastAPI(title="CalmMate AI Voice Therapist")

# Allow frontend (localhost:3000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(audio_router)
app.include_router(analyze_router)
app.include_router(voice_router)

@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "CalmMate backend running"}
