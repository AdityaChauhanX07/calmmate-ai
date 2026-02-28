# CalmMate AI

A voice-based mental wellness app I built to experiment with combining several AI APIs into something actually useful. You speak, it listens, figures out how you're feeling, and responds like a therapist with voice.

## What it does

Record yourself talking about whatever's on your mind. The app transcribes it, detects your emotional state, generates a therapist-style response, and reads it back to you. It also tracks your emotional patterns over time so you can see trends.

## Stack

**Frontend:** Next.js 14, TypeScript, Tailwind CSS, NextAuth.js  
**Backend:** Python, FastAPI  
**AI/ML:** Groq Whisper (transcription), DistilRoBERTa (emotion detection), LLaMA 3.3 70B via Groq (therapist responses), ElevenLabs (text-to-speech)  
**Database:** PostgreSQL via Supabase, Prisma ORM

## Getting it running locally

You'll need API keys for Groq, ElevenLabs, and either a Supabase project or your own Postgres instance.

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
```

Create `backend/.env`:
```
GROQ_API_KEY=your_key
ELEVENLABS_API_KEY=your_key
```
```bash
uvicorn app.main:app --reload
```

### Frontend
```bash
cd frontend/nextjs-app
npm install
```

Create `frontend/nextjs-app/.env.local`:
```
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate_a_random_string
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_secret
DATABASE_URL=your_postgres_connection_string
```
```bash
npx prisma db push
npx prisma generate
npm run dev
```

Open `http://localhost:3000`.

## Known issues / TODO

- Audio files are not cleaned up automatically from the server yet, they accumulate in `uploaded_audio/`
- The emotion model sometimes misclassifies short or ambiguous speech
- No mobile app yet, just browser
- Deployment docs are still WIP

## How the pipeline works

1. Browser records audio via MediaRecorder API
2. Audio blob uploaded to FastAPI backend
3. ffmpeg converts webm to wav
4. Groq Whisper transcribes the audio
5. DistilRoBERTa classifies emotion from the transcript
6. LLaMA 3.3 70B generates a therapist response
7. ElevenLabs converts the response to speech
8. Frontend plays the audio back and saves the session to the database

## Notes

The emotion detection is text-based, not audio-based. It analyzes what you said, not how you said it (tone, pitch, etc.). That is a meaningful limitation worth knowing about. True prosody analysis would need a different model architecture.

Built this mostly to learn FastAPI and Next.js together and see how well these AI APIs play with each other. Turns out pretty well.
