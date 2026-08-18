"""Application-level exceptions."""


class AppError(Exception):
    """Base application exception."""


class ResourceNotFoundError(AppError):
    """Raised when a requested resource does not exist."""


class ResourceAccessDeniedError(AppError):
    """Raised when a user cannot access a resource."""


class ResourceNotReadyError(AppError):
    """Raised when a resource is not ready for an operation."""