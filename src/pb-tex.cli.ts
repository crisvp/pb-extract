import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import fs from "fs";
import path from "path";
import { extractTypes } from "./index.js";

async function extract({ input, output }) {
  const outputStr = await extractTypes(input);
  fs.writeFileSync(path.resolve(output), outputStr);
}

function main() {
  yargs(hideBin(process.argv))
    .command(
      ["extract <input> [output]", "e"],
      "Extract types from a Pocketbase file",
      {
        input: {
          hidden: true,
          describe: "Output d.ts file",
          default: "pocketbase.d.ts",
          type: "string",
        },
        output: {
          hidden: true,
          describe: "Pocketbase database file",
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
}

main();
