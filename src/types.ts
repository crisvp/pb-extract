import { SchemaField } from "@crisvp/pocketbase-js";

/**
 * Describes a column in a Pocketbase collection, along with its TypeScript type.
 *
 * @interface ExtendedSchemaField
 * @extends {SchemaField}
 */
export interface ExtendedSchemaField extends SchemaField {
  /**
   * A typescript data type
   */
  tsType: string;
}

/**
 * Describes a collection of Pocketbase collections.
 */
export type Schemas = {
  [id: string]: {
    name: string;
    schema: ExtendedSchemaField[];
  };
};

/**
 * Describes an entry in Pocketbase's `_collections` table.
 */
export type Row = {
  id: string;
  type: string;
  name: string;
  schema: ExtendedSchemaField[];
};

/**
 * Describes an entry in Pocketbase's '_collections' table, with schema as a JSON string.
 */
export type RawRow = {
  id: string;
  type: string;
  name: string;
  schema: string;
};
