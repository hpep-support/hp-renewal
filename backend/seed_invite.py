import sys
import os

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal
from app.models.invite import InviteCode
from app.models.user import User
from app.core.security import hash_password

def seed():
    db = SessionLocal()
    
    # Check if there's already an owner
    owner = db.query(User).filter(User.role == "owner").first()
    if not owner:
        owner = User(
            email="admin@example.com",
            display_name="Admin",
            password_hash=hash_password("adminpass"),
            role="owner"
        )
        db.add(owner)
        db.commit()
        db.refresh(owner)
        print("Created default owner account: admin@example.com / adminpass")

    # Create an invite code
    invite = InviteCode(
        code="WELCOME2026",
        created_by=owner.id
    )
    db.add(invite)
    db.commit()
    print("Created invite code: WELCOME2026")
    db.close()

if __name__ == "__main__":
    seed()
