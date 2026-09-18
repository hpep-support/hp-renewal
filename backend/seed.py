import sys
import os

# Add backend directory to sys.path so we can import app
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine
from app.models.user import User
from app.models.invite import InviteCode
from app.core.security import hash_password

def seed():
    db = SessionLocal()
    
    # Check if admin already exists
    admin = db.query(User).filter(User.email == "admin@example.com").first()
    if not admin:
        admin = User(
            email="admin@example.com",
            display_name="Admin Owner",
            password_hash=hash_password("admin123"),
            role="owner"
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)
        print("Created Admin User:")
        print("Email: admin@example.com")
        print("Password: admin123")
    else:
        print("Admin user already exists.")

    # Generate an invite code for members
    invite = db.query(InviteCode).filter(InviteCode.created_by == admin.id).first()
    if not invite:
        invite = InviteCode(
            code="welcome-to-dao-2026",
            created_by=admin.id
        )
        db.add(invite)
        db.commit()
        print(f"Created Invite Code: {invite.code}")
    else:
        print(f"Existing Invite Code available: {invite.code}")

if __name__ == "__main__":
    seed()
