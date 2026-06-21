"""Run the FinSight AI backend server."""

import os

import uvicorn

from app.config import get_settings


def main() -> None:
    settings = get_settings()
    # Render and other PaaS providers inject PORT at runtime
    port = int(os.environ.get("PORT", settings.port))
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=port,
        reload=settings.environment == "development",
        log_level=settings.log_level.lower(),
    )


if __name__ == "__main__":
    main()
