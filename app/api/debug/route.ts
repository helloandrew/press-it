import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  // Check all plausible DB connection env var names
  const keys = Object.keys(process.env).filter(k =>
    k.includes('POSTGRES') || k.includes('DATABASE') || k.includes('NEON') || k.includes('PG') || k === 'DB_PROVIDER'
  );
  return NextResponse.json({
    DB_PROVIDER: process.env.DB_PROVIDER ?? "(not set)",
    NODE_ENV: process.env.NODE_ENV,
    db_related_env_keys: keys,
  });
}
