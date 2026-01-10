# Multi-stage Dockerfile for Instagram DM Agent
# Builds frontend and serves with FastAPI backend

# =============================================================================
# Stage 1: Build Frontend
# =============================================================================
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy frontend package files
COPY client-dashboard/package*.json ./

# Install dependencies
RUN npm ci

# Copy frontend source
COPY client-dashboard/ ./

# Build for production
RUN npm run build

# =============================================================================
# Stage 2: Python Backend with Frontend Static Files
# =============================================================================
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy Python requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source code
COPY src/ ./src/
COPY main.py .
COPY clients/ ./clients/

# Copy built frontend from Stage 1
COPY --from=frontend-builder /app/frontend/dist ./static/dashboard

# Create data directory for any local persistence
RUN mkdir -p /app/data

# Environment variables
ENV PYTHONUNBUFFERED=1
ENV HOST=0.0.0.0
ENV PORT=8000

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')" || exit 1

# Start the application
CMD ["python", "main.py"]
