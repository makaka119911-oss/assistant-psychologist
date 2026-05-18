/**
 * SQLite — сессии. AsyncStorage — настройки.
 */
import * as SQLite from "expo-sqlite";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { DEFAULT_SETTINGS, STORAGE_KEYS } from "../utils/constants";

let db = null;

async function getDb() {
  if (!db) {
    db = await SQLite.openDatabaseAsync("psychologist.db");
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        duration_minutes INTEGER NOT NULL DEFAULT 0,
        transcript TEXT NOT NULL DEFAULT '',
        analysis TEXT,
        client_name TEXT DEFAULT '',
        status TEXT NOT NULL DEFAULT 'recording',
        pending_analysis INTEGER NOT NULL DEFAULT 0,
        audio_uri TEXT,
        started_at TEXT,
        ended_at TEXT,
        error_message TEXT
      );
    `);
  }
  return db;
}

function rowToSession(row) {
  return {
    id: row.id,
    date: row.date,
    durationMinutes: row.duration_minutes || 0,
    transcript: row.transcript || "",
    analysisJson: row.analysis || null,
    clientName: row.client_name || "",
    status: row.status,
    pendingAnalysis: !!row.pending_analysis,
    audioUri: row.audio_uri,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    errorMessage: row.error_message,
  };
}

/** Настройки приложения */
export async function loadSettings() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.settings);
    if (!raw) return { ...DEFAULT_SETTINGS };
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export async function saveSettings(settings) {
  await AsyncStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
}

/** Новая сессия */
export async function createSession(clientName = "") {
  const database = await getDb();
  const now = new Date().toISOString();
  const r = await database.runAsync(
    `INSERT INTO sessions (date, started_at, client_name, status) VALUES (?, ?, ?, 'recording')`,
    [now, now, clientName],
  );
  return {
    id: r.lastInsertRowId,
    date: now,
    durationMinutes: 0,
    transcript: "",
    clientName,
    status: "recording",
    pendingAnalysis: false,
    startedAt: now,
  };
}

export async function updateSession(id, patch) {
  const database = await getDb();
  const sets = [];
  const vals = [];

  const map = {
    clientName: ["client_name", (v) => v],
    transcript: ["transcript", (v) => v],
    analysis: ["analysis", (v) => JSON.stringify(v)],
    status: ["status", (v) => v],
    pendingAnalysis: ["pending_analysis", (v) => (v ? 1 : 0)],
    audioUri: ["audio_uri", (v) => v],
    endedAt: ["ended_at", (v) => v],
    errorMessage: ["error_message", (v) => v],
    durationMinutes: ["duration_minutes", (v) => v],
  };

  for (const [key, [col, fn]] of Object.entries(map)) {
    if (patch[key] !== undefined) {
      sets.push(`${col} = ?`);
      vals.push(fn(patch[key]));
    }
  }

  if (patch.endedAt) {
    const row = await database.getFirstAsync(
      "SELECT started_at FROM sessions WHERE id = ?",
      [id],
    );
    if (row?.started_at && patch.durationMinutes === undefined) {
      const min = Math.max(
        1,
        Math.round(
          (new Date(patch.endedAt).getTime() - new Date(row.started_at).getTime()) / 60000,
        ),
      );
      sets.push("duration_minutes = ?");
      vals.push(min);
    }
  }

  if (!sets.length) return;
  vals.push(id);
  await database.runAsync(`UPDATE sessions SET ${sets.join(", ")} WHERE id = ?`, vals);
}

export async function getSession(id) {
  const database = await getDb();
  const row = await database.getFirstAsync("SELECT * FROM sessions WHERE id = ?", [id]);
  return row ? rowToSession(row) : null;
}

/** История — завершённые и ожидающие анализа */
export async function listSessions() {
  const database = await getDb();
  const rows = await database.getAllAsync(
    `SELECT * FROM sessions WHERE status != 'recording' ORDER BY date DESC`,
  );
  return rows.map(rowToSession);
}

export async function listPendingAnalysis() {
  const database = await getDb();
  const rows = await database.getAllAsync(
    `SELECT * FROM sessions WHERE pending_analysis = 1 ORDER BY date DESC`,
  );
  return rows.map(rowToSession);
}

export function parseAnalysis(session) {
  if (!session?.analysisJson) return null;
  try {
    return JSON.parse(session.analysisJson);
  } catch {
    return null;
  }
}
