from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timezone

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from .models import Article
from .schemas import ArticleCreate, ArticleUpdate, ArticleResponse

router = APIRouter()

@router.post("", response_model=ArticleResponse)
def create_article(
    article_in: ArticleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_article = Article(
        user_id=current_user.id,
        title=article_in.title,
        body=article_in.body,
        category=article_in.category,
        is_published=article_in.is_published,
        published_at=datetime.now(timezone.utc) if article_in.is_published else None
    )
    db.add(db_article)
    db.commit()
    db.refresh(db_article)
    
    # Add author name to the response
    setattr(db_article, 'author_name', current_user.name)
    return db_article

@router.get("", response_model=List[ArticleResponse])
def get_my_articles(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    articles = db.query(Article).filter(Article.user_id == current_user.id).order_by(Article.created_at.desc()).all()
    
    for article in articles:
        setattr(article, 'author_name', current_user.name)
        
    return articles

@router.put("/{article_id}", response_model=ArticleResponse)
def update_article(
    article_id: int,
    article_in: ArticleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_article = db.query(Article).filter(Article.id == article_id, Article.user_id == current_user.id).first()
    if not db_article:
        raise HTTPException(status_code=404, detail="Article not found")

    update_data = article_in.model_dump(exclude_unset=True)
    
    # Handle publishing logic
    if 'is_published' in update_data:
        if update_data['is_published'] and not db_article.is_published:
            update_data['published_at'] = datetime.now(timezone.utc)
        elif not update_data['is_published']:
            update_data['published_at'] = None

    for field, value in update_data.items():
        setattr(db_article, field, value)

    db.commit()
    db.refresh(db_article)
    
    setattr(db_article, 'author_name', current_user.name)
    return db_article

@router.delete("/{article_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_article(
    article_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_article = db.query(Article).filter(Article.id == article_id, Article.user_id == current_user.id).first()
    if not db_article:
        raise HTTPException(status_code=404, detail="Article not found")
        
    db.delete(db_article)
    db.commit()
    return None

# Public endpoint for the News page
@router.get("/public", response_model=List[ArticleResponse])
def get_public_articles(db: Session = Depends(get_db)):
    articles = db.query(Article).filter(Article.is_published == True).order_by(Article.published_at.desc()).all()
    
    for article in articles:
        user = db.query(User).filter(User.id == article.user_id).first()
        author_name = user.name if user else "Unknown"
        setattr(article, 'author_name', author_name)
        
    return articles
