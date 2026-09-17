import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal
from app.services.agents.time_resolver import TimeResolverAgent
from app.services.agents.error_corrector import ErrorCorrectorAgent
from dotenv import load_dotenv

load_dotenv()

def run_hermes():
    print("🚀 Starting Hermes Agents...")
    db = SessionLocal()
    try:
        # Run Time Resolver
        print("🕒 Running Time Resolver...")
        time_resolver = TimeResolverAgent(db)
        time_resolver.run()
        
        # Run Error Corrector
        print("🔍 Running Error Corrector...")
        error_corrector = ErrorCorrectorAgent(db)
        error_corrector.run()
        
        print("✅ Hermes Agents finished.")
    finally:
        db.close()

if __name__ == "__main__":
    run_hermes()
