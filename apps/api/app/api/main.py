"""Router aggregator — combines every resource's routes into the one router
app/main.py mounts. Next hop: api/routes/{health,items,meetings}.py."""

from fastapi import APIRouter

from app.api.routes import health, items, meetings

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(items.router)
api_router.include_router(meetings.router)
