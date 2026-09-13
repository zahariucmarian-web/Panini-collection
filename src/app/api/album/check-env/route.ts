import { NextResponse } from "next/server";

export async function GET() {
  const envKeys = Object.keys(process.env);
  
  // Filter for environment keys related to Redis, KV, or Upstash (without printing secrets!)
  const dbRelatedKeys = envKeys.filter(key => 
    key.includes("KV") || 
    key.includes("REDIS") || 
    key.includes("UPSTASH") || 
    key.includes("REST_API") ||
    key.includes("URL") ||
    key.includes("TOKEN")
  );

  return NextResponse.json({
    success: true,
    detectedKeys: dbRelatedKeys,
    vercelEnv: process.env.VERCEL || "not detected",
    nodeEnv: process.env.NODE_ENV || "not detected"
  });
}
