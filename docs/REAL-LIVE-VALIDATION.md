# Real Live validation log

## 2026-09-07 — SDK beta.1 with Live 12.4.15b1 on macOS

Host:

- Ableton Live 12 Beta `12.4.15b1 (2026-09-01_25bd7f807a)`
- Ableton Extensions SDK and CLI `1.0.0-beta.1`
- Development Extension Host attachment, not `.ablx` installation
- MCP client/server packages `2.0.0`

Observed successfully through the authenticated loopback MCP connection:

- Extension Host connected to Live and started `http://127.0.0.1:20808/mcp`.
- `get_set` read the untitled Set and returned stable opaque IDs.
- `update_song` changed tempo from 120 to 128 BPM.
- `create_tracks` added four MIDI tracks.
- Four native Drift instruments and one native Reverb were inserted.
- Device parameters and mixer volume/pan values were changed by name.
- Four 16-beat looping MIDI clips containing 100 notes total were created.
- Clip names/colors and the Scene name were changed.
- A targeted `get_set` readback confirmed the tempo, tracks, devices, clips, and Scene.
- Live's Session View showed all four clips as playing after Scene launch, and its track/Main
  meters showed real audio output.

The demonstration Scene is `MCP Minimal House — 128`, with `MCP Kick`, `MCP Hats`,
`MCP Bass`, and `MCP Chord` tracks. The Set was deliberately left untitled and unsaved.

### Control-path accounting

All musical state changes used MCP: 24 calls total, comprising two reads and 22 writes.
Those calls set tempo; created and named tracks, clips, and the Scene; wrote 100 notes;
inserted and shaped four Drift devices plus Reverb; set mixer values; and verified the
result.

Computer-use automation performed seven effective UI actions: open Settings, select the
Extensions page, enable Extensions, close Settings, switch to Session View, select the
Scene, and press Return to launch it. One terminal command attached the unpackaged
development extension. UI automation did not create or edit musical content. Max for
Live Developer Mode was enabled separately by the user but was not required for this run.

The steady-state target is an installed `.ablx` plus MCP for editing and an optional,
explicitly negotiated Max adapter for transport/launch/meters. First-time trust and
musician-chosen visual interaction remain human actions. See
[`AGENT-MUSIC-GUIDE.md`](AGENT-MUSIC-GUIDE.md).

### SDK/CLI observation

The beta.1 package metadata requires Node 24.16.0, while this Live build's bundled Node
reports 24.14.1. The exercised Extension nevertheless loaded and completed all operations
above. This is compatibility evidence, not proof for every SDK API.

The beta.1 CLI's `-v` path prints raw host lines before passing them through its connection
state parser. It therefore reports a false ten-second timeout even after the log contains
`FlipMessageStreamSocket send success`. Running the same command without `-v` connected
normally and stayed attached.

The fixed-path `connection.json` was successfully written during this development-host
run. An earlier host build denied the same out-of-sandbox path, so clients must still
support explicit URL/token configuration and must not treat auto-discovery as portable.

## 2026-09-07 — Arrangement follow-up

The updated beta.1 development build created a 63-note MIDI clip directly in an unused
Arrangement interval and read back its track, zero-based start/end beats, note count, and
full notes successfully. Existing Arrangement clips remained visible as a separate list
from Session slots. Editing, deleting, and overlap rejection passed against FakeLive but
were deliberately not exercised destructively in the user's real Set.

Computer use was still required to reveal a Session clip and activate Back to
Arrangement. View switching and reveal remain explicit gaps; they are not advertised as
official-adapter capabilities. See
[`ARRANGEMENT-SESSION-NOTES.md`](ARRANGEMENT-SESSION-NOTES.md).

### Still unverified

- Full 35-check in-Live self-test
- `.ablx` installation, update, and removal flow
- Set close/switch and cancellation behavior
- Large-Set latency and handle invalidation
- Windows behavior
