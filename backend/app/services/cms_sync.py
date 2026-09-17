import os
import requests
import logging

logger = logging.getLogger(__name__)

MICROCMS_SERVICE_DOMAIN = os.environ.get("MICROCMS_SERVICE_DOMAIN")
MICROCMS_API_KEY = os.environ.get("MICROCMS_API_KEY")

def sync_entity_to_cms(entity_id: int, entity_data: dict):
    """
    Syncs entity data to microCMS. 
    This acts as the bridge for Hermes pushing processed info to the public HP.
    """
    if not MICROCMS_SERVICE_DOMAIN or not MICROCMS_API_KEY:
        logger.warning("microCMS credentials not configured. Skipping sync.")
        return False

    url = f"https://{MICROCMS_SERVICE_DOMAIN}.microcms.io/api/v1/entities"
    headers = {
        "X-MICROCMS-API-KEY": MICROCMS_API_KEY,
        "Content-Type": "application/json"
    }

    try:
        # Check if it already exists (upsert logic could be implemented here)
        # For simplicity, we just send a POST request (creating a new entry)
        # In a real scenario, you'd check if `entity_id` is mapped to a microCMS ID
        response = requests.post(url, headers=headers, json=entity_data)
        response.raise_for_status()
        return True
    except Exception as e:
        logger.error(f"Failed to sync entity {entity_id} to microCMS: {e}")
        return False
