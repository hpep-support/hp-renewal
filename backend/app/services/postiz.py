import httpx
import asyncio
from app.core.config import get_settings

settings = get_settings()

async def post_to_sns_via_postiz(content: str) -> dict:
    """
    Sends the content to Postiz API for multi-SNS delivery.
    In MVP, this mocks the response if API keys are not properly set,
    allowing the user to test the workflow without full Postiz setup.
    """
    api_url = settings.postiz_api_url
    api_key = settings.postiz_api_key

    # Mocking for MVP if no real API key is configured
    if not api_key or api_key == "your-postiz-api-key-here":
        print(f"[MOCK POSTIZ] Broadcasting to SNS: {content}")
        await asyncio.sleep(1) # Simulate network delay
        return {"status": "success", "mocked": True, "message": "Broadcasted via Mock Postiz"}

    # Actual HTTP call (example for a standard POST API)
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{api_url}/posts",
                headers={"Authorization": f"Bearer {api_key}"},
                json={"content": content, "platforms": ["twitter", "linkedin"]}
            )
            response.raise_for_status()
            return {"status": "success", "data": response.json()}
    except Exception as e:
        print(f"[POSTIZ ERROR] Failed to broadcast: {str(e)}")
        return {"status": "error", "message": str(e)}
