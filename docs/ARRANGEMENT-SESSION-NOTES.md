# Arrangement workflow — real-Live validation, 2026-09-07

The musician works only in Arrangement View. Read the active track's `arrangementClips`,
choose a free timeline interval, and use `create_arrangement_midi_clip` with zero-based song
`startBeat`. Notes remain relative to the clip start. Overlap is a conflict, never replacement.
`get_clip` now returns the current view and human-readable location.

The updated development build created a 63-note MIDI clip in an unused Arrangement range
in real Live. Full note/position readback passed. Unit/component regression: 196 tests
passed; both TypeScript configurations, changed-source lint, format check and build passed.
Deletion/editing/overlap rejection have fake-adapter coverage; those new Arrangement paths
were not destructively smoke-tested in the user's Set. Both the Session and Arrangement
representations are retained.

The code adds Arrangement MIDI creation and reading/editing/deleting existing Arrangement
clips. It does not add Arrangement audio creation, audio automation, transport, reveal,
selection, or save. `get_set.clipCount` remains the Session count for compatibility;
`arrangementClipCount` is separate and omitted when zero. Arrangement summaries carry exact
`startBeat` and `endBeat`; derive timeline length from those. Legacy `lengthBeats` for unwarped
audio reflects the SDK's duration getter and may be in seconds.

The prior production-minified attachment connected at the host transport level without
advertising its HTTP endpoint. Rebuilding with `build.ts --dev` and attaching the official
Extension Host directly restored MCP. Do not equate CLI 'Connected to Live' with MCP health:
verify `tools/list` and `get_set`. Root cause of that startup discrepancy is still unproven.
The current attachment uses the installed Ableton ExtensionHost Node runtime and the same
initialization call emitted by the bundled CLI. Packaged installation remains unverified.

The session client in `scripts/session-client.ts` accepts existing token discovery, only sends
credentials to loopback, exits nonzero on tool errors, and never automatically retries a write.
All IDs are invalidated by reload: rediscover the Set, tracks, devices and clips first.

Computer use was needed to reveal a Session clip and activate Back to Arrangement. Those are
explicit gaps, not advertised capabilities. Local SDK beta.1 exposes no corresponding view or
transport controls. A future optional adapter should provide narrow `reveal_clip` and
`back_to_arrangement` actions with health/capability discovery and explicit user-visible effects.
