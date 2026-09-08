import { PassThrough } from "node:stream";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { FakeLive } from "../../src/adapters/fake/fake-live.js";
import { startHttpServer } from "../../src/mcp/http.js";
import { createMcpServer } from "../../src/mcp/server.js";
import { createToolDeps } from "../../src/mcp/tools/deps.js";
import { runBridge } from "../../src/bridge/bridge.js";

const TOKEN = "test-token-123";

describe("stdio bridge splice", () => {
  let fake: FakeLive;
  let server: Awaited<ReturnType<typeof startHttpServer>>;
  let bridge: Awaited<ReturnType<typeof runBridge>>;
  let stdin: PassThrough;
  let stdout: PassThrough;
  const waiters = new Map<number, (msg: any) => void>();

  beforeEach(async () => {
    fake = new FakeLive();
    await fake.createTracks([{ type: "midi", name: "Drums" }]);
    server = await startHttpServer({
      port: 0,
      token: TOKEN,
      createServer: (() => {
        const deps = createToolDeps(fake);
        return () => createMcpServer(deps);
      })(),
    });

    stdin = new PassThrough();
    stdout = new PassThrough();
    let buf = "";
    stdout.on("data", (chunk: Buffer) => {
      buf += chunk.toString("utf8");
      let idx: number;
      while ((idx = buf.indexOf("\n")) >= 0) {
        const line = buf.slice(0, idx);
        buf = buf.slice(idx + 1);
        if (!line.trim()) continue;
        const msg = JSON.parse(line);
        if (typeof msg.id === "number" && waiters.has(msg.id)) {
          waiters.get(msg.id)!(msg);
          waiters.delete(msg.id);
        }
      }
    });

    bridge = await runBridge({ url: server.url, token: TOKEN, stdin, stdout });
  });

  afterEach(async () => {
    await bridge.close();
    await server.close();
  });

  function rpc(id: number, method: string, params: unknown): Promise<any> {
    const p = new Promise<any>((resolve) => waiters.set(id, resolve));
    stdin.write(JSON.stringify({ jsonrpc: "2.0", id, method, params }) + "\n");
    return p;
  }
  function notify(method: string): void {
    stdin.write(JSON.stringify({ jsonrpc: "2.0", method }) + "\n");
  }

  it("initializes, lists 23 tools, and calls get_set over stdio", async () => {
    const init = await rpc(1, "initialize", {
      protocolVersion: "2025-06-18",
      capabilities: {},
      clientInfo: { name: "test", version: "0.0.0" },
    });
    expect(init.result.serverInfo).toBeDefined();
    notify("notifications/initialized");

    const list = await rpc(2, "tools/list", {});
    expect(list.result.tools.length).toBe(23);

    const call = await rpc(3, "tools/call", { name: "get_set", arguments: {} });
    expect(call.result.content).toBeDefined();
    expect(call.result.isError).toBeFalsy();
  }, 15000);

  it("close() is idempotent under concurrent and repeated calls", async () => {
    // Regression guard for the microtask-deferred closeBoth in runBridge: both
    // SDK transports call onclose() synchronously inside close(), so a naive
    // synchronous closeBoth would re-enter itself and throw a RangeError
    // (stack overflow) here instead of resolving cleanly.
    await expect(
      Promise.all([bridge.close(), bridge.close(), bridge.close()]),
    ).resolves.toBeDefined();

    // A further close (including the one afterEach will issue) must still
    // resolve cleanly — this is the whole point of the memoized promise.
    await expect(bridge.close()).resolves.toBeUndefined();
  });
});
