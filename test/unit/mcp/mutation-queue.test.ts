import { describe, expect, it } from "vitest";
import { MutationQueue } from "../../../src/mcp/mutation-queue.js";

describe("MutationQueue", () => {
  it("serializes writes in arrival order", async () => {
    const queue = new MutationQueue();
    const events: string[] = [];
    let releaseFirst!: () => void;
    const firstGate = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });

    const first = queue.run("first", async () => {
      events.push("first:start");
      await firstGate;
      events.push("first:end");
    });
    const second = queue.run("second", async () => {
      events.push("second:start");
      events.push("second:end");
    });

    await Promise.resolve();
    expect(events).toEqual(["first:start"]);
    expect(queue.status()).toEqual({ active: "first", waiting: 1 });

    releaseFirst();
    await Promise.all([first, second]);
    expect(events).toEqual(["first:start", "first:end", "second:start", "second:end"]);
    expect(queue.status()).toEqual({ active: null, waiting: 0 });
  });

  it("continues after a rejected write", async () => {
    const queue = new MutationQueue();
    const failed = queue.run("failed", async () => {
      throw new Error("write failed");
    });
    const recovered = queue.run("recovered", async () => "ok");

    await expect(failed).rejects.toThrow("write failed");
    await expect(recovered).resolves.toBe("ok");
    expect(queue.status()).toEqual({ active: null, waiting: 0 });
  });
});
