import { describe, expect, it } from "vitest";
import { FakeLive } from "../../../src/adapters/fake/fake-live.js";
import { createToolDeps } from "../../../src/mcp/tools/deps.js";
import type { ToolDeps } from "../../../src/mcp/tools/types.js";
import { runSelfTest } from "../../../src/shell/self-test.js";

function makeDeps(fake: FakeLive): ToolDeps {
  return createToolDeps(fake);
}

describe("runSelfTest against FakeLive", () => {
  it("passes every check and reports PASS lines", async () => {
    const fake = new FakeLive();
    const lines: string[] = [];

    const result = await runSelfTest(makeDeps(fake), (line) => lines.push(line));

    expect(result.passed).toBeGreaterThan(0);
    expect(result.failed).toBe(0);
    expect(result.failures).toEqual([]);
    expect(lines.some((l) => l.startsWith("PASS:"))).toBe(true);
    expect(lines.some((l) => l.startsWith("FAIL:"))).toBe(false);
  });

  it("leaves the set as found — no leftover tracks or scenes", async () => {
    const fake = new FakeLive();

    await runSelfTest(makeDeps(fake), () => {});

    const set = await fake.getSet();
    expect(set.tracks).toEqual([]);
    expect(set.scenes).toEqual([]);
    expect(set.tracks.some((t) => t.name.startsWith("MCP Self-Test"))).toBe(false);
  });

  it("restores the original tempo", async () => {
    const fake = new FakeLive();
    await fake.updateSong({ tempo: 137 });

    await runSelfTest(makeDeps(fake), () => {});

    const set = await fake.getSet();
    expect(set.tempo).toBe(137);
  });
});
