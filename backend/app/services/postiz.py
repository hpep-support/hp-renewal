import httpx
from app.core.config import get_settings

settings = get_settings()

async def publish_to_postiz(body: str) -> bool:
    """Send text to Postiz for multi-SNS publishing."""
    if not settings.postiz_api_url or not settings.postiz_api_key:
        print("Postiz not configured. Skipping SNS distribution.")
        return False
        
    url = f"{settings.postiz_api_url}/posts"
    headers = {
        "Authorization": f"Bearer {settings.postiz_api_key}",
        "Content-Type": "application/json"
    }
    # Mocking Postiz payload structure based on typical Gitroom/Postiz API
    payload = {
        "content": body,
        "type": "text"
        # additional details like scheduled_time could be added
    }
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(url, headers=headers, json=payload)
            if response.status_code in (200, 201):
                return True
            else:
                print(f"Failed to publish to Postiz: {response.status_code} {response.text}")
                return False
    except Exception as e:
        print(f"Error calling Postiz: {e}")
        return False
