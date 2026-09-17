from app.models.user import User
from app.models.record import Record
from app.models.synergy import SynergyCandidate
from app.models.context import Context
from app.models.invite import InviteCode
from app.models.graph_preference import GraphPreference
from app.models.entity import Entity
from app.models.community import Community
from app.models.agent_proposal import AgentProposal
from app.models.triple import Triple

from app.plugins.blog.models import Article

# For Alembic to discover all models
__all__ = ["User", "Record", "SynergyCandidate", "Context", "InviteCode", "GraphPreference", "Entity", "Community", "Article", "AgentProposal", "Triple"]

