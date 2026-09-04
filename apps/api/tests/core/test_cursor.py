"""The cursor codec is the pagination contract's hinge: opaque out, strict in."""

import pytest
from app.core.cursor import CursorError, decode_cursor, encode_cursor


def test_round_trips_a_payload() -> None:
    payload = {"d": "2026-09-10", "i": 42}
    assert decode_cursor(encode_cursor(payload)) == payload


def test_round_trips_null_sort_key() -> None:
    payload = {"d": None, "i": 7}
    assert decode_cursor(encode_cursor(payload)) == payload


def test_rejects_garbage() -> None:
    with pytest.raises(CursorError):
        decode_cursor("not-base64!!!")


def test_rejects_valid_base64_that_is_not_json() -> None:
    with pytest.raises(CursorError):
        decode_cursor("aGVsbG8")  # "hello"


def test_rejects_non_object_json() -> None:
    with pytest.raises(CursorError):
        decode_cursor(encode_cursor_raw("[1, 2]"))


def encode_cursor_raw(text: str) -> str:
    import base64

    return base64.urlsafe_b64encode(text.encode()).decode().rstrip("=")
