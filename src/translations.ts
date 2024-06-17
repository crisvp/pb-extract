import type { SchemaField } from "@crisvp/pocketbase-js";
import { ExtendedSchemaField, CollectionDescriptionRaw, CollectionDescription } from "./types";
import { pascalCase } from "change-case";

/**
 * Describes a collection of Pocketbase collections.
 */
export type SchemaTranslations = Record<string, Omit<CollectionDescription, "id" | "type">>;

/**
 * Translates '%%relation:collectionId' to 'CollectionNameCollection'.
 *
 * @param {ExtendedSchemaField} field
 * @param {SchemaTranslations} schemas
 * @returns {ExtendedSchemaField}
 */
export function translateRelation(field: ExtendedSchemaField, schemas: SchemaTranslations): ExtendedSchemaField {
  if (!field.tsType.startsWith("%%relation:")) return field;

  const collectionId = field.tsType.replace("%%relation:", "");
  const collectionName = schemas[collectionId]?.name;
  field.tsType = collectionName ? `${pascalCase(collectionName)}Collection` : "unknown";
  return field;
}

/**
 * Adds default fields to a collection schema.
 *
 * @param {CollectionDescription} row
 * @returns {CollectionDescription}
 */
export function addDefaultFields(row: CollectionDescription): CollectionDescription {
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
 * Extends a schema field with a TypeScript type.
 *
 * This creates a copy of the input field with an additional 'tsType' property.
 * The original field is not modified.
 *
 * @param {SchemaField} field  - the input SchemaField
 * @returns {ExtendedSchemaField} - the extended field
 */
export function extendField(field: SchemaField): ExtendedSchemaField {
  return {
    ...field,
    tsType: tsType(field),
  };
}

/**
 * Find the typescript type for a schema field.
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

export function normalizeDescriptions(
  rows: Partial<CollectionDescription>[] | CollectionDescriptionRaw[],
): CollectionDescription[] {
  if (!Array.isArray(rows)) return [];

  const processed = rows
    /* Step 1: Parse the schema field, if needed. */
    .map((row: Partial<CollectionDescription> | CollectionDescriptionRaw) => ({
      ...row,
      schema: Array.isArray(row.schema) ? row.schema : (JSON.parse(row.schema) as SchemaField[]),
    }))
    /* Step 2: Extend the schema field with TypeScript types. */
    .map((row) => ({
      id: row.id,
      name: row.name,
      type: row.type,
      schema: row.schema.map(extendField),
    }))
    /* Step 3: Add default fields to the schema. */
    .map(addDefaultFields);

  /* Step 4a: Build an index of collection names and schemas, now that we have TypeScript interfaces. */
  const schemas: SchemaTranslations = processed.reduce(
    (acc, t) => ((acc[t.id] = { name: t.name, schema: t.schema }), acc),
    {} as SchemaTranslations,
  );
  /* Step 4b: Substitute '%%relation:<xyz>' placeholder types with their TypeScript interfaces. */
  processed.forEach((t) => (t.schema = t.schema.map((s) => translateRelation(s, schemas))));

  return processed;
}
