import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";

// Global in-memory cache for local development fallback
// Using globalThis ensures this persists across hot reloads in dev mode
const globalCache = (globalThis as any)._localAlbumCache || new Map<string, any>();
if (!(globalThis as any)._localAlbumCache) {
  (globalThis as any)._localAlbumCache = globalCache;
}

// Generate a random 6-character alphanumeric code for the album
function generateUniqueId(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function POST() {
  const id = generateUniqueId();
  const initialData = {
    id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    stickers: {}
  };

  try {
    // Check if KV is configured
    if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
      // Ensure the generated ID is unique in Redis
      let isUnique = false;
      let finalId = id;
      let attempts = 0;
      
      while (!isUnique && attempts < 5) {
        const existing = await kv.get(`album:${finalId}`);
        if (!existing) {
          isUnique = true;
        } else {
          finalId = generateUniqueId();
          attempts++;
        }
      }
      
      initialData.id = finalId;
      await kv.set(`album:${finalId}`, initialData);
      
      return NextResponse.json({ id: finalId, isLocalFallback: false });
    }
  } catch (error) {
    console.error("Vercel KV connection error, falling back to local memory:", error);
  }

  // Fallback to local memory cache (useful for dev mode or local testing)
  globalCache.set(id, initialData);
  return NextResponse.json({ id, isLocalFallback: true });
}
