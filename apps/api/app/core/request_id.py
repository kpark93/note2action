"""Request-id + access-log middleware — one structured line per request.
Registered outermost in app/main.py, so even auth 401s get an id and a line."""

import logging
import time
import uuid

from fastapi import Request

access_log = logging.getLogger("note2action.access")


async def request_id_and_access_log(request: Request, call_next):
    """Stamp a short request id, time the request, emit one key=value line."""
    request_id = uuid.uuid4().hex[:12]
    request.state.request_id = request_id
    start = time.perf_counter()

    response = await call_next(request)

    duration_ms = (time.perf_counter() - start) * 1000
    identity = getattr(request.state, "identity", None)
    access_log.info(
        "request_id=%s method=%s path=%s status=%s duration_ms=%.1f user=%s",
        request_id,
        request.method,
        request.url.path,
        response.status_code,
        duration_ms,
        getattr(identity, "clerk_id", "-"),
    )
    response.headers["X-Request-ID"] = request_id
    return response
