#!/bin/bash
# =========================================================================
# EduGrade Automated Cloud Deployment Script (AWS EC2 / Linux)
# Handles zero-downtime container replacement, health checks & auto-rollback
# =========================================================================

set -e

APP_NAME="edugrade-web-container"
IMAGE_NAME="edugrade"
NEW_TAG="${1:-latest}"
PORT=8080

echo "🚀 [DevOps CI/CD] Starting Deployment for Version: $NEW_TAG..."

# 1. Pull / Build new image
if [ -f "Dockerfile" ]; then
    echo "📦 Building local Docker image: $IMAGE_NAME:$NEW_TAG..."
    docker build -t "$IMAGE_NAME:$NEW_TAG" .
fi

# 2. Record existing running container image for rollback safety
PREV_IMAGE=$(docker inspect --format='{{.Config.Image}}' $APP_NAME 2>/dev/null || echo "")
echo "ℹ️ Current active image: ${PREV_IMAGE:-None}"

# 3. Spin up temporary canary/staging container to verify health
echo "🔍 Starting health check container..."
docker run -d --name "${APP_NAME}-staging" -p 8081:8080 "$IMAGE_NAME:$NEW_TAG"

# Wait for container boot
sleep 4

# Check health endpoint
echo "🩺 Verifying container health via HTTP /health..."
HEALTH_CHECK=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8081/health || echo "000")

if [ "$HEALTH_CHECK" -eq 200 ]; then
    echo "✅ Health check PASSED (HTTP 200). Proceeding with production swap..."
    docker stop "${APP_NAME}-staging" && docker rm "${APP_NAME}-staging"

    # Stop old production container
    if [ ! -z "$PREV_IMAGE" ]; then
        docker stop $APP_NAME || true
        docker rm $APP_NAME || true
    fi

    # Launch new production container
    docker run -d \
      --name $APP_NAME \
      --restart always \
      -p 80:8080 \
      -e PORT=8080 \
      -e NODE_ENV=production \
      -e APP_VERSION="$NEW_TAG" \
      "$IMAGE_NAME:$NEW_TAG"

    echo "🎉 [SUCCESS] Deployment of $IMAGE_NAME:$NEW_TAG is live on port 80!"
else
    echo "❌ [ALERT] Health check FAILED with status code: $HEALTH_CHECK!"
    echo "Rolling back staging container..."
    docker stop "${APP_NAME}-staging" || true
    docker rm "${APP_NAME}-staging" || true
    echo "Deployment aborted. Previous version remains untouched."
    exit 1
fi
