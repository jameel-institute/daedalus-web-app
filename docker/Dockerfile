FROM node:20

ARG PORT=3000

ENV NODE_ENV=production

WORKDIR /src

COPY . .
RUN npm ci

# Generate the prisma client code
RUN npm install prisma@5.17.0
RUN npx prisma generate

RUN npm run build

ENV PORT=$PORT

# migrate the db before running the server
CMD ["/bin/bash", "-c", "npx prisma migrate deploy;node .output/server/index.mjs"]
