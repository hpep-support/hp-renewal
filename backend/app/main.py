from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import get_settings
from app.api.routes import users, records, synergies, contexts, invites, graph_preferences, entities, agents

settings = get_settings()

app = FastAPI(
    title="AI DAO Utility MVP API",
    version="1.0.0",
    openapi_url="/api/v1/openapi.json"
)

# Set all CORS enabled origins
if settings.cors_origins_list:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

app.include_router(users.router, prefix="/api")
app.include_router(records.router, prefix="/api")
app.include_router(synergies.router, prefix="/api")
app.include_router(contexts.router, prefix="/api")
app.include_router(invites.router, prefix="/api")
app.include_router(graph_preferences.router, prefix="/api")
app.include_router(entities.router, prefix="/api")
app.include_router(agents.router, prefix="/api")

@app.get("/health")
def health_check():
    return {"status": "ok"}
