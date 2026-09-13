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

export async function POST(request: Request) {
  let chosenPin = "1122"; // default fallback PIN
  
  try {
    const body = await request.json();
    if (body && typeof body.pin === "string" && body.pin.length === 4) {
      chosenPin = body.pin;
    }
  } catch (e) {
    // No body or invalid JSON, ignore and use default pin
  }

  const id = generateUniqueId();
  const initialData = {
    id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    stickers: {},
    pin: chosenPin
  };

  const isVercel = process.env.VERCEL === "1" || process.env.NODE_ENV === "production";

  // If on Vercel/production, strictly require KV to prevent stateless container bugs
  if (isVercel && (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN)) {
    return NextResponse.json({ 
      error: "Baza de date Vercel KV nu este conectată la acest proiect Vercel! Intră în panoul Vercel al proiectului panini-collection-mzrd și dă click pe 'Storage' pentru a adăuga baza de date." 
    }, { status: 500 });
  }

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
  } catch (error: any) {
    console.error("Vercel KV connection error:", error);
    if (isVercel) {
      return NextResponse.json({ 
        error: `Eroare de conexiune la baza de date Vercel KV: ${error.message}. Verifică setările Storage în Vercel.` 
      }, { status: 500 });
    }
  }

  // Fallback to local memory cache (only for local development)
  globalCache.set(id, initialData);
  return NextResponse.json({ id, isLocalFallback: true });
}
