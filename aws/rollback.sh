#!/bin/bash
# =========================================================================
# Step 12: Automated Rollback Script
# Instantly reverts application to a stable target release
# =========================================================================

set -e

APP_NAME="edugrade-web-container"
IMAGE_NAME="edugrade"
TARGET_TAG="${1:-1.0.0}"

echo "⚠️ [ROLLBACK INITIATED] Reverting container service to version: $TARGET_TAG..."

# 1. Verify target image exists locally or in registry
if ! docker image inspect "$IMAGE_NAME:$TARGET_TAG" >/dev/null 2>&1; then
    echo "Image $IMAGE_NAME:$TARGET_TAG not found locally. Attempting to pull..."
    docker pull "$IMAGE_NAME:$TARGET_TAG" || {
        echo "Error: Target image $IMAGE_NAME:$TARGET_TAG is not available!"
        exit 1
    }
fi

# 2. Gracefully stop current running version
echo "Stopping active container ($APP_NAME)..."
docker stop $APP_NAME || true
docker rm $APP_NAME || true

# 3. Spin up previous stable version
echo "Restoring previous stable container with tag: $TARGET_TAG..."
docker run -d \
  --name $APP_NAME \
  --restart always \
  -p 80:8080 \
  -e PORT=8080 \
  -e NODE_ENV=production \
  -e APP_VERSION="$TARGET_TAG" \
  -e RELEASE_NAME="Rollback-Stable-$TARGET_TAG" \
  "$IMAGE_NAME:$TARGET_TAG"

# 4. Verify rollback health
sleep 3
HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:80/health || echo "000")

if [ "$HEALTH" -eq 200 ]; then
    echo "✅ [ROLLBACK SUCCESS] Application successfully rolled back to $TARGET_TAG!"
    curl -s http://localhost:80/api/version | jq . || curl -s http://localhost:80/api/version
else
    echo "❌ Rollback health check failed with HTTP $HEALTH. Check container logs:"
    docker logs --tail 20 $APP_NAME
fi
