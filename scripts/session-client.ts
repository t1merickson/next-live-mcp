/** Direct MCP client for local music sessions when the host has no registered tools.
 * Credentials stay in the existing connection resolver; no tokens in argv or output.
 * Usage: node --import tsx scripts/session-client.ts get_set
 *        node --import tsx scripts/session-client.ts tools
 *        node --import tsx scripts/session-client.ts resource ableton://capabilities
 *        node --import tsx scripts/session-client.ts TOOL '{"key":"value"}'
 *        node --import tsx scripts/session-client.ts TOOL @arguments.json
 * Writes are never retried automatically. IDs must come from current reads.
 */
import { Client, StreamableHTTPClientTransport } from "@modelcontextprotocol/client";
import { resolveConnection } from "../src/bridge/bridge.js";
import { readFileSync } from "node:fs";

const client = new Client({ name: "music-session-client", version: "0.1.0" });
try {
  const [op = "get_set", arg] = process.argv.slice(2);
  if (op === "resource" && !arg) throw new Error("resource requires a URI");
  const args: unknown =
    op !== "resource" && arg
      ? JSON.parse(arg.startsWith("@") ? readFileSync(arg.slice(1), "utf8") : arg)
      : {};
  if (typeof args !== "object" || args === null || Array.isArray(args)) {
    throw new Error("Tool arguments must be a JSON object");
  }
  const connection = resolveConnection();
  const url = new URL(connection.url);
  if (
    !["127.0.0.1", "localhost", "[::1]"].includes(url.hostname) ||
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password
  ) {
    throw new Error("Music session client requires a loopback MCP endpoint");
  }
  await client.connect(
    new StreamableHTTPClientTransport(url, {
      requestInit: { headers: { Authorization: `Bearer ${connection.token}` } },
    }),
  );
  const result =
    op === "tools"
      ? await client.listTools()
      : op === "resource"
        ? await client.readResource({ uri: arg })
        : await client.callTool({ name: op, arguments: args as Record<string, unknown> });
  console.log(JSON.stringify(result, null, 2));
  if ("isError" in result && result.isError) process.exitCode = 1;
} catch (error) {
  console.error(error instanceof Error ? error.message : "MCP session failed");
  process.exitCode = 1;
} finally {
  await client.close();
}
