from fastapi import APIRouter
from app.api.routes import auth, records, contexts, graph, synergies, agents

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(records.router, prefix="/records", tags=["records"])
api_router.include_router(contexts.router, prefix="/contexts", tags=["contexts"])
api_router.include_router(graph.router, prefix="/graph", tags=["graph"])
api_router.include_router(synergies.router, prefix="/synergies", tags=["synergies"])
api_router.include_router(agents.router, prefix="/agents", tags=["agents"])
