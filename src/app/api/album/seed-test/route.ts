import { NextResponse } from "next/server";
import { db, isDatabaseConfigured } from "@/lib/db";

const marianAlbum = {
  id: "test-marian",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  pin: "1234",
  stickers: {
    "MEX 1": 2, // Duplicate (Ozana needs it)
    "MEX 2": 1, // Owned
    "MEX 3": 2, // Duplicate (Ozana needs it)
    "MEX 4": 1, // Owned
    "RSA 1": 1, // Missing Ozana's duplicate
    "RSA 2": 2, // Duplicate (Ozana needs it)
    "RSA 3": 1,
    "CAN 1": 1, // Missing Ozana's duplicate
    "CAN 2": 2, // Duplicate
    "SUI 5": 1,
    "BRA 1": 3, // Duplicate
    "BRA 2": 1,
    "MAR 1": 1,
    "NED 1": 2, // Duplicate (Ozana needs it)
    "NED 2": 1
  }
};

const ozanaAlbum = {
  id: "test-ozana",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  pin: "1234",
  stickers: {
    "MEX 1": 1, // Missing Marian's duplicate
    "MEX 2": 2, // Duplicate (Marian needs it)
    "MEX 3": 1, // Missing Marian's duplicate
    "MEX 4": 2, // Duplicate (Marian needs it)
    "RSA 1": 2, // Duplicate (Marian needs it)
    "RSA 2": 1, // Missing Marian's duplicate
    "RSA 3": 2, // Duplicate
    "CAN 1": 2, // Duplicate (Marian needs it)
    "CAN 2": 1, // Missing Marian's duplicate
    "SUI 5": 2, // Duplicate (Marian needs it)
    "BRA 1": 1, // Missing Marian's duplicate
    "BRA 2": 2, // Duplicate (Marian needs it)
    "MAR 2": 1,
    "NED 1": 1, // Missing Marian's duplicate
    "NED 2": 2  // Duplicate (Marian needs it)
  }
};

export async function GET() {
  try {
    // 1. Seed active database if configured (e.g. Production/Redis)
    if (isDatabaseConfigured) {
      await db.set("album:test-marian", marianAlbum);
      await db.set("album:test-ozana", ozanaAlbum);
    }

    // 2. Always seed the global in-memory local cache as well (for local development fallback!)
    const globalCache = (globalThis as any)._localAlbumCache || new Map<string, any>();
    if (!(globalThis as any)._localAlbumCache) {
      (globalThis as any)._localAlbumCache = globalCache;
    }

    globalCache.set("test-marian", marianAlbum);
    globalCache.set("test-ozana", ozanaAlbum);

    return NextResponse.json({
      success: true,
      message: "Albumele de test au fost create cu succes în baza de date și în memoria cache locală! Poți compara 'test-marian' și 'test-ozana'.",
      albums: ["test-marian", "test-ozana"],
      databaseSeeded: isDatabaseConfigured,
      localCacheSeeded: true
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || "A apărut o eroare la salvarea albumelor de test."
    }, { status: 500 });
  }
}
