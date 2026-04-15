import Redis from "ioredis";

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  throw new Error("REDIS_URL is not defined");
}

export const client = new Redis(redisUrl, {
  tls: redisUrl.startsWith("rediss://") ? {} : undefined,
});

export const queueConnection = new Redis(redisUrl, {
  tls: redisUrl.startsWith("rediss://") ? {} : undefined,
  maxRetriesPerRequest: null,
});

client.on("error", (err) => {
  console.error("Redis Cache Error:", err);
});

queueConnection.on("error", (err) => {
  console.error("Redis Queue Error:", err);
});
