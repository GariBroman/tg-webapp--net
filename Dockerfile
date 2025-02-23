FROM node:20-alpine AS base

# Install pnpm
RUN npm install -g pnpm

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

# Build-time arguments
ARG DATABASE_URL
ARG TELEGRAM_BOT_TOKEN
ARG ADMIN_TELEGRAM_ID
ARG NEXT_PUBLIC_POSTHOG_KEY
ARG NEXT_PUBLIC_POSTHOG_HOST

# Runtime environment variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL=${DATABASE_URL}
ENV TELEGRAM_BOT_TOKEN=${TELEGRAM_BOT_TOKEN}
ENV ADMIN_TELEGRAM_ID=${ADMIN_TELEGRAM_ID}
ENV NEXT_PUBLIC_POSTHOG_KEY=${NEXT_PUBLIC_POSTHOG_KEY}
ENV NEXT_PUBLIC_POSTHOG_HOST=${NEXT_PUBLIC_POSTHOG_HOST}
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Copy necessary files
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN pnpm run build

EXPOSE 3000

CMD ["pnpm", "start"] 