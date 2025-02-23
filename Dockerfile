FROM node:20-alpine AS base

# Install pnpm and PostgreSQL
RUN apk add --no-cache libc6-compat postgresql postgresql-contrib && npm install -g pnpm

# Initialize PostgreSQL
RUN mkdir -p /run/postgresql && chown -R postgres:postgres /run/postgresql/
USER postgres
RUN initdb -D /var/lib/postgresql/data
RUN echo "host all all 0.0.0.0/0 md5" >> /var/lib/postgresql/data/pg_hba.conf
RUN echo "listen_addresses='*'" >> /var/lib/postgresql/data/postgresql.conf
USER root

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
ENV HOSTNAME="0.0.0.0"
ENV SKIP_ENV_VALIDATION=1
ENV DATABASE_URL="postgresql://postgres:password@localhost:5432/postgres"
ENV PGDATA=/var/lib/postgresql/data

# Copy necessary files
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the application
RUN pnpm run build

# Create start script
RUN echo '#!/bin/sh\n\
mkdir -p /run/postgresql\n\
chown -R postgres:postgres /run/postgresql/\n\
chown -R postgres:postgres $PGDATA\n\
su postgres -c "pg_ctl -D $PGDATA start"\n\
until su postgres -c "pg_isready"; do\n\
  echo "Waiting for PostgreSQL to start..."\n\
  sleep 1\n\
done\n\
su postgres -c "psql -c \\"ALTER USER postgres WITH PASSWORD '\''password'\'';\\""\n\
pnpm start:migrate' > /app/start.sh && chmod +x /app/start.sh

EXPOSE 3000 5432

CMD ["/app/start.sh"] 