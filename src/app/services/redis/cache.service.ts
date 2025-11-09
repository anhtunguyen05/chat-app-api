import redis from "../../../config/redis.config";

export class CacheService {
  /**
   * Lấy dữ liệu từ cache nếu có
   */
  static async get<T>(key: string): Promise<T | null> {
    const data = await redis.get(key);
    if (!data) return null;
    return JSON.parse(data) as T;
  }

  /**
   * Lưu dữ liệu vào cache (với thời gian sống)
   */
  static async set(key: string, value: any, ttlSeconds = 3600): Promise<void> {
    await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
  }

  /**
   * Xóa cache (dùng khi dữ liệu bị thay đổi)
   */
  static async del(key: string): Promise<void> {
    await redis.del(key);
  }
}
