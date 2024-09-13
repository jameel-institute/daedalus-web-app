// Although the Prisma nuxt module didn't work (see https://github.com/prisma/nuxt-prisma/issues/22)
// we still need to use the related setup code that creates a global instance of the Prisma Client,
// so this file is a linted version of https://www.prisma.io/docs/orm/more/help-and-troubleshooting/help-articles/prisma-nuxt-module#option-b-libprismats

import process from "node:process";
import { PrismaClient } from "@prisma/client";

const prismaClientSingleton = () => {
  return new PrismaClient();
};

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>
  // eslint-disable-next-line no-restricted-globals
} & typeof global;

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== "production") {
  globalThis.prismaGlobal = prisma;
};
