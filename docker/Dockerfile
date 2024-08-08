# Stolen from https://markus.oberlehner.net/blog/running-nuxt-3-in-a-docker-container/
FROM node:20-slim as base

ARG PORT=3000

ENV NODE_ENV=production

WORKDIR /src

# Do a multi-stage image build: this first stage builds the app
FROM base as build

COPY --link package.json package-lock.json .
RUN npm install --production=false

COPY --link . .

RUN npm run build
RUN npm prune

# Final 'run' stage of image build copies the built app from the 'build' stage
FROM base

ENV PORT=$PORT

COPY --from=build /src/.output /src/.output

CMD [ "node", ".output/server/index.mjs" ]