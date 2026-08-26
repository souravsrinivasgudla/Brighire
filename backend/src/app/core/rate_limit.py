"""Redis-backed rate limiting."""

from fastapi import HTTPException, Request, status
from redis import Redis
from redis.exceptions import RedisError

from app.core.config import settings

redis_client = Redis.from_url(
    settings.redis_url,
    decode_responses=True,
    socket_connect_timeout=settings.redis_socket_connect_timeout,
    socket_timeout=settings.redis_socket_timeout,
)


def check_rate_limit(
    key: str,
    limit: int,
    window_seconds: int = 60,
) -> None:
    """Enforce a fixed-window rate limit using Redis.

    Fail-closed: Redis errors become HTTP 503 so security-sensitive
    endpoints never bypass rate limiting when Redis is unavailable.
    """

    try:
        with redis_client.pipeline(transaction=True) as pipe:
            pipe.incr(key)
            pipe.expire(key, window_seconds)
            current, _ = pipe.execute()

    except RedisError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Rate limiting service is temporarily unavailable.",
        ) from None

    if current > limit:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many requests. Please try again later.",
        )


def rate_limit_by_ip(
    request: Request,
    action: str,
    limit: int,
    window_seconds: int = 60,
) -> None:
    """Rate-limit requests by client IP address."""

    client_ip = request.client.host if request.client else "unknown"

    check_rate_limit(
        key=f"rate_limit:ip:{action}:{client_ip}",
        limit=limit,
        window_seconds=window_seconds,
    )


def rate_limit_by_user(
    user_id: str,
    action: str,
    limit: int,
    window_seconds: int = 60,
) -> None:
    """Rate-limit requests by authenticated user."""

    check_rate_limit(
        key=f"rate_limit:user:{action}:{user_id}",
        limit=limit,
        window_seconds=window_seconds,
    )
