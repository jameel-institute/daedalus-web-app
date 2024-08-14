FROM node:20

ARG PORT=3000

ENV NODE_ENV=production

WORKDIR /src

COPY --link package.json package-lock.json .
RUN npm install --production=false

COPY --link . .

# Generate the prisma client code
RUN npx prisma generate

RUN npm run build

ENV PORT=$PORT

# migrate the db before running the server
CMD npx prisma migrate deploy;node .output/server/index.mjs
