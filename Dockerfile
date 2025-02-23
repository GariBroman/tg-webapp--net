FROM node:20-alpine AS base

# Install pnpm and netcat
RUN apk add --no-cache netcat-openbsd && npm install -g pnpm

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Files required for package installation
COPY package.json pnpm-lock.yaml* ./

# Install dependencies
RUN pnpm install

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV SKIP_ENV_VALIDATION=1

# Copy necessary files
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the application
RUN pnpm run build

EXPOSE 3000

CMD ["pnpm", "start:migrate"] 