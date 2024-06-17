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
 * Describes an Pocketbase collection;
 */
export type CollectionDescription = {
  id: string;
  type: string;
  name: string;
  schema: ExtendedSchemaField[];
};

/**
 * Describes a Pocketbase collection, with schema as a JSON string.
 */
export type CollectionDescriptionRaw = {
  id: string;
  type: string;
  name: string;
  schema: string;
};
