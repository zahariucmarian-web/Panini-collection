import { createClient } from "@vercel/kv";
import Redis from "ioredis";

const kvUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const kvToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const redisUrl = process.env.REDIS_URL;

// Re-use connection instances to prevent connection exhaustion in serverless containers
let vercelKvClient: any = null;
let tcpRedisClient: Redis | null = null;

if (redisUrl) {
  if (!(globalThis as any)._globalTcpRedisClient) {
    (globalThis as any)._globalTcpRedisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
    });
  }
  tcpRedisClient = (globalThis as any)._globalTcpRedisClient;
} else if (kvUrl && kvToken) {
  if (!(globalThis as any)._globalVercelKvClient) {
    (globalThis as any)._globalVercelKvClient = createClient({
      url: kvUrl,
      token: kvToken,
    });
  }
  vercelKvClient = (globalThis as any)._globalVercelKvClient;
}

export const isDatabaseConfigured = !!(redisUrl || (kvUrl && kvToken));

export const db = {
  async get<T>(key: string): Promise<T | null> {
    if (tcpRedisClient) {
      const data = await tcpRedisClient.get(key);
      if (!data) return null;
      try {
        return JSON.parse(data) as T;
      } catch (e) {
        return data as unknown as T;
      }
    } else if (vercelKvClient) {
      return (await vercelKvClient.get(key)) as T;
    }
    return null;
  },

  async set(key: string, value: any): Promise<void> {
    if (tcpRedisClient) {
      const serialized = typeof value === "string" ? value : JSON.stringify(value);
      await tcpRedisClient.set(key, serialized);
    } else if (vercelKvClient) {
      await vercelKvClient.set(key, value);
    }
  },

  async keys(pattern: string): Promise<string[]> {
    if (tcpRedisClient) {
      return await tcpRedisClient.keys(pattern);
    } else if (vercelKvClient) {
      return await vercelKvClient.keys(pattern);
    }
    return [];
  },

  async del(...keys: string[]): Promise<void> {
    if (keys.length === 0) return;
    if (tcpRedisClient) {
      await tcpRedisClient.del(...keys);
    } else if (vercelKvClient) {
      await vercelKvClient.del(...keys);
    }
  }
};
