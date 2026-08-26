"""Redis-backed rate limiting."""

from fastapi import HTTPException, Request, status
from redis import Redis

from app.core.config import settings

redis_client = Redis.from_url(
    settings.redis_url,
    decode_responses=True,
)


def check_rate_limit(
    *,
    key: str,
    limit: int,
    window_seconds: int = 60,
) -> None:
    """Check and enforce a Redis-backed rate limit."""

    redis_key = f"rate_limit:{key}"

    current = redis_client.incr(redis_key)

    if current == 1:
        redis_client.expire(
            redis_key,
            window_seconds,
        )

    if current > limit:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many requests. Please try again later.",
            headers={
                "Retry-After": str(window_seconds),
            },
        )


def rate_limit_by_ip(
    request: Request,
    *,
    action: str,
    limit: int,
    window_seconds: int = 60,
) -> None:
    """Apply a rate limit based on client IP."""

    client_ip = (
        request.client.host
        if request.client
        else "unknown"
    )

    check_rate_limit(
        key=f"{action}:ip:{client_ip}",
        limit=limit,
        window_seconds=window_seconds,
    )


def rate_limit_by_user(
    *,
    user_id: str,
    action: str,
    limit: int,
    window_seconds: int = 60,
) -> None:
    """Apply a rate limit based on authenticated user."""

    check_rate_limit(
        key=f"{action}:user:{user_id}",
        limit=limit,
        window_seconds=window_seconds,
    )