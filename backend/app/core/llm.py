import os
from google import genai
from google.genai import types
from app.core.config import get_settings

from typing import Optional
import base64
import re

def extract_entities(text: str, image_base64: Optional[str] = None) -> str:
    """
    Extracts person names, organization names, and project names from the given text and/or image.
    Returns them as a JSON array string.
    Returns an empty string if nothing is found or on error.
    """
    settings = get_settings()
    api_key = settings.gemini_api_key
    if not api_key or api_key == "your-gemini-api-key-here":
        return "[]"
        
    try:
        client = genai.Client(api_key=api_key)
        
        prompt = f"""
        Analyze the following text and extract People, Projects, and Organizations, along with any relationships between them.
        
        CRITICAL RULES FOR EXTRACTION:
        1. For People, extract their FULL NAME (e.g. "山田太郎", "Mateo Rios"). Do NOT extract job titles like "長" (director/chief) or just a first name if the full name is available in the text.
        2. For Projects/Organizations, extract the full formal name without trailing descriptions.
        3. Infer implicit relationships. For example, if the text is "司法書士 行政書士 長谷川秀夫事務所", you should extract source="長谷川秀夫" and target="長谷川秀夫事務所".
        4. ALL Entities mentioned must be extracted. If a standalone Person, Project, or Organization is mentioned without any clear relationships (e.g. "長谷川秀夫さんについて"), extract the entity as the "source" and use a descriptive generic category as the "target" (e.g., "Member", "Professional", "Organization", "Project"). DO NOT return an empty list if valid entities exist in the text.
        5. NORMALIZATION (CRITICAL FOR LINKING):
           - You MUST normalize all Japanese person names by completely removing ANY spaces between the family name and given name (e.g., "山田 太郎" -> "山田太郎", "長谷川 秀夫" -> "長谷川秀夫").
           - You MUST normalize English/alphabetic names to standard Title Case with exactly one space (e.g., "mateo rios" or "Mateo  Rios" -> "Mateo Rios").
           - Always output the normalized string.
        6. KNOWN ALIASES:
           - "Hideo Hasegawa" MUST be normalized to "長谷川秀夫".
           - Translate romaji names to their known Japanese kanji equivalents if they refer to the same person in the context of this community.
        
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
        
        contents = []
        if image_base64:
            try:
                mime_type = "image/jpeg"
                b64_data = image_base64
                match = re.match(r"data:(image/\w+);base64,(.+)", image_base64)
                if match:
                    mime_type = match.group(1)
                    b64_data = match.group(2)
                    
                img_bytes = base64.b64decode(b64_data)
                contents.append(types.Part.from_bytes(data=img_bytes, mime_type=mime_type))
            except Exception as e:
                print(f"Error parsing image: {e}")
        
        contents.append(prompt)
        
        model_name = settings.gemini_model or "gemini-2.5-flash"
        
        response = client.models.generate_content(
            model=model_name,
            contents=contents,
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
