import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import fs from 'fs';
import { readCollections as apiCollections } from './api.js';
import { readCollections as dbCollections } from './sqlite.js';
import { writeDeclarations } from './declarations.js';

async function extract({ input, output }) {
  if (!fs.existsSync(input)) throw new Error(`File not found: ${input}`);
  const outputStr = await dbCollections(input);
  await writeDeclarations(outputStr, output);
}

async function main(argv: string[] = process.argv) {
  try {
    await yargs(hideBin(argv))
      .command(
        ['extract <input> [output]', 'e'],
        'Extract types from a Pocketbase file',
        {
          input: {
            hidden: true,
            describe: 'Output d.ts file',
            type: 'string',
          },
          output: {
            hidden: true,
            describe: 'Output declaration file',
            default: 'pocketbase.d.ts',
            type: 'string',
          },
        },
        extract
      )
      .command(
        ['dump [...options] <url>', 'd'],
        'Dump types from a Pocketbase server',
        {
          url: {
            hidden: true,
            describe: 'Pocketbase server to connect to',
            type: 'string',
          },
          user: {
            hidden: false,
            default: '$POCKETBASE_USER',
            describe: 'Pocketbase admin user identity',
            type: 'string',
          },
          password: {
            hidden: false,
            default: '$POCKETBASE_PASSWORD',
            describe: 'Pocketbase admin user password',
            type: 'string',
          },
          output: {
            hidden: false,
            default: 'pocketbase.d.ts',
            describe: 'Output declaration file',
            type: 'string',
          },
        },
        async ({ url, user, password, output }) => {
          url ??= process.env.POCKETBASE_URL;
          user = user === '$POCKETBASE_USER' ? process.env.POCKETBASE_USER : user;
          password = password === '$POCKETBASE_PASSWORD' ? process.env.POCKETBASE_PASSWORD : password;

          if (!user || !password) {
            throw new Error(
              'Missing user or password. Specify on the commandline, or set $POCKETBASE_USER and $POCKETBASE_PASSWORD environment variables.'
            );
          }

          const collections = await apiCollections(url, { adminUser: user, adminPassword: password });
          await writeDeclarations(collections, output);
        }
      )
      .requiresArg('inputPath')
      .string(['inputPath', 'outputPath'])
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
    await main(process.argv);
  } catch (e) {
    console.error(e.message);
  }
}
