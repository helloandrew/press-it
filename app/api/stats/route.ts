import { NextRequest, NextResponse } from "next/server";

import { getDb } from "@/lib/db";

export const runtime = "nodejs";

function isValidUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

function isValidTimezoneOffset(value: number): boolean {
  return Number.isInteger(value) && value >= -840 && value <= 840;
}

function getLocalDateString(tzOffsetMinutes: number) {
  const now = new Date();
  const localMillis = now.getTime() - tzOffsetMinutes * 60_000;
  const localDate = new Date(localMillis);

  const year = localDate.getUTCFullYear();
  const month = String(localDate.getUTCMonth() + 1).padStart(2, "0");
  const day = String(localDate.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export async function GET(request: NextRequest) {
  try {
    const userUuid = request.nextUrl.searchParams.get("userUuid");
    const tzOffsetRaw = request.nextUrl.searchParams.get("tzOffsetMinutes");

    if (!userUuid || !isValidUuid(userUuid)) {
      return NextResponse.json({ ok: false, error: "Invalid userUuid" }, { status: 400 });
    }

    const tzOffsetMinutes = Number(tzOffsetRaw);

    if (!Number.isFinite(tzOffsetMinutes) || !isValidTimezoneOffset(tzOffsetMinutes)) {
      return NextResponse.json(
        { ok: false, error: "Invalid tzOffsetMinutes" },
        { status: 400 }
      );
    }

    const localDate = getLocalDateString(tzOffsetMinutes);
    const stats = await getDb().getStats({ userUuid, localDate });

    return NextResponse.json({ ok: true, stats });
  } catch (error) {
    console.error("GET /api/stats failed", error);
    return NextResponse.json({ ok: false, error: "Internal server error" }, { status: 500 });
  }
}
