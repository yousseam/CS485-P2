# Stage 1: Base image
FROM node:20-alpine AS base

# Install dumb-init for proper signal handling and curl for health checks
RUN apk add --no-cache dumb-init curl

# Set working directory
WORKDIR /app

# Stage 2: Copy package files
COPY package*.json ./

# Stage 3: Install dependencies (use npm install instead of ci)
RUN npm install && npm cache clean --force

# Stage 4: Copy application code
COPY src/ ./src/
COPY server.js ./server.js
COPY load-env.mjs ./load-env.mjs

# Create non-root user for security (but keep correct permissions)
RUN addgroup -g 1001 -S nodejs && \
    adduser -S -u 1001 -G nodejs nodejs && \
    chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose backend port
EXPOSE 3001

# Health check - check backend API health endpoint
HEALTHCHECK --interval=30s --timeout=5s \
  --start-period=40s \
  --retries=3 \
  CMD curl -f http://localhost:3001/api/health || exit 1

# Start application with dumb-init
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]
