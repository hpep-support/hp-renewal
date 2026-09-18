# AI DAO Community Platform (MVP)

A centralized platform for community posts and notes with AI synergy detection.

## Features

- **Centralized Records**: Post and manage text records.
- **Disclosure Levels**: Choose between Private, Community, or Public (SNS).
- **AI Synergy Detection**: Automated matching and scoring of member records using Gemini AI.
- **Context Awareness**: Community owners can add As-Is/To-Be minutes to guide the AI.
- **Multi-SNS Publishing**: Integration with Postiz for Level 3 public posts.

## Setup Instructions

### 1. Environment Variables
Copy `.env.example` to `.env` and fill in the required keys (especially `GEMINI_API_KEY`).

### 2. Running Locally (Docker Compose)
Start the PostgreSQL database:
```bash
docker compose up -d db
```

Run database migrations:
```bash
cd backend
# Make sure you have uvicorn and alembic installed locally, or run via Docker.
alembic upgrade head
```

Start the Backend API:
```bash
cd backend
uvicorn app.main:app --reload
```

Start the Frontend (Next.js):
```bash
cd frontend
npm run dev
```

### 3. Usage
1. Owner creates the first account manually or directly via DB.
2. Owner creates Invite Codes via `/api/auth/admin/invite`.
3. Members register using the invite codes.

## Tech Stack
- Frontend: Next.js 14 (App Router) + Vanilla CSS (Dark Mode)
- Backend: FastAPI (Python) + SQLAlchemy
- Database: PostgreSQL
- AI: Google Gemini API
