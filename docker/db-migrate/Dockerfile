FROM node:20-slim as base

WORKDIR /src

COPY --link package.json package-lock.json .
RUN npm ci

COPY --link . .

CMD [ "prisma", "migrate", "deploy" ]