import whisper

# Load model only once (faster)
model = whisper.load_model("base")  # use "small" for more accuracy

def transcribe_audio(filepath: str) -> str:
    result = model.transcribe(filepath)
    return result["text"].strip()
