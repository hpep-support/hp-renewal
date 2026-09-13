from typing import Generator
from fastapi import Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user, require_owner
from app.models.user import User

def get_db_session() -> Generator:
    yield from get_db()
