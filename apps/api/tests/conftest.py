"""Shared test setup — pytest loads this file automatically for every test."""

import pytest

import app.main as main_module
from app.repository import InMemoryItemRepository


@pytest.fixture(autouse=True)
def fresh_repository() -> None:
    """Give every test its own in-memory repository, regardless of .env.

    autouse: runs before each test without being asked for by name. A fresh
    fake per test means no test can poison another's data (e.g. a delete
    test shrinking the list a later test counts).
    """
    main_module.repository = InMemoryItemRepository()
