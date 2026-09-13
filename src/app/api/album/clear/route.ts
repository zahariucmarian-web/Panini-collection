import { NextRequest, NextResponse } from "next/server";
import { db, isDatabaseConfigured } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const confirm = searchParams.get("confirm");

  // Require a simple confirmation parameter to prevent accidental deletion
  if (confirm !== "da") {
    return NextResponse.json(
      { 
        error: "Pentru a confirma ștergerea tuturor albumelor de test, te rugăm să adaugi '?confirm=da' la finalul adresei URL din browser." 
      }, 
      { status: 400 }
    );
  }

  try {
    let deletedCount = 0;

    if (isDatabaseConfigured) {
      // Find all keys starting with 'album:*'
      const allKeys = await db.keys("album:*");
      if (allKeys.length > 0) {
        // Delete all found album keys
        await db.del(...allKeys);
        deletedCount = allKeys.length;
      }
    }

    // Also clear global in-memory cache if running locally or as fallback
    const globalCache = (globalThis as any)._localAlbumCache;
    if (globalCache) {
      deletedCount += globalCache.size;
      globalCache.clear();
    }

    return NextResponse.json({ 
      success: true, 
      message: `Curățenie finalizată! Am șters cu succes toate cele ${deletedCount} albume de test din baza de date.` 
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
