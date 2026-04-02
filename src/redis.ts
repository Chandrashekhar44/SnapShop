import RedisPackage from "ioredis";

const Redis = RedisPackage.default || RedisPackage;

const redisUrl = process.env.REDIS_URL!;

const client = new Redis(redisUrl, {
  tls: redisUrl.startsWith("rediss://") ? {} : undefined,
});

client.on("error", (err) => {
  console.error("Redis error:", err);
});

export default client;
