# Build stage
FROM node:24-bookworm-slim AS builder

WORKDIR /app

# Install build dependencies for sharp and better-sqlite3
RUN apt-get update && apt-get install -y --no-install-recommends \
        ca-certificates \
        python3 \
        make \
        g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Prisma 7 config loading requires DATABASE_URL even for `prisma generate`.
# Use the bundled dev DB for build-time codegen/build steps.
ENV DATABASE_URL="file:./prisma/dev.db"

# Some repos exclude *.db from the Docker build context via .dockerignore.
# Next.js may load server code during build; our Prisma singleton requires an existing file.
# Create a small placeholder DB file for build-time only.
RUN mkdir -p /app/prisma && : > /app/prisma/dev.db

# Install dependencies (including dev for build)
RUN npm ci --legacy-peer-deps

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build Next.js application with memory limits
RUN NODE_OPTIONS="--max-old-space-size=1024" SKIP_TYPE_CHECK=true npm run build

# Production stage
FROM node:24-bookworm-slim AS production

WORKDIR /app

# Create non-root user
RUN groupadd -g 1001 nodejs && \
    useradd -m -u 1001 -g 1001 nodejs

# Copy package files and install production dependencies
COPY package*.json ./

# Install runtime tools and native build deps for production-only installs.
# `better-sqlite3` may fall back to a local build when prebuilt binaries are unavailable.
RUN apt-get update && apt-get install -y --no-install-recommends \
        ca-certificates \
        wget \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Husky is a devDependency, so remove the prepare hook in the production image
# before installing runtime dependencies.
RUN npm pkg delete scripts.prepare

# Install production dependencies.
RUN npm ci --omit=dev --legacy-peer-deps

# Copy Prisma schema and generated client from builder
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY prisma ./prisma/

# Copy seed scripts for database initialization
COPY scripts/seed ./scripts/seed
COPY scripts/shared ./scripts/shared

# `npm start` runs `prestart`, which calls this script.
COPY scripts/dev/ensure-node-24.js ./scripts/dev/ensure-node-24.js

# Copy legal documents (markdown files)
COPY data/legal ./data/legal

# Copy built Next.js app from builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.js ./

# Prisma 7 reads datasource URL from prisma.config.ts (schema.prisma omits url)
COPY prisma.config.ts ./prisma.config.ts

# Create data, uploads, and backups directories with proper permissions.
# The upload subdirectories mirror getUploadsBaseDir() consumers in
# src/lib/constants.ts and the table in IMPLEMENTATION.md §9.1.
RUN mkdir -p /app/data /app/backups /app/uploads \
    /app/uploads/change-requests \
    /app/uploads/consent-types \
    /app/uploads/documents \
    /app/uploads/journal \
    /app/uploads/meister-reports \
    /app/uploads/notes \
    /app/uploads/sponsors \
    /app/uploads/support-requests \
    /app/uploads/user-consents && \
    chown -R nodejs:nodejs /app/data /app/uploads /app/backups

# Set environment variables
ENV NODE_ENV=production
ENV PORT=1345
ENV DATABASE_URL="file:/app/data/bwb.db"
ENV UPLOADS_DIR="/app/uploads"
ENV BACKUP_DIR="/app/backups"

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 1345

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:1345/api/health || exit 1

# Start Next.js production server
CMD ["npm", "start"]
