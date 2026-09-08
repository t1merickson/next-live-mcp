# Roadmap

Status as of 2026-09-07. This is the current resumption point; dated files under
`docs/plans/` describe how earlier slices were implemented, not what remains now.

## Current baseline

- 23 MCP tools over an official Ableton Extensions SDK 1.0.0-beta.1 adapter, including
  direct Arrangement MIDI creation.
- Exact MCP client/server 2.0.0 packages with Zod 4 schemas.
- Shared failure-tolerant FIFO for every mutation, plus MCP tool effects/annotations.
- `ableton://capabilities` and `ableton://set` resources.
- 196 tests across 42 files, SDK typecheck, lint/boundary checks, package build, archive
  integrity, and zero reported npm advisories at the 2026-09-07 snapshot.
- Focused macOS proof in Live 12.4.15b1: authenticated MCP read/write, tempo, four MIDI
  tracks, 100 notes across four clips, native devices, parameter edits, mixer changes,
  readback, human-launched Session playback, and audible meter activity.
- Focused Arrangement proof in the same Live build: direct creation and readback of a
  63-note timeline clip in an unused region. Arrangement edit/delete/overlap rejection
  remain covered by FakeLive rather than destructive real-Set smoke tests.

See [`REAL-LIVE-VALIDATION.md`](REAL-LIVE-VALIDATION.md) for the evidence boundary and
[`AGENT-MUSIC-GUIDE.md`](AGENT-MUSIC-GUIDE.md) for the intended musical workflow.

## Release gate for v0.1.0

1. Run the complete current 35-check self-test against Live 12.4.15b1 on macOS. The
   earlier 20/20 run covered only the v1 surface; the focused beta.1 music demonstration
   was not the full self-test.
2. Install the produced `.ablx` through Live and verify first install, update, restart,
   disable, and removal. The current beta.1 proof used development-host attachment.
3. Verify Set close/switch behavior, cancellation, stale-handle recovery, and reconnect.
4. Verify the same packaged build and self-test on Windows.
5. Re-run the full headless gate from a clean checkout and record artifact checksum.
6. Only then tag v0.1.0.

The repeatable procedure is in [`smoke-runbook.md`](smoke-runbook.md).

## Next product slice: remove routine UI dependence

The music demonstration used MCP for all composition, sound design, mixer edits, and
readback. UI automation was limited to enabling Extensions, changing view, selecting a
Scene, and launching it; a terminal command attached the development Extension Host.

The target steady state is zero routine computer-use automation after a one-time install:

1. Package and install the `.ablx` so Live owns extension startup.
2. Make connection discovery reliable without exposing the bearer token. The fixed-path
   connection file worked in the 2026-09-07 beta.1 development run, but earlier sandbox
   evidence shows it cannot be assumed across host versions.
3. Specify a narrow, optional Max for Live adapter for launch, stop, transport state, and
   meters. It must advertise provenance and health through `ableton://capabilities`; it
   must not duplicate the official adapter's editing authority.
4. Keep first-time install/trust and musician-chosen visual or tactile interactions human.
   Max for Live Developer Mode is unrelated to enabling Extensions.

## Safety and musical capability slices

In recommended order:

- Revision-bound previews and one-use commit authority for destructive workflows.
- Receipts containing requested delta, verified readback, and an honest undo statement.
- Pure, tested musical transforms: scale lock, humanize, compact notation, and arrangement
  planning. Keep these above the adapter boundary.
- Take-lane and rack-chain support from the existing v2 design, after real beta.1 gates.
- Explicit file-import and pre-FX render workflows that obey SDK filesystem boundaries.
- Large-Set paging, latency budgets, and handle-invalidation stress tests.
- Optional browser, automation, routing, or legacy Remote Script adapters only after a
  named capability contract and independent safety review.

## Deliberate non-goals

- Silently falling back to UI automation when an MCP capability is absent.
- Combining community tool lists into one ambiguous authority surface.
- Treating Ableton Link as a control API; Link synchronizes tempo/beat phase and optional
  start/stop intent, not Set editing.
- Claiming audio quality from successful API calls. Human listening or a tested analysis
  adapter remains required.
