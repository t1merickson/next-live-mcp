import { Client, StreamableHTTPClientTransport } from "@modelcontextprotocol/client";
import { FakeLive } from "../../src/adapters/fake/fake-live.js";
import { startHttpServer, type RunningHttpServer } from "../../src/mcp/http.js";
import { createMcpServer } from "../../src/mcp/server.js";
import { createToolDeps } from "../../src/mcp/tools/deps.js";

export const TEST_TOKEN = "component-test-token";

export interface TestStack {
  fake: FakeLive;
  server: RunningHttpServer;
  client: Client;
  close(): Promise<void>;
}

/** Full stack: real MCP client → real HTTP → real tools → real services → FakeLive. */
export async function startTestStack(fake = new FakeLive()): Promise<TestStack> {
  const deps = createToolDeps(fake);
  const server = await startHttpServer({
    port: 0,
    token: TEST_TOKEN,
    createServer: () => createMcpServer(deps),
  });
  const client = new Client({ name: "component-test", version: "0.0.0" });
  await client.connect(
    new StreamableHTTPClientTransport(new URL(server.url), {
      requestInit: { headers: { Authorization: `Bearer ${TEST_TOKEN}` } },
    }),
  );
  return {
    fake,
    server,
    client,
    close: async () => {
      await client.close();
      await server.close();
    },
  };
}

export async function callTool(
  client: Client,
  name: string,
  args: Record<string, unknown> = {},
): Promise<{ payload: any; isError: boolean; bytes: number }> {
  const res = (await client.callTool({ name, arguments: args })) as {
    content: Array<{ type: string; text: string }>;
    isError?: boolean;
  };
  const text = res.content[0].text;
  return { payload: JSON.parse(text), isError: res.isError ?? false, bytes: text.length };
}
