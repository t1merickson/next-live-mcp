# Ableton MCP prior-art ledger

Snapshot: 2026-09-07. The disposable local clones used for this survey were removed
after the findings and exact commits were verified. The full commit IDs and permanent
source links keep the research reproducible without retaining 143 MB of working trees.
See [`COMMUNITY-MCP-SOURCE-MAP.md`](COMMUNITY-MCP-SOURCE-MAP.md) for the high-value
implementation patterns and exact files worth reopening.

## Selection rule

A project is promising when it contributes at least one of: an official
Extensions-SDK runtime, real-Live evidence, meaningful automated tests, a hardened
local protocol, producer-level musical operations, audio feedback, or a clean
adapter boundary. Stars and headline tool counts are not proof.

Code can enter this project only when the source has a compatible license and the
specific behavior survives local tests. Repositories without a license remain
comparison-only.

## Commit-pinned corpus

| Project                                                                                   | Commit                                     | License    | What it contributes                                                                                           | Adoption                                                                    |
| ----------------------------------------------------------------------------------------- | ------------------------------------------ | ---------- | ------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| [idx3d/ableton-mcp-extension](https://github.com/idx3d/ableton-mcp-extension)             | `37ec2cb0a3d3577d36d47110d6010f1d9acd8c62` | MIT        | Official SDK adapter, authenticated Streamable HTTP, stateless transport, fake Live, real-beta smoke evidence | Executable spine; this project's tree retains the attributed starting code  |
| [OthmanAdi/loophole](https://github.com/OthmanAdi/loophole)                               | `cae93f433ecd85b801ac749bcd3926e370f02db7` | MIT        | Write queue, reference recovery, bounded results, producer transforms, one-undo discipline                    | Design source; serialization concept merged with an original implementation |
| [ulm0/ableton-live-mcp](https://gitlab.com/ulm0/ableton-live-mcp)                         | `a708580923bb00d0ab7aa6c511cbcad64bbdfa7f` | MIT        | Small official-SDK MCP implementation and CI                                                                  | Pinned minimal-host comparison                                              |
| [pnomolos/live-wire](https://github.com/pnomolos/live-wire)                               | `7fc8b06dd1c9a0d14bb7bbe4843160a03c93d8ec` | MIT        | Official Extension plus Max proxy split; transport and audio-analysis experiments                             | Candidate optional-adapter reference                                        |
| [user1303836/ableton-mcp-beyond](https://github.com/user1303836/ableton-mcp-beyond)       | `e3e04754442518a90988160231c92da84cac8cb9` | MIT        | Capability negotiation, authenticated bridge epochs, mutation authority, receipts, audio analysis             | Safety and capability design source                                         |
| [adamjmurray/producer-pal](https://github.com/adamjmurray/producer-pal)                   | `156b8386a9a805835feea57e05a46abdec4f491e` | MIT        | Mature Max-for-Live MCP, compact notation, producer workflows, extensive tests                                | Musical-language and workflow reference; not the trusted transport core     |
| [bschoepke/ableton-live-mcp](https://github.com/bschoepke/ableton-live-mcp)               | `70f7df9192b78d9bd9405f369c9e046c88f1610e` | MIT        | Remote Script bridge, Max audio tap, real workflow examples                                                   | Candidate audio/legacy adapter reference                                    |
| [rephlex187/Ableton-Live-MCP](https://github.com/rephlex187/Ableton-Live-MCP)             | `5e423f94929b2db536f0f513b23ddbb3e40202c3` | MIT        | Modular Remote Script dispatcher and paired contract tests                                                    | Candidate legacy adapter reference                                          |
| [wstierhout/ableton-live-mcp](https://github.com/wstierhout/ableton-live-mcp)             | `2e4413d316e63f3a501effcc051e9a981d4907ff` | MIT        | Broad typed Remote Script surface, workflow prompts, offline `.als` inspection                                | Tool-shaping and offline-analysis reference                                 |
| [ahujasid/ableton-mcp](https://github.com/ahujasid/ableton-mcp)                           | `8731a47a415f1590f50bdb3b4ac4f06d8328cf0b` | MIT        | Original category implementation and Live browser traversal                                                   | Historical baseline; targeted browser reference                             |
| [hidingwill/AbletonBridge](https://github.com/hidingwill/AbletonBridge)                   | `01c31c4ea4644588b62b1157b99cc885e27ec91f` | MIT        | Broad Remote Script command surface and ElevenLabs integration                                                | Capability inventory reference                                              |
| [jterratsdev/ableton-live-mcp](https://github.com/jterratsdev/ableton-live-mcp)           | `87519d288a65484dcfb1f0f53605e53484b08dc5` | MIT        | Bridge-neutral HTTP contract, product workflows, tests                                                        | Adapter-contract reference                                                  |
| [wolfiesch/Ableton-MCP](https://github.com/wolfiesch/Ableton-MCP)                         | `32ee12e631b62dad17cda1c43fd2e259b28a367e` | MIT        | Packaged Remote Script installer, tools, and tests                                                            | Legacy installation reference                                               |
| [nicholasbien/ableton-mcp-pro](https://github.com/nicholasbien/ableton-mcp-pro)           | `0d56baae49e2d11efa9ac141b2ce1af451942065` | MIT        | Concise Remote Script surface covering transport, automation, and arrangement                                 | Capability comparison; zero tests at snapshot                               |
| [jasper-zheng/ableton-sdk-mcp](https://github.com/jasper-zheng/ableton-sdk-mcp)           | `f74fa5088cec3ff35b36cfab45b56caf93359de6` | none found | Official-SDK experiment and kernel/server split                                                               | Comparison only; no code reuse                                              |
| [bassDaddyDevices/able-mcp](https://github.com/bassDaddyDevices/able-mcp)                 | `03c08892d7a93e28bdbae7faf2cf6499872724e0` | none found | Extension/WebSocket bridge plus Python host                                                                   | Comparison only; no code reuse                                              |
| [jon-wrennall/ableton-mcp-extended](https://github.com/jon-wrennall/ableton-mcp-extended) | `9d8302c6a307ccf1e0354d0ac6f0dc08d908f247` | none found | Hybrid parameter bridge, browser search, device snapshots                                                     | Comparison only; no code reuse                                              |

## Surveyed but not imported

- `Simon-Kansara/ableton-live-mcp-server` and `FabianTinkl/AbletonMCP`: OSC-based
  approaches add another transport without stronger testing or safety evidence than
  the retained adapter candidates.
- `IAmMarcellus/ableton-mcp`: an enhanced fork in the original Remote Script family;
  the pinned projects cover that lineage with stronger current tests or cleaner splits.
- `the3asic/ableton-extensions-sdk-agent-skill`: useful development guidance, but not
  an MCP implementation.

## Integration decisions so far

1. Official Extensions SDK beta.1 is the default trusted Live-side adapter.
2. MCP remains outside the port and domain layers; only `adapters/sdk-*` imports
   Ableton packages.
3. Every tool declares whether it reads or writes. Writes from all stateless HTTP
   requests share one failure-tolerant FIFO mutation queue.
4. MCP tool annotations expose read-only and destructive hints. They are descriptive
   metadata, never an authorization mechanism.
5. Remote Script, Max for Live, audio analysis, transport, browser, and automation
   belong behind explicit optional capabilities. They must never silently widen the
   official adapter's authority.
6. The MCP transport uses the split, stable `@modelcontextprotocol/client` and
   `@modelcontextprotocol/server` v2 packages with Zod 4. The older monolithic v1
   package and its generic web-server dependency tree are not retained.

## Implemented from the synthesis

- `ableton://capabilities` exposes adapter provenance, evidence, exact tool effects,
  queue state, known SDK gaps, and the status of optional adapter families.
- `ableton://set` exposes a compact, bounded snapshot and explicitly warns clients that
  metadata and identifiers are session-scoped rather than durable truth.
- Every write runs through one shared, failure-tolerant FIFO queue.
- Read-only, destructive, and idempotency hints are attached to the MCP tool registry.

## Next integrations

- Add revision-bound preview and one-use commit authority for destructive workflows.
- Add receipts that include verified readback and an honest undo statement.
- Port only pure, tested musical transforms first: scale lock, humanize, compact note
  notation, and arrangement planning.
- Define optional adapter contracts before importing any Remote Script or Max code.
