import { NextResponse } from "next/server";

import { getDb } from "@/lib/db";

export const runtime = "nodejs";

type ClickRequest = {
  userUuid?: unknown;
  tzOffsetMinutes?: unknown;
};

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

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ClickRequest;
    const { userUuid, tzOffsetMinutes } = body;

    if (typeof userUuid !== "string" || !isValidUuid(userUuid)) {
      return NextResponse.json({ ok: false, error: "Invalid userUuid" }, { status: 400 });
    }

    if (typeof tzOffsetMinutes !== "number" || !isValidTimezoneOffset(tzOffsetMinutes)) {
      return NextResponse.json(
        { ok: false, error: "Invalid tzOffsetMinutes" },
        { status: 400 }
      );
    }

    const localDate = getLocalDateString(tzOffsetMinutes);
    const db = getDb();

    await db.ensureUser(userUuid);
    await db.insertClick({ userUuid, localDate });

    const stats = await db.getStats({ userUuid, localDate });

    return NextResponse.json({ ok: true, stats });
  } catch (error) {
    console.error("POST /api/click failed", error);
    return NextResponse.json({ ok: false, error: "Internal server error" }, { status: 500 });
  }
}
