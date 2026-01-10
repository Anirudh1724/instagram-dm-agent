"""
Instagram DM Agent - Main Application Entry Point.
"""

import os
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from src.config import get_settings
from src.utils import setup_logging, get_logger
from src.api import api_router

# Setup logging
setup_logging()
logger = get_logger("main")


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    settings = get_settings()
    
    app = FastAPI(
        title="Instagram DM Agent",
        description="Agentic AI system for Instagram DM automation",
        version="2.0.0",
        debug=settings.debug,
    )
    
    # CORS middleware - configurable for production
    # Set CORS_ORIGINS in .env for production (comma-separated)
    # Example: CORS_ORIGINS=https://dashboard.yourdomain.com,https://app.yourdomain.com
    cors_origins_str = os.getenv("CORS_ORIGINS", "")
    
    if cors_origins_str and cors_origins_str.strip():
        # Production: use specific origins from environment
        allowed_origins = [origin.strip() for origin in cors_origins_str.split(",") if origin.strip()]
        logger.info("cors_configured", origins=allowed_origins)
    else:
        # Development: allow all origins
        allowed_origins = ["*"]
        if not settings.debug:
            logger.warning("cors_wildcard_production", message="CORS_ORIGINS not set. Using * in production is not recommended.")
    
    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type", "Accept", "Origin", "X-Requested-With"],
    )
    

    # Include the unified API router
    # This includes all endpoints: v1 (auth, dashboard, leads), admin, webhooks, internal
    app.include_router(api_router)
    
    # Serve frontend static files (React build)
    # In production, the frontend is built and copied to static/dashboard
    dashboard_dir = os.path.join(os.path.dirname(__file__), "static", "dashboard")
    static_dir = os.path.join(os.path.dirname(__file__), "static")
    
    if os.path.exists(dashboard_dir):
        # Serve React frontend assets
        app.mount("/assets", StaticFiles(directory=os.path.join(dashboard_dir, "assets")), name="assets")
        
        # Serve index.html for all non-API routes (SPA fallback)
        from fastapi.responses import FileResponse
        
        @app.get("/{full_path:path}")
        async def serve_spa(full_path: str):
            """Serve React SPA for all non-API routes."""
            # Don't intercept API routes
            if full_path.startswith(("api/", "admin/", "webhook/", "docs", "openapi", "health")):
                return None
            
            index_path = os.path.join(dashboard_dir, "index.html")
            if os.path.exists(index_path):
                return FileResponse(index_path)
            return {"error": "Frontend not built"}
        
        logger.info("frontend_serving", path=dashboard_dir)
    elif os.path.exists(static_dir):
        # Fallback to old static directory
        app.mount("/static", StaticFiles(directory=static_dir), name="static")
    

    @app.on_event("startup")
    async def startup():
        logger.info("server_starting", host=settings.host, port=settings.port)
        logger.info("api_docs_available", url=f"http://{settings.host}:{settings.port}/docs")
        
        # Start the followup scheduler
        try:
            from src.services.followup_scheduler import start_followup_scheduler
            await start_followup_scheduler()
            logger.info("followup_scheduler_started")
        except Exception as e:
            logger.error("followup_scheduler_start_failed", error=str(e))
    
    @app.on_event("shutdown")
    async def shutdown():
        # Stop the followup scheduler
        try:
            from src.services.followup_scheduler import stop_followup_scheduler
            await stop_followup_scheduler()
            logger.info("followup_scheduler_stopped")
        except Exception as e:
            logger.error("followup_scheduler_stop_failed", error=str(e))
        
        logger.info("server_stopping")
    
    return app


# Create the app instance
app = create_app()


if __name__ == "__main__":
    settings = get_settings()
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
    )
