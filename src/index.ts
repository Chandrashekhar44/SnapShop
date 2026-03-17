import { PrismaClient } from "@prisma/client/extension";

const prisma = new PrismaClient();
type User = Awaited<ReturnType<typeof prisma.user.findUnique>>;


export { prisma, User };