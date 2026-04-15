import Redis from "ioredis";

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  throw new Error("REDIS_URL is not defined");
}

const redisOptions = {
  tls: redisUrl.startsWith("rediss://") ? {} : undefined,
  retryStrategy: (times: number) => Math.min(times * 50, 2000),
};

export const client = new Redis(redisUrl, redisOptions);

export const queueConnection = new Redis(redisUrl, {
  ...redisOptions,
  maxRetriesPerRequest: null,
});

client.on("connect", () => {
  console.log("Redis connected (cache)");
});

queueConnection.on("connect", () => {
  console.log("Redis connected (queue)");
});

client.on("error", (err) => {
  console.error("Redis Cache Error:", err);
});

queueConnection.on("error", (err) => {
  console.error("Redis Queue Error:", err);
});

process.on("SIGINT", async () => {
  await client.quit();
  await queueConnection.quit();
  process.exit(0);
});
