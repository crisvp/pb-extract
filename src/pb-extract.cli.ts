import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import fs from "fs";
import path from "path";
import { extractTypes } from "./index.js";

function extract({ input, output }) {
  if (!fs.existsSync(input)) throw new Error(`File not found: ${input}`);

  extractTypes(input).then((outputStr) => fs.writeFileSync(path.resolve(output), outputStr));
}

function main(argv: string[] = process.argv) {
  try {
    yargs(hideBin(argv))
      .command(
        ["extract <input> [output]", "e"],
        "Extract types from a Pocketbase file",
        {
          input: {
            hidden: true,
            describe: "Output d.ts file",
            type: "string",
          },
          output: {
            hidden: true,
            describe: "Pocketbase database file",
            default: "pocketbase.d.ts",
            type: "string",
          },
        },
        extract,
      )
      .requiresArg("inputPath")
      .string(["inputPath", "outputPath"])
      .strict()
      .wrap(Math.min(100, process.stdout.columns ?? 80))
      .demandCommand()
      .help().argv;
  } catch (e) {
    console.error(e.message);
  }
}

export default { main };

const entryFile = process.argv?.[1];
/* v8 ignore next 7 */
if (entryFile === import.meta.filename) {
  try {
    main(process.argv);
  } catch (e) {
    console.error(e.message);
  }
}
