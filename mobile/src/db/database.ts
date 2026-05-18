import * as SQLite from "expo-sqlite";
import type { DeepSeekResult, Session, SessionStatus } from "@/types/session";

const DB_VERSION = 2;
let db: SQLite.SQLiteDatabase | null = null;

function rowToSession(row: Record<string, unknown>): Session {
  return {
    id: Number(row.id),
    date: String(row.date || row.started_at || new Date().toISOString()),
    durationMinutes: Number(row.duration_minutes ?? 0),
    transcript: String(row.transcript || ""),
    analysisJson: row.analysis ? String(row.analysis) : row.analysis_json ? String(row.analysis_json) : null,
    clientName: String(row.client_name || ""),
    status: String(row.status || "done") as SessionStatus,
    startedAt: row.started_at ? String(row.started_at) : null,
    endedAt: row.ended_at ? String(row.ended_at) : null,
    audioUri: row.audio_uri ? String(row.audio_uri) : null,
    errorMessage: row.error_message ? String(row.error_message) : null,
  };
}

async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!db) await initDatabase();
  return db!;
}

async function migrateIfNeeded(database: SQLite.SQLiteDatabase): Promise<void> {
  const ver = await database.getFirstAsync<{ user_version: number }>("PRAGMA user_version");
  const current = ver?.user_version ?? 0;
  if (current >= DB_VERSION) return;

  const tables = await database.getAllAsync<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='sessions'",
  );
  const hasOld = tables.length > 0;
  const cols = hasOld
    ? await database.getAllAsync<{ name: string; type: string }>("PRAGMA table_info(sessions)")
    : [];
  const idCol = cols.find((c) => c.name === "id");
  const isTextId = idCol?.type?.toUpperCase() === "TEXT";

  if (hasOld && isTextId) {
    await database.execAsync(`
      CREATE TABLE sessions_v2 (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        duration_minutes INTEGER NOT NULL DEFAULT 0,
        transcript TEXT NOT NULL DEFAULT '',
        analysis TEXT,
        client_name TEXT DEFAULT '',
        status TEXT NOT NULL DEFAULT 'recording',
        started_at TEXT,
        ended_at TEXT,
        audio_uri TEXT,
        error_message TEXT
      );
      INSERT INTO sessions_v2 (date, duration_minutes, transcript, analysis, client_name, status, started_at, ended_at, audio_uri, error_message)
      SELECT
        COALESCE(started_at, datetime('now')),
        0,
        COALESCE(transcript, ''),
        analysis_json,
        COALESCE(client_name, ''),
        COALESCE(status, 'done'),
        started_at,
        ended_at,
        audio_uri,
        error_message
      FROM sessions;
      DROP TABLE sessions;
      ALTER TABLE sessions_v2 RENAME TO sessions;
    `);
  } else if (!hasOld) {
    await database.execAsync(`
      CREATE TABLE sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        duration_minutes INTEGER NOT NULL DEFAULT 0,
        transcript TEXT NOT NULL DEFAULT '',
        analysis TEXT,
        client_name TEXT DEFAULT '',
        status TEXT NOT NULL DEFAULT 'recording',
        started_at TEXT,
        ended_at TEXT,
        audio_uri TEXT,
        error_message TEXT
      );
    `);
  } else {
    const names = cols.map((c) => c.name);
    if (!names.includes("duration_minutes")) {
      await database.execAsync(
        "ALTER TABLE sessions ADD COLUMN duration_minutes INTEGER NOT NULL DEFAULT 0",
      );
    }
    if (!names.includes("date")) {
      await database.execAsync("ALTER TABLE sessions ADD COLUMN date TEXT");
      await database.execAsync("UPDATE sessions SET date = COALESCE(started_at, datetime('now'))");
    }
    if (!names.includes("analysis") && names.includes("analysis_json")) {
      await database.execAsync("ALTER TABLE sessions ADD COLUMN analysis TEXT");
      await database.execAsync("UPDATE sessions SET analysis = analysis_json");
    }
  }

  await database.execAsync(`PRAGMA user_version = ${DB_VERSION}`);
}

