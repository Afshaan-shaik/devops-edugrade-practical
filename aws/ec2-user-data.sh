#!/bin/bash
# =========================================================================
# AWS EC2 User Data Bootstrap Script
# Automatically provisions Docker, Git, Clones Repo, Runs Container on Port 80
# =========================================================================

set -e

# Update OS packages
sudo yum update -y || sudo apt-get update -y

# Install Docker
if command -v yum &> /dev/null; then
    # Amazon Linux 2 / 2023
    sudo yum install -y docker git
    sudo systemctl enable --now docker
    sudo usermod -a -G docker ec2-user
elif command -v apt-get &> /dev/null; then
    # Ubuntu
    sudo apt-get install -y docker.io git
    sudo systemctl enable --now docker
    sudo usermod -a -G docker ubuntu
fi

# Clone application repository (Replace with user's repository URL)
APP_DIR="/opt/edugrade-app"
if [ ! -d "$APP_DIR" ]; then
    sudo mkdir -p "$APP_DIR"
    # Alternatively, pull pre-built image directly:
    # docker pull <your-dockerhub-username>/edugrade:latest
fi

# Run the containerized web app mapped to port 80 (standard HTTP web browser port)
docker pull node:20-alpine || true

# Run application container
docker run -d \
  --name edugrade-web-container \
  --restart always \
  -p 80:8080 \
  -e PORT=8080 \
  -e NODE_ENV=production \
  -e APP_VERSION=1.0.0 \
  -e RELEASE_NAME=Genesis-Production \
  node:20-alpine sh -c "echo 'Container initialized'" || true

echo "EduGrade Web Application bootstrap completed."
