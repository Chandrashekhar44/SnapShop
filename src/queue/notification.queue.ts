import { Queue } from "bullmq";
import { queueConnection } from "../config/redis.js";


export const notificationQueue = new Queue("notificationQueue",{
    connection:queueConnection
})