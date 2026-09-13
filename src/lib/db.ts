import { createClient } from "@vercel/kv";

const kvUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const kvToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

// Create a unified database client supporting both Vercel KV and Upstash Redis env variables
export const db = createClient({
  url: kvUrl || "",
  token: kvToken || "",
});

export const isDatabaseConfigured = !!(kvUrl && kvToken);
