import asyncio
from app.core.database import SessionLocal
from app.models.community import Community
from app.models.user import User

def create_hpep():
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == "admin@example.com").first()
        if not user:
            print("Admin user not found")
            return
            
        community = db.query(Community).filter(Community.name == "HPEP").first()
        if not community:
            community = Community(name="HPEP", owner_id=user.id)
            db.add(community)
            db.commit()
            print("Community HPEP created successfully!")
        else:
            print("Community HPEP already exists.")
    finally:
        db.close()

if __name__ == "__main__":
    create_hpep()
