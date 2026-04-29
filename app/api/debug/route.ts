import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    DB_PROVIDER: process.env.DB_PROVIDER ?? "(not set)",
    POSTGRES_URL_exists: !!process.env.POSTGRES_URL,
    POSTGRES_PRISMA_URL_exists: !!process.env.POSTGRES_PRISMA_URL,
    DATABASE_URL_exists: !!process.env.DATABASE_URL,
    NODE_ENV: process.env.NODE_ENV,
  });
}
