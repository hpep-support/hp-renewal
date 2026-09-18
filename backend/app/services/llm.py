import google.generativeai as genai
import json
from app.core.config import get_settings

settings = get_settings()

if settings.gemini_api_key:
    genai.configure(api_key=settings.gemini_api_key)

generation_config = {
  "temperature": 0.2,
  "top_p": 0.95,
  "top_k": 40,
  "max_output_tokens": 1024,
  "response_mime_type": "application/json",
}

def extract_tags(text: str) -> list[str]:
    """Extract keywords and themes from a post/memo."""
    if not settings.gemini_api_key:
        return []
    
    model = genai.GenerativeModel(
        model_name=settings.gemini_model,
        generation_config=generation_config,
    )
    
    prompt = f"""
    Extract 3 to 5 key themes or tags from the following text.
    Return ONLY a JSON array of strings, for example: ["tag1", "tag2", "tag3"].
    
    Text:
    {text}
    """
    
    try:
        response = model.generate_content(prompt)
        tags = json.loads(response.text)
        if isinstance(tags, list):
            return [str(t) for t in tags]
        return []
    except Exception as e:
        print(f"Error extracting tags: {e}")
        return []

def calculate_synergy_score(text_a: str, text_b: str, context: str = "") -> dict:
    """Calculate the synergy score between two texts using Gemini."""
    if not settings.gemini_api_key:
        return {"score": 0.0, "agent_type": "None", "reason": "API Key missing"}
    
    model = genai.GenerativeModel(
        model_name=settings.gemini_model,
        generation_config=generation_config,
    )
    
    prompt = f"""
    You are an AI tasked with finding potential synergies between two contexts in a community.
    Analyze the relationship and potential synergy between Text A and Text B.
    Consider the following community context: {context if context else 'None'}
    
    1. Decide on a suitable "agent_type" (a persona) that would best identify this synergy (e.g., "Business Strategist", "Technical Architect", "Community Matchmaker", "Marketing Expert").
    2. Explain the specific reason for the synergy.
    3. Rate the synergy score from 0.0 (completely unrelated) to 1.0 (highly synergistic, complementary, or perfectly aligned).
    
    Return ONLY a JSON object with the following keys:
    - "agent_type": The string representing the persona.
    - "reason": A brief explanation of the synergy (2-3 sentences).
    - "score": The float value of the synergy score.
    
    Example: {{"agent_type": "Technical Architect", "reason": "Both projects utilize blockchain for supply chain, allowing for shared smart contracts.", "score": 0.85}}
    
    Text A: {text_a}
    Text B: {text_b}
    """
    
    try:
        response = model.generate_content(prompt)
        data = json.loads(response.text)
        return {
            "score": float(data.get("score", 0.0)),
            "agent_type": str(data.get("agent_type", "AI Evaluator")),
            "reason": str(data.get("reason", "No reason provided."))
        }
    except Exception as e:
        print(f"Error calculating synergy: {e}")
        return {"score": 0.0, "agent_type": "Error", "reason": str(e)}
