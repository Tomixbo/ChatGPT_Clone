// server/data.ts
import { open, Database } from "sqlite";
import sqlite3 from "sqlite3";
import invariant from "tiny-invariant";

// Types (vous pouvez enrichir ces types selon vos besoins)
export interface ChatMessage {
  role: string; // ex: "user", "assistant", "system", etc.
  content: string;
}

export interface SessionChat {
  id: string;
  title: string;
  createdAt: string;
  chatHistory: ChatMessage[];
}

let db: Database<sqlite3.Database, sqlite3.Statement>;

/**
 * Initialise la base de données SQLite et crée la table session_chats si nécessaire.
 */
export async function initDB() {
  db = await open({
    filename: "sqlite.db",
    driver: sqlite3.Database,
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS session_chats (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT,
      createdAt TEXT,
      chatHistory TEXT
    );
  `);
}

/**
 * Retourne toutes les sessions de chat.
 */
export async function getSessionChats(): Promise<SessionChat[]> {
  invariant(db, "La base de données n'est pas initialisée. Appelez initDB() en premier.");
  const rows = await db.all(`
    SELECT * FROM session_chats
    ORDER BY createdAt DESC
  `);
  return rows.map((row: any) => ({
    id: row.id,
    title: row.title,
    createdAt: row.createdAt,
    chatHistory: JSON.parse(row.chatHistory || "[]"),
  }));
}

/**
 * Retourne une session de chat par son id.
 */
export async function getSessionChat(id: string): Promise<SessionChat | null> {
  invariant(db, "La base de données n'est pas initialisée. Appelez initDB() en premier.");
  const row = await db.get(
    `SELECT * FROM session_chats WHERE id = ?`,
    id
  );
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    createdAt: row.createdAt,
    chatHistory: JSON.parse(row.chatHistory || "[]"),
  };
}

/**
 * Crée une nouvelle session de chat.
 */
export async function createSessionChat(values: Partial<SessionChat>): Promise<SessionChat> {
  invariant(db, "La base de données n'est pas initialisée. Appelez initDB() en premier.");
  const id = values.id || Math.random().toString(36).substring(2, 9);
  const createdAt = new Date().toISOString();
  await db.run(
    `INSERT INTO session_chats (id, title, createdAt, chatHistory)
     VALUES (?, ?, ?, ?)`,
    id,
    values.title,
    createdAt,
    JSON.stringify(values.chatHistory || [])
  );
  return {
    id,
    title: values.title || "",
    createdAt,
    chatHistory: values.chatHistory || [],
  };
}

/**
 * Met à jour une session de chat existante.
 */
export async function updateSessionChat(
  id: string,
  updates: Partial<SessionChat>
): Promise<SessionChat> {
  invariant(db, "La base de données n'est pas initialisée. Appelez initDB() en premier.");

  // Récupérer la session existante
  const existing = await getSessionChat(id);
  if (!existing) throw new Error(`Aucune session trouvée pour l'id: ${id}`);

  // Construire dynamiquement la requête en fonction des propriétés à mettre à jour
  const fields: string[] = [];
  const values: any[] = [];
  if (updates.title !== undefined) {
    fields.push("title = ?");
    values.push(updates.title);
  }
  if (updates.chatHistory !== undefined) {
    fields.push("chatHistory = ?");
    values.push(JSON.stringify(updates.chatHistory));
  }
  if (fields.length > 0) {
    await db.run(
      `UPDATE session_chats SET ${fields.join(", ")} WHERE id = ?`,
      ...values,
      id
    );
  }

  // Retourner la session mise à jour (fusion des valeurs existantes et des mises à jour)
  return { ...existing, ...updates, chatHistory: updates.chatHistory !== undefined ? updates.chatHistory : existing.chatHistory };
}




/**
 * Supprime une session de chat.
 */
export async function deleteSessionChat(id: string): Promise<void> {
  invariant(db, "La base de données n'est pas initialisée. Appelez initDB() en premier.");
  await db.run(`DELETE FROM session_chats WHERE id = ?`, id);
}
