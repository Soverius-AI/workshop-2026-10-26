FROM node:24-bookworm-slim AS base
WORKDIR /app
COPY apps/explorer/package*.json ./
RUN npm ci
COPY apps/explorer/ ./
COPY workshop/corpus/ /corpus/
RUN npm run build && mkdir -p /app/output && chown -R node:node /app
USER node
EXPOSE 4341
CMD ["node", "server.mjs"]
