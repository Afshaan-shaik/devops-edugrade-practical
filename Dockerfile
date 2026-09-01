# =========================================================================
# Multi-Stage Production Dockerfile for EduGrade Web Application
# DevOps Best Practices: Minimal Alpine Base, Non-Root User, Healthcheck
# =========================================================================

# Stage 1: Build & Dependencies
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Install dependencies first for optimal layer caching
COPY package*.json ./
RUN npm ci --omit=dev

# Copy application source code
COPY . .

# Stage 2: Final Secure Production Image
FROM node:20-alpine AS runner

WORKDIR /usr/src/app

# Install curl / wget for container health checks
RUN apk add --no-cache wget

# Set environment defaults
ENV NODE_ENV=production \
    PORT=8080 \
    APP_VERSION=1.0.0 \
    RELEASE_NAME=Genesis-Release

# Copy production node_modules and code from builder
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/public ./public
COPY --from=builder /usr/src/app/src ./src
COPY --from=builder /usr/src/app/server.js ./server.js
COPY --from=builder /usr/src/app/package.json ./package.json

# Run as non-root user 'node' for security compliance
USER node

# Expose web service port
EXPOSE 8080

# Built-in Docker Container Health Check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

# Start the Node.js application server
CMD ["node", "server.js"]
