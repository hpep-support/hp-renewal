from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ArticleBase(BaseModel):
    title: str
    body: str
    category: Optional[str] = None
    is_published: bool = False

class ArticleCreate(ArticleBase):
    pass

class ArticleUpdate(BaseModel):
    title: Optional[str] = None
    body: Optional[str] = None
    category: Optional[str] = None
    is_published: Optional[bool] = None

class ArticleResponse(ArticleBase):
    id: int
    user_id: int
    published_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    # Optional field for the author's name
    author_name: Optional[str] = None

    class Config:
        from_attributes = True
