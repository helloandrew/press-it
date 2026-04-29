import "server-only";

import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { sql } from "@vercel/postgres";

export type Stats = {
  today: number;
  allTime: number;
};

export interface DatabaseAdapter {
  ensureUser(userUuid: string): Promise<void>;
  insertClick(input: { id: string; userUuid: string; clickedAt: Date }): Promise<void>;
  getStats(input: {
    userUuid: string;
    dayStartUtc: Date;
    dayEndUtc: Date;
  }): Promise<Stats>;
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

    async insertClick({ id, userUuid, clickedAt }) {
      db.prepare(
        `INSERT INTO clicks (id, user_uuid, clicked_at)
         VALUES (?, ?, ?)`
      ).run(id, userUuid, clickedAt.toISOString());
    },

    async getStats({ userUuid, dayStartUtc, dayEndUtc }) {
      const allTimeRow = db
        .prepare(`SELECT COUNT(*) AS count FROM clicks WHERE user_uuid = ?`)
        .get(userUuid) as { count: number };

      const todayRow = db
        .prepare(
          `SELECT COUNT(*) AS count
           FROM clicks
           WHERE user_uuid = ?
             AND clicked_at >= ?
             AND clicked_at < ?`
        )
        .get(userUuid, dayStartUtc.toISOString(), dayEndUtc.toISOString()) as {
        count: number;
      };

      return {
        today: Number(todayRow?.count ?? 0),
        allTime: Number(allTimeRow?.count ?? 0),
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

    async insertClick({ id, userUuid, clickedAt }) {
      await sql`
        INSERT INTO clicks (id, user_uuid, clicked_at)
        VALUES (${id}, ${userUuid}, ${clickedAt.toISOString()})
      `;
    },

    async getStats({ userUuid, dayStartUtc, dayEndUtc }) {
      const allTimeResult = await sql<{ count: string }>`
        SELECT COUNT(*)::text AS count
        FROM clicks
        WHERE user_uuid = ${userUuid}
      `;

      const todayResult = await sql<{ count: string }>`
        SELECT COUNT(*)::text AS count
        FROM clicks
        WHERE user_uuid = ${userUuid}
          AND clicked_at >= ${dayStartUtc.toISOString()}
          AND clicked_at < ${dayEndUtc.toISOString()}
      `;

      return {
        today: Number(todayResult.rows[0]?.count ?? 0),
        allTime: Number(allTimeResult.rows[0]?.count ?? 0),
      };
    },
  };
}

export function getDb(): DatabaseAdapter {
  const provider =
    process.env.DB_PROVIDER ?? (process.env.POSTGRES_URL ? "postgres" : "sqlite");

  return provider === "postgres" ? createPostgresAdapter() : createSqliteAdapter();
}
