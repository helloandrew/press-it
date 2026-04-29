import "server-only";

import fs from "node:fs";
import path from "node:path";

import { sql } from "@vercel/postgres";
import Database from "better-sqlite3";

export type Stats = {
  today: number;
  allTime: number;
  globalTotal: number;
};

export interface DatabaseAdapter {
  ensureUser(userUuid: string): Promise<void>;
  insertClick(input: { userUuid: string; localDate: string }): Promise<void>;
  getStats(input: { userUuid: string; localDate: string }): Promise<Stats>;
}

type SqliteDatabase = Database.Database;

declare global {
  var __pressItSqliteDb: SqliteDatabase | undefined;
}

const SQLITE_DB_PATH = path.join(process.cwd(), "db", "pressit.db");

function getSqliteConnection(): SqliteDatabase {
  if (!global.__pressItSqliteDb) {
    fs.mkdirSync(path.dirname(SQLITE_DB_PATH), { recursive: true });
    global.__pressItSqliteDb = new Database(SQLITE_DB_PATH);
    global.__pressItSqliteDb.pragma("foreign_keys = ON");
  }

  return global.__pressItSqliteDb;
}

function createSqliteAdapter(): DatabaseAdapter {
  const db = getSqliteConnection();

  return {
    async ensureUser(userUuid) {
      db.prepare(
        `INSERT OR IGNORE INTO users (uuid, first_seen_at, city)
         VALUES (?, ?, NULL)`
      ).run(userUuid, new Date().toISOString());
    },

    async insertClick({ userUuid, localDate }) {
      db.prepare(
        `INSERT INTO click_counts (user_uuid, date, count)
         VALUES (?, ?, 1)
         ON CONFLICT (user_uuid, date) DO UPDATE SET count = count + 1`
      ).run(userUuid, localDate);
    },

    async getStats({ userUuid, localDate }) {
      const todayRow = db
        .prepare(
          `SELECT COALESCE(SUM(count), 0) AS count
           FROM click_counts
           WHERE user_uuid = ? AND date = ?`
        )
        .get(userUuid, localDate) as { count: number };

      const allTimeRow = db
        .prepare(
          `SELECT COALESCE(SUM(count), 0) AS count
           FROM click_counts
           WHERE user_uuid = ?`
        )
        .get(userUuid) as { count: number };

      const globalTotalRow = db
        .prepare(
          `SELECT COALESCE(SUM(count), 0) AS count
           FROM click_counts`
        )
        .get() as { count: number };

      return {
        today: Number(todayRow?.count ?? 0),
        allTime: Number(allTimeRow?.count ?? 0),
        globalTotal: Number(globalTotalRow?.count ?? 0),
      };
    },
  };
}

function createPostgresAdapter(): DatabaseAdapter {
  return {
    async ensureUser(userUuid) {
      await sql`
        INSERT INTO users (uuid, first_seen_at, city)
        VALUES (${userUuid}, ${new Date().toISOString()}, NULL)
        ON CONFLICT (uuid) DO NOTHING
      `;
    },

    async insertClick({ userUuid, localDate }) {
      await sql`
        INSERT INTO click_counts (user_uuid, date, count)
        VALUES (${userUuid}, ${localDate}, 1)
        ON CONFLICT (user_uuid, date) DO UPDATE SET count = click_counts.count + 1
      `;
    },

    async getStats({ userUuid, localDate }) {
      const todayResult = await sql<{ count: string }>`
        SELECT COALESCE(SUM(count), 0)::text AS count
        FROM click_counts
        WHERE user_uuid = ${userUuid} AND date = ${localDate}
      `;

      const allTimeResult = await sql<{ count: string }>`
        SELECT COALESCE(SUM(count), 0)::text AS count
        FROM click_counts
        WHERE user_uuid = ${userUuid}
      `;

      const globalTotalResult = await sql<{ count: string }>`
        SELECT COALESCE(SUM(count), 0)::text AS count
        FROM click_counts
      `;

      return {
        today: Number(todayResult.rows[0]?.count ?? 0),
        allTime: Number(allTimeResult.rows[0]?.count ?? 0),
        globalTotal: Number(globalTotalResult.rows[0]?.count ?? 0),
      };
    },
  };
}

export function getDb(): DatabaseAdapter {
  const provider =
    process.env.DB_PROVIDER ?? (process.env.POSTGRES_URL ? "postgres" : "sqlite");

  return provider === "postgres" ? createPostgresAdapter() : createSqliteAdapter();
}
