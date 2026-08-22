"""Router aggregator — combines every resource's routes into one router.

Imported by app/main.py (app.include_router(api_router)); collects the
routers defined in app/api/routes/.
Path: app/main.py → [this file] → api/routes/{health,items,meetings}.py.
"""

from fastapi import APIRouter

from app.api.routes import health, items, meetings

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(items.router)
api_router.include_router(meetings.router)
