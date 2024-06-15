import path from "path";
import fs from "fs";
import handlebars from "./handlebars.js";
import { getSchema, openDatabase } from "./sqlite.js";
import { Schemas } from "./types.js";
import { addDefaultFields, addTsType, translateRelation } from "./translations.js";

/**
 * Reads a Pocketbase database file and outputs a d.ts file describing its collections.
 *
 * @export
 * @async
 * @param {string} inputFile - Path to the input database file
 * @returns {Promise<string>}
 */
export async function extractTypes(inputFile: string): Promise<string> {
  const db = openDatabase(inputFile);

  const tables = await getSchema(db);

  const extendedTables = tables.map((t) => addDefaultFields(t)).map((t) => addTsType(t));

  const schemas: Schemas = {};
  extendedTables.forEach((t) => (schemas[t.id] = { name: t.name, schema: t.schema }));
  extendedTables.forEach((t) => (t.schema = t.schema.map((s) => translateRelation(s, schemas))));

  const tpl = fs.readFileSync(path.join(import.meta.dirname, "out.d.ts.hbs"), "utf-8");
  const delegate = handlebars.compile(tpl);

  return delegate({ tables: schemas });
}
