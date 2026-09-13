import { NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";

const globalCache = (globalThis as any)._localAlbumCache || new Map<string, any>();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id.toLowerCase();

  try {
    if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
      const data = await kv.get(`album:${id}`);
      if (data) {
        return NextResponse.json(data);
      }
    }
  } catch (error) {
    console.error(`Error reading from Vercel KV for album ${id}:`, error);
  }

  // Fallback to local cache read
  if (globalCache.has(id)) {
    return NextResponse.json(globalCache.get(id));
  }

  // If album is not found anywhere, we return a 404
  return NextResponse.json({ error: "Albumul nu a fost găsit." }, { status: 404 });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id.toLowerCase();
  
  try {
    const body = await request.json();
    const updatedData = {
      id,
      createdAt: body.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      stickers: body.stickers || {}
    };

    try {
      if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
        await kv.set(`album:${id}`, updatedData);
        return NextResponse.json({ success: true, isLocalFallback: false });
      }
    } catch (kvError) {
      console.error(`Error writing to Vercel KV for album ${id}:`, kvError);
    }

    // Fallback write to memory cache
    globalCache.set(id, updatedData);
    return NextResponse.json({ success: true, isLocalFallback: true });
  } catch (error: any) {
    return NextResponse.json({ error: "Format incorect al cererii." }, { status: 400 });
  }
}
