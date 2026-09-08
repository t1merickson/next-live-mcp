# Ableton MCP Extension

An unofficial community project. It is not affiliated with or endorsed by Ableton.

An [Ableton Live](https://www.ableton.com/) extension that hosts a
[Model Context Protocol](https://modelcontextprotocol.io) (MCP) server **inside Live**,
so AI coding agents — Claude Code, Codex, Claude Desktop, or any MCP client — can connect
to your open Live set and work on it with you: inspect the arrangement, compose and edit
MIDI, manage tracks/scenes/clips, insert and tweak devices, and drive the mixer.

Built on the Ableton Extensions SDK (Node.js). The server runs **only while Live is open**,
listens on `localhost` over Streamable HTTP, and is protected by a per-install bearer token.

## Status

**Extension complete; this integrated branch has passed a focused in-Live run.** The upstream
spine passed its built-in self-test **20/20 on macOS** (Live 12.4.5b8, 2026-07-24), including
real read and write operations. This workspace combines that spine with the beta.1 SDK,
MCP SDK v2, a shared mutation queue, tool safety annotations, and capability/Set resources.
Its **23-tool** fake-Live suite is green. On 2026-09-07 this exact build connected to the
locally installed Live 12.4.15b1 and created, read back, and played a four-track Session
scene through MCP. A follow-up created and read back a 63-note Arrangement clip directly
on the timeline. The full in-Live self-test and a Windows run remain release gates; see
[`docs/REAL-LIVE-VALIDATION.md`](docs/REAL-LIVE-VALIDATION.md).

You don't need Ableton to try the server logic: `npm run dev:fake` runs it against an
in-memory fake Live.

- What the Live API can and can't do: [`docs/capability-map.md`](docs/capability-map.md)
- Full tool reference: [`docs/tools.md`](docs/tools.md)
- Agent music-writing guide: [`docs/AGENT-MUSIC-GUIDE.md`](docs/AGENT-MUSIC-GUIDE.md)
- Documentation map and truth hierarchy: [`docs/README.md`](docs/README.md)
- Architecture decisions: [`docs/decisions/`](docs/decisions/) · design spec:
  [`docs/specs/2026-07-19-ableton-mcp-extension-design.md`](docs/specs/2026-07-19-ableton-mcp-extension-design.md)
- Roadmap: [`docs/ROADMAP.md`](docs/ROADMAP.md)

## Requirements

All you need to _use_ the extension:

- An **Extensions-capable Ableton Live** — currently the **Live 12 public beta** (join
  via [Ableton's beta program](https://www.ableton.com/en/beta/)). Extensions don't exist
  in earlier versions.

Building from source additionally needs Node.js ≥ 24.16.0 and the Ableton Extensions SDK
tarballs (from the beta program) — see [CONTRIBUTING.md](CONTRIBUTING.md). Nothing
Ableton-derived is committed to this repo: `references/` and `docs/sdk-notes.md` (cited
throughout the docs and source) are local-only notes on the vendored SDK and intentionally
absent here.

## Install

### Build this integrated branch

```sh
npm ci
npm run setup:sdk     # installs the SDK tarballs from references/ (see CONTRIBUTING.md)
npm run package       # builds and produces dist/Ableton-MCP-<version>.ablx
```

Then install the produced `.ablx` with the steps below. On load, the extension registers a
context-menu action and its log shows `[ableton-mcp] MCP server running at …`.

1. In Live, open **Settings → Extensions** and enable **Extensions**. Max for Live's
   separate Developer Mode setting is unrelated and is not required.
2. Drag `dist/Ableton-MCP-0.1.0.ablx` onto **Drag and drop to install** (or click
   **Choose file** and pick it).
3. Check it is alive: in Session view, **right-click any Scene → "Ableton MCP: Status…"**.
   The dialog shows the server address and token used below.

The [upstream project releases](https://github.com/idx3d/ableton-mcp-extension/releases)
belong to the executable spine and do not contain this workspace's integrated changes.
This repository intentionally publishes source only for now; the locally built `.ablx`
remains ignored until the packaged lifecycle release gate is complete.

## Connect your MCP client

Open the extension's status dialog inside Live — **Session view → right-click a Scene →
"Ableton MCP: Status…"**. It shows the server URL, the (masked) token, and ready-to-copy
connect snippets. The examples below use the default `http://127.0.0.1:20808/mcp`.

### Claude Code

```sh
claude mcp add --transport http ableton http://127.0.0.1:20808/mcp \
  --header "Authorization: Bearer <token>"
```

### Codex

In `~/.codex/config.toml` (Codex reads HTTP MCP servers from config, not a CLI flag):

```toml
[mcp_servers.ableton]
url = "http://127.0.0.1:20808/mcp"
bearer_token_env_var = "ABLETON_MCP_TOKEN"
```

…then export the token in your shell: `export ABLETON_MCP_TOKEN=<token>`.

### Any other MCP client

Point it at the Streamable HTTP endpoint `http://127.0.0.1:20808/mcp` with an
`Authorization: Bearer <token>` header. For **stdio-only** clients, a bundled bridge
(`dist/bridge.cjs`, the `ableton-mcp` bin) proxies stdio to the HTTP server — set
`ABLETON_MCP_URL` (or `ABLETON_MCP_PORT`) and `ABLETON_MCP_TOKEN` in the client's env and run
`node <path>/dist/bridge.cjs`:

```json
{
  "command": "node",
  "args": ["/absolute/path/to/ableton-mcp-extension/dist/bridge.cjs"],
  "env": { "ABLETON_MCP_PORT": "20808", "ABLETON_MCP_TOKEN": "<token>" }
}
```

## What you can do

Everything runs against your open set and is undoable. A typical session — "call `get_set`
first to learn the IDs, then drill down" — covers:

| Use case                                                                    | Tools                                                                                            |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| **Inspect the set** — tempo, scale, tracks, scenes, clips, devices, mixer   | `get_set`, `get_track`, `get_clip`, `get_device`                                                 |
| **Compose MIDI** — create Session or Arrangement material with notes inline | `create_midi_clip`, `create_arrangement_midi_clip`, `replace_clip_notes`                         |
| **Edit MIDI surgically** — transpose, shift, thin, or add notes by filter   | `edit_clip_notes`                                                                                |
| **Arrange** — write timeline clips; manage tracks and scenes                | `create_arrangement_midi_clip`, `create_tracks`, `update_track`, `create_scenes`, `update_scene` |
| **Clips** — recolour, loop, rename, delete; import audio from a file        | `update_clip`, `delete_clips`, `create_audio_clip`                                               |
| **Sound design** — insert built-in devices and set their parameters         | `insert_device`, `set_device_params`, `get_device`, `delete_device`                              |
| **Mix** — volume, pan, and send levels across tracks in one step            | `set_mixer`                                                                                      |
| **Song settings** — tempo                                                   | `update_song`                                                                                    |

See [`docs/tools.md`](docs/tools.md) for the full parameter reference (generated from the
tool schemas), then [`docs/AGENT-MUSIC-GUIDE.md`](docs/AGENT-MUSIC-GUIDE.md) for the
musical workflow. What the Live API does **not** allow in this version — transport/playback
control, clip launch, track routing/color, third-party VST/AU loading, automation
envelopes — is documented in [`docs/capability-map.md`](docs/capability-map.md).

## Safety model

- **Every write is one named undo step** — one `Cmd/Ctrl-Z` reverts a whole tool call.
- **Writes are serialized across the server** — concurrent stateless HTTP requests cannot
  interleave Live mutations; a failed mutation does not poison the queue.
- **Batch writes are all-or-nothing** — every ID and value is validated up front; one bad
  entry means nothing changes.
- **Tools never throw to the client** — failures come back as structured results with a
  code (`NOT_FOUND`, `INVALID_INPUT`, `UNSUPPORTED`, `CONFLICT`, `INTERNAL`) and a recovery
  hint the model can act on.
- **Local and token-gated** — the server binds to `127.0.0.1`, validates the `Host`/`Origin`
  headers, and requires the bearer token on every request.
- **Token-economical** — reads are summary-by-default with drill-down tools; writes return
  minimal deltas; MIDI notes use a compact tuple format.
- **Filesystem-scoped** — the extension only touches its own storage/temp directories.
- **Capability-honest** — `ableton://capabilities` reports the active adapter, API/SDK
  versions, evidence level, exact tool effects, and known gaps; `ableton://set` is an
  explicitly snapshot-based Set resource.

## Developer workflow

Two tiers, depending on whether you have the Ableton Extensions SDK installed (see
[CONTRIBUTING.md](CONTRIBUTING.md) for the full breakdown):

```sh
# No Ableton / SDK required — this is what CI runs:
npm ci
npm test              # unit + component tests (real MCP client → server → fake Live)
npm run typecheck
npm run lint          # ESLint + architecture-boundary check
npm run dev:fake      # run the MCP server standalone against an in-memory fake Live

# Extension development (needs `npm run setup:sdk` first — see CONTRIBUTING.md):
npm run typecheck:sdk  # typecheck the SDK-facing code
npm start              # bundle + run inside real Ableton Live with Extensions enabled
npm run package        # bundle + produce the installable .ablx
```

The in-Live smoke procedure and release gate are in
[`docs/smoke-runbook.md`](docs/smoke-runbook.md).

## License

[MIT](LICENSE)
