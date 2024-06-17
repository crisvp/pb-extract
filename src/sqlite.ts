import sqlite3 from "sqlite3";
import fs from "fs";
import path from "path";
import { CollectionDescriptionRaw, CollectionDescription } from "./types";
import { normalizeDescriptions } from "./translations.js";

/**
 * Open the database file.
 *
 * @param {string} fileName
 * @returns {sqlite3.Database}
 */
function openDatabase(fileName: string): sqlite3.Database {
  if (!fs.existsSync(fileName)) throw new Error(`File not found: ${fileName}`);
  return new sqlite3.Database(path.resolve(fileName), sqlite3.OPEN_READONLY);
}

/**
 * Reads the schema from a Pocketbase database. This uses the schema
 * as defined in Pocketbase, _not_ the schema as defined in SQLite.
 *
 * @param {sqlite3.Database} db Database object to extract types from
 * @returns {Promise<CollectionDescriptionRaw[]>}
 */
function collectionsTable(db: sqlite3.Database): Promise<CollectionDescriptionRaw[]> {
  return new Promise<CollectionDescriptionRaw[]>((resolve, reject) => {
    db.all("select id, type, name, schema from `_collections`", function (err, rows: CollectionDescriptionRaw[]) {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

/**
 * Reads a Pocketbase database file and returns normalized collection descriptions.
 *
 * @export
 * @async
 * @param {string} inputFile - Path to the input database file
 * @returns {Promise<CollectionDescription[]>}
 */
export async function readCollections(inputFile: string): Promise<CollectionDescription[]> {
  const db = openDatabase(inputFile);

  const schema = await collectionsTable(db);
  const extendedSchemas = normalizeDescriptions(schema);

  return extendedSchemas;
}
