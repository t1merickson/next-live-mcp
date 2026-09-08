# Capability Map — Ableton Extensions SDK

**SDK version:** 1.0.0-beta.1 · **API version:** `"1.0.0"` · **Declarations verified:** 2026-09-07
(cue points, `duplicateTrack`/`duplicateScene`/`duplicateDevice`, `AudioClip.warping`/
`warpMode`, `Simpler.replaceSample` checked against the vendored typedoc; the focused
beta.1 run verified the core read/write path but not these Phase A calls — see
[`smoke-runbook.md`](smoke-runbook.md))

Bird's-eye view of what the Live API exposes, what we surface over MCP, and what is
impossible in the current API version. This file is the reasoning surface for every
"can we do X?" question. **Update on every SDK version bump** (see the upgrade
playbook in the design spec).

| Domain                            | Read                                                                                           | Write                                                                                              | Not possible in 1.0.0                                                                                             |
| --------------------------------- | ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **Song/Set**                      | tempo, scale, root note, grid, cue points                                                      | tempo, cue point create/delete/rename                                                              | time signature write, transport (play/stop/record/position), arrangement loop, cue-point move (time is immutable) |
| **Tracks**                        | name, mute/solo/arm, group, type                                                               | create/delete/duplicate MIDI+audio tracks, rename, mute/solo/arm                                   | routing, track color, freeze                                                                                      |
| **Scenes**                        | name, tempo, time sig                                                                          | create/delete/duplicate, rename                                                                    | scene launch, scene tempo write                                                                                   |
| **Clips (session + arrangement)** | name, color, loop settings, markers, mute                                                      | create/delete MIDI+audio clips, all writable clip props                                            | clip launch/playback                                                                                              |
| **MIDI notes**                    | full read (`MidiClip.notes`)                                                                   | full write — wholesale replace per clip                                                            | per-note streaming/incremental updates                                                                            |
| **Audio clips**                   | file path, warp mode/flag, warp markers                                                        | create from file, warp mode/flag                                                                   | warp-marker editing/creation                                                                                      |
| **Devices**                       | device tree, all parameters (name/min/max/value/quantized items), racks/chains, Simpler sample | insert built-in devices by name, delete/duplicate, set params, rack chains, replace Simpler sample | third-party VST/AU loading, preset browsing                                                                       |
| **Mixer**                         | volume/pan/sends as DeviceParameters                                                           | set volume/pan/sends                                                                               | metering, crossfader                                                                                              |
| **Take lanes**                    | lanes, clips, names                                                                            | create lanes, create clips in lanes, rename                                                        | —                                                                                                                 |
| **Utility**                       | —                                                                                              | render pre-FX arrangement audio using Live's configured record format, import file into project    | Live browser access, automation envelopes, change events/observers                                                |

## Cross-cutting facts

- **No event/observer API** — all reads are synchronous getters (poll to detect
  changes); all mutations are async Promises.
- **Undo**: each mutation is individually undoable; `withinTransaction` groups one tool
  call into one undo step (synchronous callback; batch async via `Promise.all`).
- **Concurrency**: all MCP writes, across all stateless HTTP requests, share one
  failure-tolerant FIFO before they enter a domain service. Reads bypass the queue.
- **Handles**: opaque bigint IDs, session-stable, resolvable via
  `getObjectFromHandle`; throw when the entity is deleted.
- **Duplicates land right after the SOURCE**, not after the previous copy
  (`Song.duplicateTrack`/`duplicateScene`, `Track.duplicateDevice`). N duplicates of one
  source therefore end up in **reverse creation order** — the last copy sits closest to the
  source. FakeLive mirrors this; the affected tool descriptions state it (not yet in-Live
  verified — see `smoke-runbook.md`).
- **Filesystem**: restricted to `storageDirectory` + `tempDirectory`; external files
  enter via `resources.importIntoProject`. Writes elsewhere throw `ERR_ACCESS_DENIED`
  (verified in-Live) — an external process cannot rely on the extension dropping a
  file at a shared path.
- **Runtime** (corrected by the 2026-07-24 in-Live smoke — see
  [ADR 0009](decisions/0009-real-extension-host-runtime.md)): Node 24.14.1 engine, but
  the bundle runs in a **stripped `vm` context**, NOT full Node. It provides `fetch`,
  `AbortController`, `Buffer`, `process`, `console`, `require`, timers — and NONE of
  `global`, `URL`, `TextEncoder`/`TextDecoder`, `crypto`, `Request`/`Response`/`Headers`,
  `ReadableStream`, `Blob`, `Event`/`EventTarget`. `node:` builtins ARE requirable.
  Consequences: esbuild `define: { global: "globalThis" }`; a host-globals prelude
  installs the missing web globals from `node:` builtins; the MCP HTTP server uses a
  custom `node:http` transport (`src/mcp/node-http-transport.ts`), not the SDK's
  hono-based `StreamableHTTPServerTransport`. Single bundled CJS entry; outbound `fetch`
  works; inbound `node:http` server works (ADR 0002).
