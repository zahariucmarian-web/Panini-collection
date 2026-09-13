import { NextRequest, NextResponse } from "next/server";
import { db, isDatabaseConfigured } from "@/lib/db";

const globalCache = (globalThis as any)._localAlbumCache || new Map<string, any>();

// GET: Fetch album details (Strips the PIN field for security!)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id.toLowerCase();

  try {
    if (isDatabaseConfigured) {
      const data = await db.get<any>(`album:${id}`);
      if (data) {
        // Strip the PIN field before returning to prevent sniffing from the network tab
        const safeData = { ...data };
        delete safeData.pin;
        return NextResponse.json(safeData);
      }
    }
  } catch (error) {
    console.error(`Error reading from database for album ${id}:`, error);
  }

  // Fallback to local cache read
  if (globalCache.has(id)) {
    const data = globalCache.get(id);
    const safeData = { ...data };
    delete safeData.pin;
    return NextResponse.json(safeData);
  }

  // If album is not found anywhere, we return a 404
  return NextResponse.json({ error: "Albumul nu a fost găsit." }, { status: 404 });
}

// POST: Verify if the entered PIN matches the album's saved PIN (Secure server-side check)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id.toLowerCase();

  try {
    const body = await request.json();
    const enteredPin = body.pin;

    let existingData: any = null;
    if (isDatabaseConfigured) {
      existingData = await db.get(`album:${id}`);
    } else if (globalCache.has(id)) {
      existingData = globalCache.get(id);
    }

    if (!existingData) {
      return NextResponse.json({ error: "Albumul nu a fost găsit." }, { status: 404 });
    }

    const storedPin = existingData.pin || "1122"; // default fallback for backwards compatibility

    if (storedPin === enteredPin) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ success: false, error: "Cod PIN incorect." }, { status: 401 });
    }
  } catch (error) {
    return NextResponse.json({ error: "Format incorect al cererii." }, { status: 400 });
  }
}

// PUT: Save sticker edits (Preserves PIN and createdAt fields)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id.toLowerCase();
  
  try {
    const body = await request.json();

    // Retrieve existing data to keep stored PIN and createdAt intact
    let existingData: any = null;
    if (isDatabaseConfigured) {
      existingData = await db.get(`album:${id}`);
    } else if (globalCache.has(id)) {
      existingData = globalCache.get(id);
    }

    const storedPin = existingData?.pin || "1122";
    const createdAt = existingData?.createdAt || new Date().toISOString();

    const updatedData = {
      id,
      createdAt,
      updatedAt: new Date().toISOString(),
      stickers: body.stickers || {},
      pin: storedPin
    };

    try {
      if (isDatabaseConfigured) {
        await db.set(`album:${id}`, updatedData);
        return NextResponse.json({ success: true, isLocalFallback: false });
      }
    } catch (kvError) {
      console.error(`Error writing to database for album ${id}:`, kvError);
    }

    // Fallback write to memory cache
    globalCache.set(id, updatedData);
    return NextResponse.json({ success: true, isLocalFallback: true });
  } catch (error: any) {
    return NextResponse.json({ error: "Format incorect al cererii." }, { status: 400 });
  }
}
