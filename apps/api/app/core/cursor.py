"""Opaque keyset-pagination cursors: base64url(JSON) out, strict parse in.
Routes turn CursorError into a 422 — a tampered cursor is a bad request."""

import base64
import binascii
import json


class CursorError(ValueError):
    """The cursor string is not one we minted (bad base64/JSON/shape)."""


def encode_cursor(payload: dict) -> str:
    """dict → unpadded base64url JSON. Opaque to clients by convention."""
    raw = json.dumps(payload, separators=(",", ":")).encode()
    return base64.urlsafe_b64encode(raw).decode().rstrip("=")


def decode_cursor(raw: str) -> dict:
    """Reverse of encode_cursor; raises CursorError on anything malformed."""
    try:
        padded = raw + "=" * (-len(raw) % 4)
        decoded = base64.urlsafe_b64decode(padded.encode())
        payload = json.loads(decoded)
    except (binascii.Error, ValueError, UnicodeDecodeError) as exc:
        raise CursorError(str(exc)) from exc
    if not isinstance(payload, dict):
        raise CursorError("cursor payload must be an object")
    return payload
