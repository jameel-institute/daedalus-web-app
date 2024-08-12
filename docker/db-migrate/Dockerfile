FROM node:20-slim as base

WORKDIR /src

RUN npm ci

CMD [ "prisma", "migrate", "deploy" ]