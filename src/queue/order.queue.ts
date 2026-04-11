import { Queue } from "bullmq";
import { queueConnection } from "../config/redis.js";

export const orderQueue = new Queue("orderQueue", {
  connection: queueConnection,
});
