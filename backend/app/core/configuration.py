"""Configuration-related errors."""

from app.core.exceptions import FinSightError


class ConfigurationError(FinSightError):
    """Raised when required environment variables are missing or invalid."""
