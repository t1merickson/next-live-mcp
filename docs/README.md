# Documentation map

Use this page to decide which document is current truth. The repository contains both
operational documentation and dated design records; they serve different purposes.

## Start here

- [`../README.md`](../README.md) — product status, install, connection, capabilities,
  and safety overview.
- [`AGENT-MUSIC-GUIDE.md`](AGENT-MUSIC-GUIDE.md) — the working contract for an agent
  composing or editing music in a user's open Set.
- [`tools.md`](tools.md) — generated parameter reference for the 23 current MCP tools.
- [`capability-map.md`](capability-map.md) — what the official SDK adapter can read and
  write, what it cannot do, and which claims have real-Live evidence.
- [`smoke-runbook.md`](smoke-runbook.md) — repeatable release validation in Live.

## Evidence and provenance

- [`REAL-LIVE-VALIDATION.md`](REAL-LIVE-VALIDATION.md) — dated observations from actual
  Live hosts, kept separate from fake-host and type-level evidence.
- [`PRIOR-ART.md`](PRIOR-ART.md) — the 17-project community survey, exact commits,
  licenses, and adoption decisions.
- [`COMMUNITY-MCP-SOURCE-MAP.md`](COMMUNITY-MCP-SOURCE-MAP.md) — permanent links to the
  few community files worth reopening and the original patterns distilled from them.
  Local research clones are intentionally not retained.
- [`../NOTICE.md`](../NOTICE.md) — attribution and redistribution boundaries.

## Direction and history

- [`ROADMAP.md`](ROADMAP.md) — current release gates and next slices.
- [`decisions/`](decisions/) — append-only architecture decisions. Later ADRs and dated
  evidence may supersede assumptions in earlier ADRs.
- [`specs/`](specs/) — historical design baselines. They explain intent at the date in
  each filename; their old SDK/dependency versions are not current requirements.
- [`plans/`](plans/) — historical implementation transcripts. Commands, package names,
  branch names, test counts, and pending status in these files are not operational
  guidance. Use the current README, contribution guide, and runbook instead.

## Truth hierarchy

When documents disagree, use this order:

1. Current generated tool schemas and current source.
2. `capability-map.md` plus the newest dated entry in `REAL-LIVE-VALIDATION.md`.
3. Accepted ADRs, with later ADRs superseding earlier assumptions.
4. Dated specs and plans as historical context only.

Claims must keep their evidence class attached: passing FakeLive tests, compiling against
SDK declarations, connecting to the Extension Host, and completing a real musical action
in Live are four different levels of proof.
