"""Application logging configuration."""

import logging
import sys

_APP_LOGGER = "app"
_HANDLER_NAME = "brighire-app"
_LOG_FORMAT = "%(levelname)s:     %(name)s - %(message)s"


def configure_logging(level: int = logging.INFO) -> None:
    """Send application logs to stderr exactly once.

    The ``app`` logger owns its handler and does not propagate, so records are
    unaffected by whatever Uvicorn or SQLAlchemy configure on the root logger.
    """

    logger = logging.getLogger(_APP_LOGGER)
    logger.setLevel(level)
    logger.propagate = False

    # Reloads re-run the app factory in the same process.
    if any(handler.get_name() == _HANDLER_NAME for handler in logger.handlers):
        return

    handler = logging.StreamHandler(sys.stderr)
    handler.set_name(_HANDLER_NAME)
    handler.setFormatter(logging.Formatter(_LOG_FORMAT))
    logger.addHandler(handler)
