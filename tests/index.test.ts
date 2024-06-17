import { describe, expect, it } from "vitest";

describe("index", () => {
  it("exports objects", async () => {
    const mod = await import("../src/index");

    expect(mod).toBeDefined();
    expect(mod).toMatchSnapshot();
  });
});
