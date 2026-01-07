import Redis from "ioredis";

const redis = new Redis(
  process.env.REDIS_URL || "redis://127.0.0.1:6379"
);

redis.on("connect", () => console.log("✅ Connected to Redis successfully!"));
redis.on("ready", () => console.log("🔄 Redis is ready to use!"));
redis.on("error", (err) => console.error("❌ Redis connection error:", err.message));
redis.on("close", () => console.log("⚠️ Redis connection closed."));

export default redis;
