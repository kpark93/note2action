from app.repositories.protocols import Repositories
from .items import PostgresItemRepository
from .meetings import PostgresMeetingRepository
from .users import PostgresUserRepository


def build_postgres_repositories() -> Repositories:
    return Repositories(
        users=PostgresUserRepository(),
        items=PostgresItemRepository(),
        meetings=PostgresMeetingRepository(),
    )
