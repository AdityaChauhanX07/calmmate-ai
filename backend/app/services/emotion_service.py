from transformers import pipeline

classifier = pipeline(
    "text-classification",
    model="j-hartmann/emotion-english-distilroberta-base",
    return_all_scores=False
)

def analyze_emotion(text: str):
    """
    Returns the top predicted emotion and confidence.
    """
    if not text or text.strip() == "":
        return "neutral", 0.0

    result = classifier(text)[0]
    emotion = result["label"]
    confidence = result["score"]
    return emotion, confidence
