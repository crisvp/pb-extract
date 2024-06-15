import { Client as Pocketbase, type SchemaField } from "@crisvp/pocketbase-js";
import { writeFileSync } from "fs";
import path from "path";

const pascalCase = require("change-case").pascalCase;

export interface VitePluginPocketbaseOptions {
  dtsFile: string;
  jsonFile: string;
  authCollection: string;
  adminUser: string;
  adminPassword: string;
}

const DEFAULTS = {
  dtsFile: path.join(import.meta.dirname, "../src/pocketbase.d.ts"),
  jsonFile: path.join(import.meta.dirname, "../src/pocketbase.json"),

  authCollection: "_pb_users_auth_",
  adminUser: "vite@localhost.local",
  adminPassword: "SecretPassword123",
};

function tsType(field: SchemaField) {
  const { type } = field;
  switch (type) {
    case "text":
      return "string";
    case "date":
      return "Date";
    case "select":
      return field.options.values.map((v: string) => `'${v}'`).join(" | ");
    case "relation":
      return `%%relation:${field.options.collectionId}`;
    default:
      return "unknown";
  }
}

type Types = {
  [id: string]: {
    name: string;
    schema: Schema[];
  };
};

function schemaToString(collectionId: string, types: Types) {
  const { name, schema } = types[collectionId];
  return [
    `interface ${pascalCase(name)}Collection {`,
    ...schema.map((field) => {
      if (field.tsType.startsWith("%%relation:")) {
        const collectionId = field.tsType.replace("%%relation:", "");
        const collectionName = types[collectionId].name;
        return (collectionName ? `  ${field.name}: ${pascalCase(collectionName)}Collection` : "unknown") + ";";
      }
      return `  ${field.name}: ${field.tsType};`;
    }),
    "}",
  ];
}

export type Schema = {
  name: string;
  id: string;
  tsType: string;
};

export default function VitePluginPocketbase(options: Partial<VitePluginPocketbaseOptions> = {}) {
  return {
    name: "vite-plugin-pocketbase",
    async buildStart() {
      const pb = new Pocketbase("http://127.0.0.1:8090");
      const opts: VitePluginPocketbaseOptions = { ...DEFAULTS, ...options };
      const types: Types = {};

      await pb.admins.authWithPassword(opts.adminUser, opts.adminPassword);

      const collections = await pb.collections.getFullList();

      collections.map((collection) => {
        const schema = collection.schema.map((field) => ({
          name: field.name,
          id: field.id,
          tsType: tsType(field),
        }));
        types[collection.id] = { name: collection.name, schema };
        if (collection.type === "auth") {
          types[collection.id].schema.push(
            { name: "email", id: "", tsType: "string" },
            { name: "password", id: "", tsType: "string" },
            { name: "username", id: "", tsType: "string" },
          );
        }
      });

      const lines = collections.flatMap((collection) => schemaToString(collection.id, types)).map((str) => `  ${str}`);
      const interfaces = `export * from './pocketbase-auto';\n\ndeclare module './pocketbase-auto' {\n${lines.join(
        "\n",
      )}\n}\n`;

      const collectionOb = collections.map(
        (collection) => `    ${collection.name}: ${pascalCase(collection.name)}Collection;`,
      );
      const collectionMap = `declare module './pocketbase-auto' {\n  declare type Collections = {\n${collectionOb
        .map((s) => `  ${s}`)
        .join("\n")}\n  }\n}\n`;

      const prototypes = collections.flatMap((collection) => [
        `declare function mapCollection(name: '${collection.name}'): ${pascalCase(collection.name)}Collection;`,
      ]);

      const utility = "declare global {\n  declare type PocketbaseCollection<T> = UpperCase<`${T}Collection`>;\n}\n";

      const autoType = `declare module './pocketbase-auto' {\n${prototypes.map((s) => `  ${s}`).join("\n")}\n}\n`;
      const collectionNames = `declare module './pocketbase-auto' {\n  declare const CollectionNames = [${collections
        .map((collection) => `'${collection.name}'`)
        .join(",")}] as const;\n}\n`;

      const piniaLines = collections.map(
        (collection) => `  ${collection.name}: ${pascalCase(collection.name)}Collection;`,
      );
      const pinia = `export * from 'pinia';\ndeclare module 'pinia' {\n  export interface PiniaCustomProperties {\n    $pocketbase: {\n${piniaLines
        .map((s) => `    ${s}`)
        .join("\n")}\n    }\n  }\n}\n`;

      if (opts.dtsFile)
        writeFileSync(opts.dtsFile, [utility, interfaces, collectionMap, autoType, collectionNames, pinia].join("\n"));
      if (opts.jsonFile) writeFileSync(opts.jsonFile, JSON.stringify(types, null, 2));
    },
  };
}
