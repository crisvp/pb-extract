import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import mod from '../src/pb-extract.cli';
import path from 'node:path';
import fs from 'node:fs';
import { ADMIN_IDENTITY } from './fixtures/mockApi';

import { setupServer } from './fixtures/mockApi';

const mocks = vi.hoisted(function () {
  const logs: string[] = [];
  return {
    logs,
    console: {
      log: console.log,
      //   log: vi.fn((...args: unknown[]) => logs.push(JSON.stringify(args))),
      warn: vi.fn((...args: unknown[]) => logs.push(JSON.stringify(args))),
      error: vi.fn((...args: unknown[]) => logs.push(JSON.stringify(args))),
      critical: vi.fn((...args: unknown[]) => logs.push(JSON.stringify(args))),
    },
  };
});

vi.stubGlobal('console', mocks.console);

describe('pb-extract.cli', () => {
  const server = setupServer();
  beforeAll(() => void server.listen({ onUnhandledRequest: 'error' }));
  afterAll(() => void server.close());

  afterEach(() => void mocks.logs.splice(0, mocks.logs.length));

  it('should require a command', async () => {
    await mod.main(['node', 'pb-extract']);
    expect(mocks.logs).toContainEqual(expect.stringMatching(/Not enough non-option arguments/));
  });

  it('should require an input file for extract', async () => {
    await mod.main(['node', 'pb-extract', 'extract']);
    expect(mocks.logs).toContainEqual(expect.stringMatching(/Not enough non-option arguments/));
  });

  it('should require an existing input file for extract', async () => {
    await mod.main(['node', 'pb-extract', 'extract', 'nope.db']);
    expect(mocks.logs).toContainEqual(expect.stringMatching(/File not found: nope.db/));
  });

  it('should extract types from db', async () => {
    const output = path.resolve(import.meta.dirname, 'test-pocketbase.d.ts');
    const input = path.resolve(import.meta.dirname, 'fixtures/data.db');

    if (fs.existsSync(output)) fs.unlinkSync(output);
    expect(fs.existsSync(output)).toBe(false);

    if (!fs.existsSync(input)) throw new Error(`File not found: ${input}`);
    expect(fs.existsSync(input)).toBe(true);

    await mod.main(['node', 'pb-extract', 'extract', input, output]);
    expect(fs.existsSync(output)).toBe(true);
    fs.unlinkSync(output);
  });

  it('should require a URL for dump', async () => {
    await mod.main(['node', 'pb-extract', 'dump']);
    expect(mocks.logs).toContainEqual(expect.stringMatching(/Not enough non-option/));
  });

  it('should require a user for dump', async () => {
    await mod.main(['node', 'pb-extract', 'dump', 'http://127.0.0.1:8090', '--user', '']);
    expect(mocks.logs).toContainEqual(expect.stringMatching(/Missing user/));
  });

  it('should require a password for dump', async () => {
    await mod.main(['node', 'pb-extract', 'dump', 'http://127.0.0.1:8090', '--user', 'm', '--password', '']);
    expect(mocks.logs).toContainEqual(expect.stringMatching(/Missing user or pass/));
  });

  it('should read user from the environment', async () => {
    process.env.POCKETBASE_USER = 'not-an-email';
    await mod.main(['node', 'pb-extract', 'dump', 'http://127.0.0.1:8090', '--password', 'x']);
    expect(mocks.logs).toContainEqual(expect.stringMatching(/validation_is_email/));
  });

  it('should read password from the environment', async () => {
    process.env.POCKETBASE_PASSWORD = 'do not read';
    await mod.main(['node', 'pb-extract', 'dump', 'http://127.0.0.1:8090', '--user', 'unknown@example.com']);
    expect(mocks.logs).toContainEqual(expect.stringMatching(/Failed to auth/));
  });

  it('should dump types from API', async () => {
    const output = path.resolve(import.meta.dirname, 'test-pocketbase.d.ts');

    if (fs.existsSync(output)) fs.unlinkSync(output);
    expect(fs.existsSync(output)).toBe(false);

    await mod.main([
      'node',
      'pb-extract',
      'dump',
      'http://127.0.0.1:8090',
      '--output',
      output,
      '--user',
      ADMIN_IDENTITY,
      '--password',
      'Test123456',
    ]);
    expect(fs.existsSync(output)).toBe(true);
    fs.unlinkSync(output);
  });
});
