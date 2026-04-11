import { Worker } from "bullmq";
import { queueConnection } from "../config/redis.js";
import { getIO } from "../socket/socket.js";

const worker = new Worker(
  "notificationQueue",
  async (job) => {
    const { type, userId, message } = job.data;

    try {
      const io = getIO();

      io.to(`user_${userId}`).emit("notification", {
        type,
        message,
      });

      console.log(`Notification sent to user ${userId}`);
    } catch (error) {
      console.error("Notification worker error:", error);
      throw error;
    }
  },
  {
    connection: queueConnection,
  }
);

export default worker;
