import sqlite3 from "sqlite3";
import fs from "fs";
import path from "path";
import { RawRow, Row } from "./types";

/**
 * Utility function to open the database.
 *
 * @param {string} fileName
 * @returns {sqlite3.Database}
 */
export function openDatabase(fileName: string): sqlite3.Database {
  if (!fs.existsSync(fileName)) throw new Error(`File not found: ${fileName}`);
  return new sqlite3.Database(path.resolve(fileName), sqlite3.OPEN_READONLY, (err) => {
    if (err) throw err;
  });
}

/**
 * Reads the schema from a Pocketbase database. This uses the schema
 * as defined in Pocketbase, _not_ the schema as defined in SQLite.
 *
 * @param {sqlite3.Database} db Database object to extract types from
 * @returns {Promise<Row[]>}
 */
export function getSchema(db: sqlite3.Database): Promise<Row[]> {
  return new Promise<Row[]>((resolve, reject) => {
    db.all("select id, type, name, schema from `_collections`", function (err, rows: RawRow[]) {
      if (err) reject(err);
      else {
        const processed = rows.map((row) => ({ ...row, schema: JSON.parse(row.schema) }));

        resolve(processed);
      }
    });
  });
}
