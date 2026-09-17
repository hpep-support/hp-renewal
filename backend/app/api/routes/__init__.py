from fastapi import APIRouter
from app.api.routes import auth, records, contexts, synergies, invites, graph_preferences, communities
from app.plugins.blog.routes import router as blog_router

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(records.router, prefix="/records", tags=["records"])
api_router.include_router(contexts.router, prefix="/contexts", tags=["contexts"])
api_router.include_router(synergies.router, prefix="/synergies", tags=["synergies"])
api_router.include_router(invites.router, prefix="/invites", tags=["invites"])
api_router.include_router(graph_preferences.router, prefix="/preferences", tags=["preferences"])
api_router.include_router(communities.router, prefix="/communities", tags=["communities"])
api_router.include_router(blog_router, prefix="/blog", tags=["blog"])
