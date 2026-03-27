import RedisPackage from "ioredis";

const Redis = RedisPackage.default || RedisPackage;
const client = new Redis(process.env.REDIS_URL!, { tls: {} });

async function testRedis() {
  await client.set("foo", "bar"); 
  const value = await client.get("foo"); 
  console.log(value); 
}

testRedis();
