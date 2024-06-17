import fs from "fs";
import path from "path";

import handlebars from "./handlebars.js";
import { type CollectionDescription } from "./types";

export async function writeDeclarations(collections: CollectionDescription[], output: string): Promise<void> {
  const tpl = fs.readFileSync(path.join(import.meta.dirname, "out.d.ts.hbs"), "utf-8");
  const delegate = handlebars.compile(tpl);

  const outputStr = delegate({ tables: collections });
  fs.writeFileSync(path.resolve(output), outputStr);
}
