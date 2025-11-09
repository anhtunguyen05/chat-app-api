import Redis from "ioredis";

console.log("🚀 Creating Redis connection...");

const redis = new Redis({
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: Number(process.env.REDIS_PORT) || 6379,
  // password: process.env.REDIS_PASSWORD || undefined,
});

redis.on("connect", () => console.log("✅ Connected to Redis successfully!"));
redis.on("ready", () => console.log("🔄 Redis is ready to use!"));
redis.on("error", (err) => console.error("❌ Redis connection error:", err.message));
redis.on("close", () => console.log("⚠️ Redis connection closed."));

export default redis;
