# Production Dockerfile for TrainX Backend API
FROM node:20-bookworm-slim

# Install system dependencies (curl for healthchecks, procps for metrics)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    procps \
    ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install production dependencies
RUN npm ci --omit=dev

# Copy application source code
COPY . .

# Expose API port
EXPOSE 5000

# Set environment
ENV NODE_ENV=production
ENV PORT=5000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:5000/api/v1/health || exit 1

# Start server
CMD ["node", "server.js"]
