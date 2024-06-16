import type { SchemaField } from "@crisvp/pocketbase-js";
import { ExtendedSchemaField, Row, Schemas } from "./types";
import { pascalCase } from "change-case";

/**
 * Translates '%%relation:collectionId' to 'CollectionNameCollection'.
 *
 * @param {ExtendedSchemaField} field
 * @param {Schemas} schemas
 * @returns {ExtendedSchemaField}
 */
export function translateRelation(field: ExtendedSchemaField, schemas: Schemas): ExtendedSchemaField {
  if (!field.tsType.startsWith("%%relation:")) return field;

  const collectionId = field.tsType.replace("%%relation:", "");
  const collectionName = schemas[collectionId].name;
  field.tsType = collectionName ? `${pascalCase(collectionName)}Collection` : "unknown";
  return field;
}

/**
 * Adds default fields to a collection schema.
 *
 * @param {Row} row
 * @returns {Row}
 */
export function addDefaultFields(row: Row): Row {
  const defaultFields: ExtendedSchemaField[] = [
    {
      id: "unknown",
      name: "id",
      type: "text",
      tsType: "string",
      required: true,
      system: false,
      presentable: true,
      options: {},
    },
    {
      id: "unknown",
      name: "created_at",
      type: "date",
      tsType: "Date",
      required: true,
      system: false,
      presentable: true,
      options: {},
    },
    {
      id: "unknown",
      name: "updated_at",
      type: "date",
      tsType: "Date",
      required: true,
      system: false,
      presentable: true,
      options: {},
    },
  ];

  return { ...row, schema: [...defaultFields, ...row.schema] };
}

/**
 * Adds TypeScript types to the schema fields.
 *
 * @param {Row} row
 * @returns {Row}
 */
export function addTsType(row: Row): Row {
  return {
    ...row,
    schema: row.schema.map((s) => ({ ...s, tsType: tsType(s) })),
  };
}

/**
 * Convert a Pocketbase schema field to a TypeScript type.
 *
 * @param {SchemaField} field
 * @returns {string}
 */
export function tsType(field: SchemaField): string {
  const { type } = field;
  switch (type) {
    case "text":
      return "string";
    case "date":
      return "Date";
    case "select":
      if (!Array.isArray(field.options.values)) return "unknown";
      return field.options.values.map((v: string) => `'${v}'`).join(" | ");
    case "relation":
      return `%%relation:${field.options.collectionId}`;
    default:
      return "unknown";
  }
}
