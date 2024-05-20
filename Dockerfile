# Multi-stage build for a next.js application
# Stage 1: Install dependencies
# Stage 2: Build the application
# Stage 3: Serve the application

FROM node:latest as base 


FROM base as dependencies

WORKDIR /app_build 

COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i --frozen-lockfile; \
  else echo "Lockfile not found." && exit 1; \
  fi

RUN npm install --verbose

FROM base as builder

WORKDIR /app_build
COPY --from=dependencies /app_build/node_modules ./node_modules
COPY . .  
RUN npx prisma generate

# Disable evil telemetry at build time ( the glowies are watching )
ENV NEXT_TELEMETRY_DISABLED 1

RUN \
  if [ -f yarn.lock ]; then yarn run build; \
  elif [ -f package-lock.json ]; then npm run build; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm run build; \
  else echo "Lockfile not found." && exit 1; \
  fi



#
#
# Production Runner Stage
#
# Establish a minimal image to run the application
# set various environment variables and copy the build artifacts
#
#
FROM base as runner

WORKDIR /app

# Conventional environment variable to set the environment to production
ENV NODE_ENV production
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

RUN mkdir .next

COPY --from=builder /app_build/public ./public
COPY --from=builder /app_build/.next/standalone .  
COPY --from=builder /app_build/.next/static ./.next/static

COPY --from=builder /app_build/package.json .

# Copy packages from builder to runner

EXPOSE 3000

CMD ["node", "server.js"]






