# 0012 — Split MCP SDK v2 and Zod 4

## Context

The starting project used the monolithic `@modelcontextprotocol/sdk` v1 package. Its
dependency graph included general web frameworks that this extension does not use: the
Live-side server already has a deliberately small `node:http` transport because the
Extension Host is a restricted VM context. The official TypeScript SDK reached stable
v2 with separate client and server packages and requires Zod 4 schemas.

## Decision

Use exact versions of `@modelcontextprotocol/client` 2.0.0,
`@modelcontextprotocol/server` 2.0.0, and `zod` 4.5.4. The Extension imports only the
server package; the out-of-process bridge and tests import the client package. Tool input
schemas are full `z.object(...)` values instead of the deprecated raw-shape shorthand.
The custom stateless HTTP transport remains intentionally narrow and is exercised by the
real v2 client in component tests.

Official migration references:

- [TypeScript SDK v2 repository](https://github.com/modelcontextprotocol/typescript-sdk)
- [v1 to v2 migration guide](https://github.com/modelcontextprotocol/typescript-sdk/blob/main/docs/migration/upgrade-to-v2.md)

## Consequences

- The production dependency audit has no reported advisories at this snapshot.
- Client-only OAuth and HTTP machinery is absent from the in-Live server import graph
  unless the bundled bridge requires it.
- MCP protocol changes are tested at the actual client/server boundary, not only through
  mocked handler calls.
- Dependency versions stay exact until a newer SDK has passed the restricted-host and
  real-Live compatibility gates.
