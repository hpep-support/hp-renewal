import google.generativeai as genai
import json
import time
from functools import wraps
from app.core.config import get_settings

settings = get_settings()

if settings.gemini_api_key:
    genai.configure(api_key=settings.gemini_api_key)

generation_config = {
  "temperature": 0.2,
  "top_p": 0.95,
  "top_k": 40,
  "max_output_tokens": 8192,
  "response_mime_type": "application/json",
}

def retry_with_backoff(max_retries=5, initial_delay=2, backoff_factor=2):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            delay = initial_delay
            for attempt in range(max_retries):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    error_msg = str(e)
                    if "503" in error_msg or "429" in error_msg or "ServiceUnavailable" in error_msg:
                        if attempt < max_retries - 1:
                            print(f"API Retry (attempt {attempt+1}/{max_retries}) due to error: {error_msg}. Waiting {delay}s...")
                            time.sleep(delay)
                            delay *= backoff_factor
                            continue
                    raise e
        return wrapper
    return decorator

@retry_with_backoff(max_retries=5, initial_delay=3, backoff_factor=2)
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
    
    response = model.generate_content(prompt)
    tags = json.loads(response.text)
    if isinstance(tags, list):
        return [str(t) for t in tags]
    return []

@retry_with_backoff(max_retries=5, initial_delay=3, backoff_factor=2)
def call_llm(prompt: str) -> str:
    """Generic function to call the LLM with a given prompt."""
    if not settings.gemini_api_key:
        return ""
    
    model = genai.GenerativeModel(
        model_name=settings.gemini_model,
        generation_config=generation_config,
    )
    
    response = model.generate_content(prompt)
    return response.text

@retry_with_backoff(max_retries=5, initial_delay=3, backoff_factor=2)
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
    
    CRITICAL: The "agent_type" and "reason" MUST be written in the same language as the entities in Text A and Text B. For example, if Text A and Text B are in Japanese, output the reason and agent_type in Japanese (e.g., "コミュニティマネージャー", "両者ともにWeb3の教育に関心があります").
    
    Return ONLY a JSON object with the following keys:
    - "agent_type": The string representing the persona.
    - "reason": A brief explanation of the synergy (2-3 sentences).
    - "score": The float value of the synergy score.
    
    Example: {{"agent_type": "Technical Architect", "reason": "Both projects utilize blockchain for supply chain, allowing for shared smart contracts.", "score": 0.85}}
    
    Text A: {text_a}
    Text B: {text_b}
    """
    
    response = model.generate_content(prompt)
    data = json.loads(response.text)
    return {
        "score": float(data.get("score", 0.0)),
        "agent_type": str(data.get("agent_type", "AI Evaluator")),
        "reason": str(data.get("reason", "No reason provided."))
    }
