// index.ts
import http from "http";
import app from "./app.js";
import { initSocket } from "./socket/socket.js";
import { PrismaClient } from "@prisma/client";
import type { User } from "./generated/prisma/client.js";


const prisma = new PrismaClient();

const server = http.createServer(app);
initSocket(server);

export { prisma,User };
