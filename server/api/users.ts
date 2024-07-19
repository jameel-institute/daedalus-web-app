import prisma from "~/lib/prisma";

export default defineEventHandler(async (event) => {
  const uniqueString = Math.random().toString(36).substring(7);

  await prisma.user.create({
    data: {
      email: `${uniqueString}@email.com`,
      name: "Hello",
    },
  });

  // Return all users
  return {
    user: await prisma.user.findMany(),
  };
});