export async function initDatabase(): Promise<void> {
  if (db) return;
  db = await SQLite.openDatabaseAsync("psychologist.db");
  await db.execAsync("PRAGMA journal_mode = WAL;");
  await migrateIfNeeded(db);
}

export async function createSession(clientName = ""): Promise<Session> {
  const database = await getDb();
  const now = new Date().toISOString();
  const result = await database.runAsync(
    `INSERT INTO sessions (date, started_at, client_name, status) VALUES (?, ?, ?, 'recording')`,
    [now, now, clientName],
  );
  const id = result.lastInsertRowId;
  return {
    id,
    date: now,
    durationMinutes: 0,
    transcript: "",
    analysisJson: null,
    clientName,
    status: "recording",
    startedAt: now,
    endedAt: null,
    audioUri: null,
    errorMessage: null,
  };
}

function calcDurationMinutes(startedAt: string | null, endedAt: string): number {
  if (!startedAt) return 0;
  const ms = new Date(endedAt).getTime() - new Date(startedAt).getTime();
  return Math.max(1, Math.round(ms / 60_000));
}

export async function updateSession(
  id: number,
  patch: Partial<{
    clientName: string;
    transcript: string;
    audioUri: string;
    analysis: DeepSeekResult;
    status: SessionStatus;
    errorMessage: string;
    endedAt: string;
    durationMinutes: number;
  }>,
): Promise<void> {
  const database = await getDb();
  const sets: string[] = [];
  const values: unknown[] = [];

  if (patch.clientName !== undefined) {
    sets.push("client_name = ?");
    values.push(patch.clientName);
  }
  if (patch.transcript !== undefined) {
    sets.push("transcript = ?");
    values.push(patch.transcript);
  }
  if (patch.audioUri !== undefined) {
    sets.push("audio_uri = ?");
    values.push(patch.audioUri);
  }
  if (patch.analysis !== undefined) {
    sets.push("analysis = ?");
    values.push(JSON.stringify(patch.analysis));
  }
  if (patch.status !== undefined) {
    sets.push("status = ?");
    values.push(patch.status);
  }
  if (patch.errorMessage !== undefined) {
    sets.push("error_message = ?");
    values.push(patch.errorMessage);
  }
  if (patch.endedAt !== undefined) {
    sets.push("ended_at = ?");
    values.push(patch.endedAt);
    const row = await database.getFirstAsync<{ started_at: string }>(
      "SELECT started_at FROM sessions WHERE id = ?",
      [id],
    );
    if (patch.durationMinutes === undefined && row?.started_at) {
      sets.push("duration_minutes = ?");
      values.push(calcDurationMinutes(row.started_at, patch.endedAt));
    }
  }
  if (patch.durationMinutes !== undefined) {
    sets.push("duration_minutes = ?");
    values.push(patch.durationMinutes);
  }

  if (!sets.length) return;
  values.push(id);
  await database.runAsync(`UPDATE sessions SET ${sets.join(", ")} WHERE id = ?`, values);
}

export async function getSession(id: number): Promise<Session | null> {
  const database = await getDb();
  const row = await database.getFirstAsync<Record<string, unknown>>(
    "SELECT * FROM sessions WHERE id = ?",
    [id],
  );
  return row ? rowToSession(row) : null;
}

export async function listSessions(onlyFinished = false): Promise<Session[]> {
  const database = await getDb();
  const sql = onlyFinished
    ? `SELECT * FROM sessions WHERE status IN ('done', 'error') ORDER BY date DESC`
    : `SELECT * FROM sessions WHERE status != 'recording' ORDER BY date DESC`;
  const rows = await database.getAllAsync<Record<string, unknown>>(sql);
  return rows.map(rowToSession);
}

export async function deleteSession(id: number): Promise<void> {
  const database = await getDb();
  await database.runAsync("DELETE FROM sessions WHERE id = ?", [id]);
}

export function parseAnalysis(session: Session): DeepSeekResult | null {
  if (!session.analysisJson) return null;
  try {
    return JSON.parse(session.analysisJson) as DeepSeekResult;
  } catch {
    return null;
  }
}
