# 0011 — One official core, negotiated optional adapters

## Context

The Ableton MCP ecosystem has split into three families: new official Extensions-SDK
servers, broad Python Remote Script bridges, and Max-for-Live servers/devices. Combining
their tool lists directly would create collisions, duplicate semantics, and authority
that changes depending on which hidden transport happened to answer.

## Decision

Keep the official Extensions SDK adapter as the default core. Domain services consume a
narrow `LivePort`; MCP tools consume those services. Capabilities absent from API 1.0.0
may later be supplied by explicit Remote Script or Max adapters, but only through named,
versioned capability contracts with provenance and health status.

Every mutation is serialized before it reaches a domain service. Destructive operations
will additionally require a revision-bound preview and one-use authority token. Read
resources remain available without mutation authority.

The pinned sources and their licenses are recorded in `docs/PRIOR-ART.md`; exact
high-value file links and original pseudocode are kept in
`docs/COMMUNITY-MCP-SOURCE-MAP.md`. Disposable clones are removed after synthesis.
Unlicensed source is never copied.

## Consequences

- One stable tool vocabulary can outlive any individual Live integration mechanism.
- The official adapter remains small enough to audit and to survive a stricter future
  Extension Host sandbox.
- Transport-only capabilities cannot masquerade as official SDK support.
- A feature is not advertised merely because a reference project claims it; it needs a
  local contract, tests, and evidence for the active adapter.
