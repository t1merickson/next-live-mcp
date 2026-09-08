# Security Policy

## Threat model

This extension runs an MCP server over HTTP **bound to 127.0.0.1 only**, inside
Ableton Live's Extension Host (a local Node.js process). Defenses in place:

- Loopback-only bind — never reachable from the network.
- `Host`/`Origin` header validation — rejects DNS-rebinding attempts from browsers.
- Mandatory bearer token on every request, generated per install.
- Connection metadata contains that token and must remain user-readable only. Never
  paste it into prompts, logs, screenshots, issue reports, or committed config.
- Filesystem access restricted to the SDK's sandbox (storage/temp directories).

What the server can do if compromised: modify the currently open Live set (bounded by
Live's undo history) — it has no network egress requirements and no access to
arbitrary files.

The current beta has no authorization prompt per tool call. MCP clients must therefore
treat the endpoint as a capability to edit the open Set: discover capabilities first,
read before writing, avoid destructive edits without explicit user intent, and report
the exact undo boundary after mutations. See `docs/AGENT-MUSIC-GUIDE.md`.

## Reporting a vulnerability

Please report vulnerabilities privately via
[GitHub Security Advisories](../../security/advisories/new) rather than public issues.
You should receive a response within a week.
