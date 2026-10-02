FROM node:22-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# NEXT_PUBLIC_* is inlined at BUILD time and cannot be overridden at runtime, so
# a wrong value here silently ships a frontend pointed at a dead backend. No
# default on purpose: the build must fail loudly rather than inherit the
# self-hosted URL that was retired on 2026-07-10 (AGENTS.md 9). Pass
#   --build-arg NEXT_PUBLIC_CONVEX_URL=https://<deployment>.convex.cloud
ARG NEXT_PUBLIC_CONVEX_URL
ENV NEXT_PUBLIC_CONVEX_URL=$NEXT_PUBLIC_CONVEX_URL
ARG APP_REVISION
ENV APP_REVISION=$APP_REVISION
RUN test -n "$NEXT_PUBLIC_CONVEX_URL" || (echo "ERROR: --build-arg NEXT_PUBLIC_CONVEX_URL is required" && exit 1)
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ARG APP_REVISION
ENV APP_REVISION=$APP_REVISION
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
CMD ["node", "server.js"]
