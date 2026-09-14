import os
from google import genai
from google.genai import types
from app.core.config import get_settings

def extract_entities(text: str) -> str:
    """
    Extracts person names, organization names, and project names from the given text.
    Returns them as a comma-separated string.
    Returns an empty string if nothing is found or on error.
    """
    settings = get_settings()
    api_key = settings.gemini_api_key
    if not api_key or api_key == "your-gemini-api-key-here":
        return "[]"
        
    try:
        client = genai.Client(api_key=api_key)
        
        prompt = f"""
        Analyze the following text and extract the relationships between People and Projects/Organizations.
        Specifically, identify who belongs to which project or organization, or who is collaborating with whom.
        
        CRITICAL RULES FOR EXTRACTION:
        1. For People, extract their FULL NAME (e.g. "山田太郎", "Mateo Rios"). Do NOT extract job titles like "長" (director/chief) or just a first name if the full name is available in the text.
        2. For Projects/Organizations, extract the full formal name without trailing descriptions.
        
        Return ONLY a raw JSON array of objects representing these relationships. Do not include markdown formatting or backticks.
        Each object must have exactly two keys: "source" and "target".
        - "source": The FULL name of the Person
        - "target": The FULL name of the Project, Organization, or other Person they are related to
        
        Example output format:
        [
          {{"source": "Alice", "target": "DAOプロジェクト"}},
          {{"source": "Bob", "target": "Ethereum財団"}}
        ]
        
        If no such relationships exist in the text, return exactly the string "[]".
        
        Text:
        {text}
        """
        
        model_name = settings.gemini_model or "gemini-2.5-flash"
        
        response = client.models.generate_content(
            model=model_name,
            contents=prompt,
        )
        
        result = response.text.strip()
        # Clean up if the LLM still returns markdown blocks despite instructions
        if result.startswith("```json"):
            result = result[7:]
        if result.endswith("```"):
            result = result[:-3]
        result = result.strip()
        
        if result == "NONE" or not result:
            return "[]"
            
        return result
    except Exception as e:
        print(f"Error during LLM extraction: {e}")
        return "[]"
