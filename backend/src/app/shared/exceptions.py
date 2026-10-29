"""Application-level exceptions."""


class AppError(Exception):
    """Base application exception."""


class ResourceNotFoundError(AppError):
    """Raised when a requested resource does not exist."""


class ResourceNotReadyError(AppError):
    """Raised when a resource is not ready for an operation."""


class ResourceConflictError(AppError):
    """Raised when an operation conflicts with an existing resource."""


class AIProviderUnavailableError(AppError):
    """Raised when the AI provider cannot be reached."""


class AIProviderRequestError(AppError):
    """Raised when the AI provider returns an invalid or failed response."""


class JobPortalUnavailableError(AppError):
    """Raised when the job portal MCP server cannot be reached."""
