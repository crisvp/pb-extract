import { afterEach, describe, expect, test, vi } from "vitest";
import mod from "../src/pb-extract.cli";
import path from "node:path";
import fs from "node:fs";

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

vi.stubGlobal("console", mocks.console);

describe("pb-extract.cli", () => {
  afterEach(() => void mocks.logs.splice(0, mocks.logs.length));

  test("should require a command", async () => {
    mod.main(["node", "pb-extract"]);
    expect(mocks.logs).toContainEqual(expect.stringMatching(/Not enough non-option arguments/));
  });

  test("should require an input file for extract", async () => {
    mod.main(["node", "pb-extract", "extract"]);
    expect(mocks.logs).toContainEqual(expect.stringMatching(/Not enough non-option arguments/));
  });

  test("should require an existing input file for extract", async () => {
    mod.main(["node", "pb-extract", "extract", "nope.db"]);
    expect(mocks.logs).toContainEqual(expect.stringMatching(/File not found: nope.db/));
  });

  test("should extract types from db", async () => {
    const output = path.resolve(import.meta.dirname, "test-pocketbase.d.ts");
    const input = path.resolve(import.meta.dirname, "fixtures/data.db");

    mod.main(["node", "pb-extract", "extract", input, output]);
    await vi.waitUntil(() => fs.existsSync(output));
    expect(fs.existsSync(output)).toBe(true);
  });
});
