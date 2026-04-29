import { randomUUID } from "node:crypto";

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

function getUtcDayBounds(tzOffsetMinutes: number) {
  const now = new Date();
  const localMillis = now.getTime() - tzOffsetMinutes * 60_000;
  const localDate = new Date(localMillis);

  const dayStartUtc = new Date(
    Date.UTC(
      localDate.getUTCFullYear(),
      localDate.getUTCMonth(),
      localDate.getUTCDate(),
      0,
      0,
      0,
      0
    ) + tzOffsetMinutes * 60_000
  );

  const dayEndUtc = new Date(dayStartUtc.getTime() + 24 * 60 * 60 * 1000);

  return { dayStartUtc, dayEndUtc };
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

    const db = getDb();
    const clickedAt = new Date();

    await db.ensureUser(userUuid);
    await db.insertClick({
      id: randomUUID(),
      userUuid,
      clickedAt,
    });

    const { dayStartUtc, dayEndUtc } = getUtcDayBounds(tzOffsetMinutes);
    const stats = await db.getStats({ userUuid, dayStartUtc, dayEndUtc });

    return NextResponse.json({ ok: true, stats });
  } catch (error) {
    console.error("POST /api/click failed", error);
    return NextResponse.json({ ok: false, error: "Internal server error" }, { status: 500 });
  }
}
