"""Auth middleware + per-user data isolation. The bearer token in tests IS the
Clerk user id (conftest.FakeVerifier), so another user = another header."""

import app.main as main_module
import pytest
from app.core.security import VerifiedUser, identity_from_claims
from app.main import app
from fastapi.testclient import TestClient
from jwt.exceptions import InvalidTokenError

from tests.conftest import AUTH

client = TestClient(app, headers=AUTH)

# A second account: valid token, brand-new user, owns nothing.
STRANGER = {"Authorization": "Bearer user_stranger"}


def test_identity_from_claims_reads_sub_and_optional_name() -> None:
    claims = {"sub": "user_1", "name": "Jane Doe", "exp": 9999999999}
    assert identity_from_claims(claims) == VerifiedUser("user_1", "Jane Doe")

    # The name claim is optional — absent or blank means "token doesn't say".
    assert identity_from_claims({"sub": "user_1"}).name is None
    assert identity_from_claims({"sub": "user_1", "name": "   "}).name is None

    # But a token without a subject proves nothing — reject it.
    with pytest.raises(InvalidTokenError):
        identity_from_claims({"name": "Jane Doe"})


def test_name_claim_flows_from_token_to_user_record() -> None:
    named = {"Authorization": "Bearer user_named|Priya Shah"}
    assert client.get("/api/items?view=review", headers=named).status_code == 200

    users = main_module.app.state.repositories.users
    user_id = users.get_or_create_user("user_named", None)
    assert users.state.user_names[user_id] == "Priya Shah"


def test_health_is_public() -> None:
    response = client.get("/api/health", headers={"Authorization": ""})
    assert response.status_code == 200


def test_missing_token_is_401() -> None:
    response = client.get("/api/items", headers={"Authorization": ""})
    assert response.status_code == 401
    assert response.headers["WWW-Authenticate"] == "Bearer"


def test_garbage_token_is_401() -> None:
    response = client.get(
        "/api/items", headers={"Authorization": "Bearer nonsense"}
    )
    assert response.status_code == 401


def test_users_only_see_their_own_items() -> None:
    # The seeded user owns the two seed items; a stranger owns nothing.
    assert len(client.get("/api/items?view=review").json()["items"]) == 2
    assert (
        client.get("/api/items?view=review", headers=STRANGER).json()["items"]
        == []
    )


def test_strangers_cannot_touch_someone_elses_item() -> None:
    # Same status as a nonexistent row — existence itself is private.
    patch = client.patch(
        "/api/items/1", json={"status": "Done"}, headers=STRANGER
    )
    assert patch.status_code == 404
    assert client.delete("/api/items/1", headers=STRANGER).status_code == 404

    # And the batch save touches nothing of theirs.
    save = client.post("/api/items/save-to-tasks", headers=STRANGER)
    assert save.json() == {"updated": 0}

    # The rightful owner's item is untouched by all of the above.
    items = client.get("/api/items?view=review").json()["items"]
    assert {item["id"] for item in items} == {1, 2}
    assert all(not item["saved"] for item in items)


def test_meetings_are_scoped_per_user() -> None:
    assert (
        client.get("/api/meetings", headers=STRANGER).json()["meetings"] == []
    )
    assert client.get("/api/meetings/1", headers=STRANGER).status_code == 404


def test_created_data_belongs_to_its_creator() -> None:
    response = client.post(
        "/api/meetings",
        headers=STRANGER,
        json={
            "title": "Stranger's sync",
            "rawNotes": "Private notes.",
            "items": [
                {
                    "title": "Stranger's task",
                    "owner": "Unassigned",
                    "priority": "Low",
                    "due": "",
                    "note": "",
                }
            ],
        },
    )
    assert response.status_code == 201

    # The stranger sees exactly their capture; the seeded user still sees
    # exactly the seeds. Neither list leaks into the other.
    stranger_items = client.get(
        "/api/items?view=review", headers=STRANGER
    ).json()["items"]
    assert [item["title"] for item in stranger_items] == ["Stranger's task"]
    assert len(client.get("/api/items?view=review").json()["items"]) == 2
    assert [
        m["title"]
        for m in client.get("/api/meetings", headers=STRANGER).json()[
            "meetings"
        ]
    ] == ["Stranger's sync"]