- **BigInt marshalling**: beta.1 now types `Clip.color` as `bigint`; other integer-domain
  SDK getters remain typed `number` but returned `bigint` in the earlier real-Live smoke
  (`Song.rootNote`, MIDI pitch/velocity, marker positions, …). The adapter normalizes all
  of them at its boundary via `codec.ts` `toNumber` (ADR 0009).
- **Explicit SDK non-goals**: real-time audio, MIDI routing, drawing into Live's UI,
  background/persistent extensions, control surfaces.

## Runtime status

The full **23-tool surface** (v1 + Phase A + direct Arrangement MIDI creation) is
implemented (see the exposure table below) and
green in CI against FakeLive. SDK beta.1 declarations typecheck locally. A focused runtime
demonstration against installed Live `12.4.15b1` passed on 2026-09-07: MCP readback, tempo,
track/clip creation, native device insertion and parameter changes, mixer changes, and
Session playback all worked (see [`REAL-LIVE-VALIDATION.md`](REAL-LIVE-VALIDATION.md)).
**Earlier in-Live validation: macOS PASSED for the v1 surface**
(Live 12.4.5b8, 2026-07-24 — self-test 20/20, 0 failed) after the ADR 0009 fixes. That run
**predates the v2a checks**: the self-test has since grown from 20 to 35 checks (count against
FakeLive — the 20/20 macOS run was the full v1 set), and the 15 covering cue points,
duplicate, warp and the Simpler sample have not yet run in Live. A full self-test re-run on
macOS and a **Windows run are pending** before tagging v0.1.0.
The in-Live self-test runner (`src/shell/self-test.ts`) replays
the component scenarios plus the FakeLive-vs-Live contract checks against the real SDK
adapter — run it via the status dialog's "Run self-test" button. See
[`smoke-runbook.md`](smoke-runbook.md) for the procedure and the release gate.

An **stdio bridge** (`dist/bridge.cjs`, the `ableton-mcp` bin) lets stdio-only MCP
clients reach the loopback HTTP endpoint. It can discover URL + token from a fixed-path
`connection.json` or use explicit environment variables. The file was written in the
2026-09-07 beta.1 development run but was denied by an earlier host sandbox, so explicit
configuration remains the portable path. See
[`decisions/0008-stdio-bridge.md`](decisions/0008-stdio-bridge.md).

The official adapter cannot launch clips/scenes, control transport, or read meters. In
the focused demonstration those actions and observations came from the human-visible Live
UI, not MCP. See [`AGENT-MUSIC-GUIDE.md`](AGENT-MUSIC-GUIDE.md) for the handoff contract.

## MCP exposure status

| Capability                               | MCP tool(s)                                                                                | Status                         |
| ---------------------------------------- | ------------------------------------------------------------------------------------------ | ------------------------------ |
| Set overview / drill-down                | `get_set`, `get_track`, `get_clip`                                                         | v1 (implemented)               |
| Track CRUD                               | `create_tracks`, `update_track`, `delete_tracks`                                           | v1 (implemented)               |
| Scene create                             | `create_scenes`                                                                            | v1 (implemented)               |
| Scene update/delete                      | `update_scene`, `delete_scenes`                                                            | v1 (implemented)               |
| Clip create MIDI                         | `create_midi_clip`                                                                         | v1 (implemented)               |
| Arrangement MIDI create/read/edit/delete | `create_arrangement_midi_clip`, `get_track`, `get_clip`, `edit_clip_notes`, `delete_clips` | implemented; focused macOS run |
| Clip create/update/delete audio          | `create_audio_clip`, `update_clip`, `delete_clips`                                         | v1 (implemented)               |
| Note editing (replace)                   | `replace_clip_notes`                                                                       | v1 (implemented)               |
| Note editing (edit)                      | `edit_clip_notes`                                                                          | v1 (implemented)               |
| Devices                                  | `get_device`, `insert_device`, `set_device_params`, `delete_device`                        | v1 (implemented)               |
| Mixer                                    | `set_mixer`                                                                                | v1 (implemented)               |
| Song                                     | `update_song`                                                                              | v1 (implemented)               |
| Cue points                               | `update_song`, `get_set`                                                                   | v2a (implemented)              |
| Duplicate track/scene/device             | `create_tracks`, `create_scenes`, `insert_device` (`duplicateOf`)                          | v2a (implemented)              |
| Audio-clip warp                          | `update_clip`, `get_clip`                                                                  | v2a (implemented)              |
| Simpler sample replace                   | `set_simpler_sample`, `get_device` (`samplePath`)                                          | v2a (implemented)              |
| Audio render / file import               | `render_audio`, `import_file`                                                              | deferred (v2c)                 |
| Take lanes, rack chains                  | —                                                                                          | deferred (v2b)                 |
