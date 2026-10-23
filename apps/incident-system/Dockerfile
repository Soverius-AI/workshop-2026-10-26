FROM node:24-bookworm-slim AS dependencies
WORKDIR /app
RUN npm install --global pnpm@11.19.0
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/incident-system/frontend/package.json apps/incident-system/frontend/package.json
COPY apps/incident-system/backend/package.json apps/incident-system/backend/package.json
COPY packages/contracts/package.json packages/contracts/package.json
RUN pnpm install --frozen-lockfile
COPY tsconfig.base.json ./
COPY packages/contracts packages/contracts
RUN pnpm --filter @packt-workshop/contracts build

FROM dependencies AS incident-backend
COPY apps/incident-system/backend apps/incident-system/backend
COPY workshop/exercises workshop/exercises
RUN npm install --prefix workshop/exercises --omit=dev --package-lock=false && pnpm --filter @packt-workshop/facility-service build && mkdir /data && chown node:node /data
USER node
ENV FACILITY_HOST=0.0.0.0 FACILITY_DB_PATH=/data/facility.sqlite
EXPOSE 3101
CMD ["node", "apps/incident-system/backend/dist/main.js", "--local"]

FROM dependencies AS frontend-build
COPY apps/incident-system/frontend apps/incident-system/frontend
RUN pnpm --filter angular-host build

FROM nginx:stable-alpine AS incident
COPY apps/incident-system/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=frontend-build /app/apps/incident-system/frontend/dist/angular-host/browser /usr/share/nginx/html
EXPOSE 80
